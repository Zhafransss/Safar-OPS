import "server-only";

import { TRPCError } from "@trpc/server";

import { isOwnerEmail } from "@/config/owners";
import type { Prisma } from "@/generated/prisma/client";
import {
  DUE,
  dueRank,
  findRevisionError,
  findTaskError,
  findTodoError,
  isTaskVisible,
  progressOf,
  worstDue,
  worstDueSummary,
  type ProgramStatus,
  type TodoDraft,
} from "@/lib/assignment-rules";
import { formatDate, formatIsoShort, formatShortDate, jakartaIsoDate } from "@/lib/date";
import { canSeeReport, REPORT_TYPES, STATUS_LABEL } from "@/lib/report-rules";
import { db } from "@/server/db";
import { notify } from "@/server/services/notifications";
import { activeTaskWhere } from "@/server/services/task-scope";
import { pngError } from "@/server/trpc";

type Tx = Prisma.TransactionClient;
type CurrentUser = { id: string; name: string; email: string };

const today = () => jakartaIsoDate(new Date());
// Prisma returns a @db.Date as UTC midnight, so the first 10 characters are the stored date.
const isoOf = (date: Date) => date.toISOString().slice(0, 10);
const dateOf = (iso: string) => new Date(`${iso}T00:00:00Z`);

const canManage = (user: CurrentUser, leaderId: string) => isOwnerEmail(user.email) || leaderId === user.id;

function dueFields(todo: { isDone: boolean; dueDate: Date }) {
  return { isDone: todo.isDone, dueIso: isoOf(todo.dueDate) };
}

const programInclude = {
  team: { select: { id: true, name: true, color: true, leaderId: true, leader: { select: { name: true } } } },
  createdBy: { select: { name: true } },
  tasks: {
    where: activeTaskWhere,
    orderBy: { createdAt: "asc" },
    include: {
      createdBy: { select: { name: true } },
      report: { select: { number: true } },
      todos: { select: { picId: true, isDone: true, dueDate: true, needsReassign: true } },
    },
  },
} as const;

type LoadedProgram = Prisma.ProgramGetPayload<{ include: typeof programInclude }>;

function visibleTasks(program: LoadedProgram, user: CurrentUser) {
  const manager = canManage(user, program.team.leaderId);
  return program.tasks.filter((task) => isTaskVisible(manager, task.todos, user.id));
}

// Mockup progFlags: only for active programs, built from open tasks the viewer can see.
function programFlags(program: LoadedProgram, user: CurrentUser) {
  if (program.status !== "ACTIVE") return [];
  const todos = visibleTasks(program, user)
    .filter((task) => !task.qcApprovedAt)
    .flatMap((task) => task.todos);
  const flags: { text: string; badge: string }[] = [];
  const level = DUE[worstDue(todos.map(dueFields), today())];
  if (level) flags.push({ text: `Ada tugas dengan to-do ${level.word}`, badge: level.badge });
  if (todos.some((todo) => todo.needsReassign)) flags.push({ text: "Ada to-do perlu dialihkan", badge: "b-red" });
  return flags;
}

export async function getProgramList(user: CurrentUser) {
  const [programs, ledTeam] = await Promise.all([
    db.program.findMany({ include: programInclude, orderBy: { createdAt: "asc" } }),
    db.team.findUnique({ where: { leaderId: user.id }, select: { id: true } }),
  ]);

  const visible = programs.filter(
    (program) => canManage(user, program.team.leaderId) || visibleTasks(program, user).length > 0,
  );

  return {
    canCreate: isOwnerEmail(user.email) || ledTeam !== null,
    programs: visible.map((program) => {
      const tasks = visibleTasks(program, user);
      const done = tasks.filter((task) => task.qcApprovedAt).length;
      return {
        id: program.id,
        name: program.name,
        status: program.status,
        team: { name: program.team.name, color: program.team.color },
        created: formatShortDate(program.createdAt),
        doneTasks: done,
        totalTasks: tasks.length,
        percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
        flags: programFlags(program, user),
      };
    }),
  };
}

export type ProgramCard = Awaited<ReturnType<typeof getProgramList>>["programs"][number];

export async function getProgramForm(user: CurrentUser) {
  const isOwner = isOwnerEmail(user.email);
  const [teams, ledTeam] = await Promise.all([
    isOwner ? db.team.findMany({ orderBy: { createdAt: "asc" } }) : Promise.resolve([]),
    db.team.findUnique({ where: { leaderId: user.id } }),
  ]);
  if (!isOwner && !ledTeam) return null;
  const pick = (team: { id: string; name: string; color: string }) => ({ id: team.id, name: team.name, color: team.color });
  return { isOwner, teams: teams.map(pick), ledTeam: ledTeam ? pick(ledTeam) : null };
}

export async function createProgram(input: { name: string; teamId: string | null }, user: CurrentUser) {
  const isOwner = isOwnerEmail(user.email);
  const ledTeam = await db.team.findUnique({ where: { leaderId: user.id } });
  if (!isOwner && !ledTeam) throw pngError("PNG-PRG-04", "FORBIDDEN");

  const name = input.name.trim();
  if (!name) throw pngError("PNG-PRG-01");
  // K-T32: a leader can only create programs for their own team, whatever the request says.
  const teamId = isOwner ? input.teamId : (ledTeam?.id ?? null);
  const team = teamId ? await db.team.findUnique({ where: { id: teamId } }) : null;
  if (!team) throw pngError("PNG-PRG-02");

  return db.$transaction(async (tx) => {
    const program = await tx.program.create({ data: { name, teamId: team.id, createdById: user.id } });
    await notify(tx, {
      userId: team.leaderId,
      actorId: user.id,
      category: "ASSIGNMENT",
      text: `Program baru untuk timmu: ${name}`,
      targetType: "PROGRAM",
      targetId: program.id,
    });
    return { id: program.id };
  });
}

export async function getProgramDetail(id: string, user: CurrentUser) {
  const program = await db.program.findUnique({ where: { id }, include: programInclude });
  if (!program) return null;

  const manager = canManage(user, program.team.leaderId);
  const tasks = visibleTasks(program, user);
  if (!manager && tasks.length === 0) return { denied: true as const };

  const todayIso = today();
  const cards = tasks.map((task) => {
    const closed = task.qcApprovedAt !== null;
    const progress = progressOf(task.todos, closed);
    const flags: { text: string; badge: string }[] = [];
    if (!closed) {
      const summary = worstDueSummary(task.todos.map(dueFields), todayIso);
      if (summary) flags.push(summary);
      const reassign = task.todos.filter((todo) => todo.needsReassign).length;
      if (reassign) flags.push({ text: `${reassign} to-do perlu dialihkan`, badge: "b-red" });
    }
    return {
      id: task.id,
      name: task.name,
      closed,
      created: formatShortDate(task.createdAt),
      createdBy: task.createdBy.name,
      reportNumber: task.report?.number ?? null,
      progress,
      flags,
    };
  });

  return {
    denied: false as const,
    id: program.id,
    name: program.name,
    status: program.status,
    team: { name: program.team.name, color: program.team.color },
    leaderName: program.team.leader.name,
    created: formatDate(program.createdAt),
    createdBy: program.createdBy.name,
    canManage: manager,
    isLeader: program.team.leaderId === user.id,
    flags: programFlags(program, user),
    openTasks: cards.filter((card) => !card.closed),
    closedTasks: cards.filter((card) => card.closed),
  };
}

export type ProgramDetailData = Extract<NonNullable<Awaited<ReturnType<typeof getProgramDetail>>>, { denied: false }>;

async function withProgram<T>(id: string, user: CurrentUser, run: (tx: Tx, program: { id: string; teamId: string }) => Promise<T>) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Program" WHERE id = ${id} FOR UPDATE`;
    const program = await tx.program.findUnique({ where: { id }, include: { team: true } });
    if (!program) throw new TRPCError({ code: "NOT_FOUND" });
    // K-T53: closing and cancelling belong to the team leader, not to owners.
    if (program.team.leaderId !== user.id || program.status !== "ACTIVE") throw pngError("PNG-PRG-04", "FORBIDDEN");
    return run(tx, program);
  });
}

export async function closeProgram(id: string, user: CurrentUser): Promise<void> {
  await withProgram(id, user, async (tx, program) => {
    const open = await tx.task.count({ where: { programId: program.id, ...activeTaskWhere, qcApprovedAt: null } });
    if (open > 0) throw pngError("PNG-PRG-03");
    await tx.program.update({ where: { id: program.id }, data: { status: "DONE" } });
  });
}

export async function cancelProgram(id: string, user: CurrentUser): Promise<void> {
  await withProgram(id, user, async (tx, program) => {
    await tx.program.update({ where: { id: program.id }, data: { status: "CANCELLED" } });
  });
}

function teamMembers(team: { leader: { id: string; name: string }; members: { user: { id: string; name: string } }[] }) {
  return [
    { id: team.leader.id, name: team.leader.name, isLeader: true },
    ...team.members.map((member) => ({ id: member.user.id, name: member.user.name, isLeader: false })),
  ];
}

const teamWithMembers = {
  leader: { select: { id: true, name: true } },
  members: { include: { user: { select: { id: true, name: true } } }, orderBy: { sortOrder: "asc" } },
} as const;

export type TeamMemberOption = ReturnType<typeof teamMembers>[number];

async function attachableReports(user: CurrentUser) {
  const reports = await db.report.findMany({
    where: { status: { in: ["SENT", "IN_PROGRESS"] } },
    include: {
      from: { select: { name: true } },
      to: { select: { name: true } },
      ccs: { select: { userId: true } },
      photos: { orderBy: { sortOrder: "asc" }, select: { id: true } },
    },
    orderBy: { number: "desc" },
  });
  const leaders = await db.team.findMany({ select: { leaderId: true, members: { select: { userId: true } } } });
  const isOwner = isOwnerEmail(user.email);

  return reports
    .filter((report) =>
      canSeeReport(
        { fromId: report.fromId, toId: report.toId, status: report.status, ccIds: report.ccs.map((cc) => cc.userId) },
        {
          id: user.id,
          isOwner,
          recipientLeaderIds: leaders
            .filter((team) => team.members.some((member) => member.userId === report.toId))
            .map((team) => team.leaderId),
        },
      ),
    )
    .map(reportPopup);
}

function reportPopup(report: {
  number: string;
  title: string;
  type: string;
  body: string;
  status: keyof typeof STATUS_LABEL;
  createdAt: Date;
  from: { name: string };
  to: { name: string };
  photos: { id: string }[];
}) {
  return {
    number: report.number,
    title: report.title,
    typeLabel: REPORT_TYPES.find((type) => type.value === report.type)?.label ?? report.type,
    body: report.body,
    status: report.status,
    fromName: report.from.name,
    toName: report.to.name,
    created: formatDate(report.createdAt),
    photoIds: report.photos.map((photo) => photo.id),
  };
}

export type ReportPopupData = ReturnType<typeof reportPopup>;

export async function getTaskForm(programId: string, user: CurrentUser) {
  const program = await db.program.findUnique({
    where: { id: programId },
    include: { team: { include: { ...teamWithMembers, templates: { include: { todos: { orderBy: { sortOrder: "asc" } } }, orderBy: { createdAt: "asc" } } } } },
  });
  if (!program) return null;
  if (!canManage(user, program.team.leaderId) || program.status !== "ACTIVE") return { denied: true as const };

  return {
    denied: false as const,
    programId: program.id,
    programName: program.name,
    leaderName: program.team.leader.name,
    members: teamMembers(program.team),
    templates: program.team.templates.map((template) => ({
      id: template.id,
      name: template.name,
      todos: template.todos.map((todo) => todo.name),
    })),
    reports: await attachableReports(user),
  };
}

export type TaskFormData = Extract<NonNullable<Awaited<ReturnType<typeof getTaskForm>>>, { denied: false }>;

const uniquePics = (todos: readonly { picId: string }[]) => [...new Set(todos.map((todo) => todo.picId))];

function taskLog(tx: Tx, taskId: string, actor: CurrentUser, text: string) {
  return tx.activityLog.create({
    data: { entityType: "TASK", entityId: taskId, actorId: actor.id, text: `${actor.name} ${text}` },
  });
}

function notifyTask(tx: Tx, userId: string, actorId: string, text: string, taskId: string) {
  return notify(tx, { userId, actorId, category: "ASSIGNMENT", text, targetType: "TASK", targetId: taskId });
}

export async function createTask(
  input: { programId: string; name: string; reportNumber: string | null; todos: TodoDraft[] },
  user: CurrentUser,
): Promise<{ id: string }> {
  const form = await getTaskForm(input.programId, user);
  if (!form) throw new TRPCError({ code: "NOT_FOUND" });
  if (form.denied) throw pngError("PNG-PRG-04", "FORBIDDEN");

  const memberIds = new Set(form.members.map((member) => member.id));
  const error = findTaskError(input.name, input.todos, today(), (id) => memberIds.has(id));
  if (error) throw pngError(error.code, "BAD_REQUEST", error.params);
  // The list already applies "can see" and "not closed", so anything else is refused (K-T04).
  if (input.reportNumber && !form.reports.some((report) => report.number === input.reportNumber)) {
    throw pngError("PNG-LAP-11", "FORBIDDEN");
  }

  const name = input.name.trim();
  return db.$transaction(async (tx) => {
    const report = input.reportNumber ? await tx.report.findUnique({ where: { number: input.reportNumber } }) : null;
    const task = await tx.task.create({
      data: {
        programId: input.programId,
        name,
        reportId: report?.id ?? null,
        createdById: user.id,
        todos: {
          create: input.todos.map((todo, sortOrder) => ({
            sortOrder,
            name: todo.name.trim(),
            picId: todo.picId,
            dueDate: dateOf(todo.dueIso),
            instruction: todo.instruction.trim() || null,
          })),
        },
      },
    });
    await taskLog(tx, task.id, user, "membuat tugas");

    if (report) {
      // K-T05: attaching a sent report moves it to in progress automatically.
      if (report.status === "SENT") {
        await tx.report.update({ where: { id: report.id }, data: { status: "IN_PROGRESS" } });
        await tx.reportMessage.create({
          data: { reportId: report.id, isSystem: true, body: `Status otomatis Ditindaklanjuti: sudah ada Tugas "${name}"` },
        });
      }
      await tx.activityLog.create({
        data: {
          entityType: "REPORT",
          entityId: report.id,
          actorId: user.id,
          text: `${user.name} melampirkan laporan ke tugas ${name}`,
        },
      });
      await notify(tx, {
        userId: report.fromId,
        actorId: user.id,
        category: "REPORT",
        text: `${report.number} sudah ada Tugas: ${name}`,
        targetType: "REPORT",
        targetId: report.number,
      });
    }

    for (const picId of uniquePics(input.todos)) {
      await notifyTask(tx, picId, user.id, `To-do baru di "${name}"`, task.id);
    }
    return { id: task.id };
  });
}

const taskInclude = {
  program: { include: { team: { include: teamWithMembers } } },
  createdBy: { select: { name: true } },
  report: {
    include: {
      from: { select: { name: true } },
      to: { select: { name: true } },
      photos: { orderBy: { sortOrder: "asc" }, select: { id: true } },
    },
  },
  todos: {
    orderBy: { sortOrder: "asc" },
    include: {
      pic: { select: { name: true } },
      revisionNotes: { orderBy: { createdAt: "desc" }, take: 1, select: { note: true } },
    },
  },
} as const;

export async function getTaskDetail(id: string, user: CurrentUser) {
  const task = await db.task.findFirst({ where: { id, ...activeTaskWhere }, include: taskInclude });
  if (!task) return null;

  const { program } = task;
  const { team } = program;
  const manager = canManage(user, team.leaderId);
  if (!isTaskVisible(manager, task.todos, user.id)) return { denied: true as const };

  const closed = task.qcApprovedAt !== null;
  const locked = closed || program.status !== "ACTIVE";
  const todayIso = today();
  const logs = await db.activityLog.findMany({
    where: { entityType: "TASK", entityId: task.id },
    orderBy: { createdAt: "asc" },
  });
  const summary = closed ? null : worstDueSummary(task.todos.map(dueFields), todayIso);

  return {
    denied: false as const,
    id: task.id,
    name: task.name,
    programId: program.id,
    programName: program.name,
    programStatus: program.status as ProgramStatus,
    team: { name: team.name, color: team.color },
    leaderName: team.leader.name,
    created: formatDate(task.createdAt),
    createdBy: task.createdBy.name,
    closed,
    locked,
    canManage: manager,
    isLeader: team.leaderId === user.id,
    allDone: task.todos.length > 0 && task.todos.every((todo) => todo.isDone),
    progress: progressOf(task.todos, closed),
    summary,
    report: task.report ? reportPopup(task.report) : null,
    members: teamMembers(team),
    logs: logs.map((log) => ({ id: log.id, text: `${formatShortDate(log.createdAt)} · ${log.text}` })),
    todos: task.todos.map((todo) => {
      const dueIso = isoOf(todo.dueDate);
      const level = DUE[dueRank({ isDone: todo.isDone, dueIso }, todayIso)];
      return {
        id: todo.id,
        name: todo.name,
        picId: todo.picId,
        picName: todo.pic.name,
        mine: todo.picId === user.id,
        dueIso,
        dueShort: formatIsoShort(dueIso),
        due: level ? { label: level.label, badge: level.badge } : null,
        isDone: todo.isDone,
        revisionCount: todo.revisionCount,
        revisionNote: todo.revisionNotes[0]?.note ?? null,
        needsReassign: todo.needsReassign,
        instruction: todo.instruction ?? "",
      };
    }),
  };
}

export type TaskDetailData = Extract<NonNullable<Awaited<ReturnType<typeof getTaskDetail>>>, { denied: false }>;

type LockedTask = NonNullable<Awaited<ReturnType<typeof loadLockedTask>>>;

async function loadLockedTask(tx: Tx, id: string) {
  return tx.task.findFirst({
    where: { id, ...activeTaskWhere },
    include: {
      program: { include: { team: { include: teamWithMembers } } },
      todos: { orderBy: { sortOrder: "asc" }, include: { pic: { select: { name: true } } } },
    },
  });
}

// Row lock: ticks and QC on one task run one after the other, so "all done" is decided once (NFR-05).
async function withTask<T>(id: string, run: (tx: Tx, task: LockedTask) => Promise<T>): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Task" WHERE id = ${id} FOR UPDATE`;
    const task = await loadLockedTask(tx, id);
    if (!task) throw new TRPCError({ code: "NOT_FOUND" });
    return run(tx, task);
  });
}

const isLocked = (task: LockedTask) => task.qcApprovedAt !== null || task.program.status !== "ACTIVE";

function assertCanEditTodos(task: LockedTask, user: CurrentUser) {
  if (!canManage(user, task.program.team.leaderId) || isLocked(task)) throw pngError("PNG-TDO-05", "FORBIDDEN");
}

export async function removeTask(id: string, user: CurrentUser): Promise<{ programId: string }> {
  return withTask(id, async (tx, task) => {
    if (!canManage(user, task.program.team.leaderId)) throw pngError("PNG-TGS-03", "FORBIDDEN");
    if (isLocked(task)) throw pngError("PNG-TGS-04");
    await tx.task.update({ where: { id }, data: { deletedAt: new Date(), deletedById: user.id } });
    await taskLog(tx, id, user, "menghapus tugas");
    for (const picId of uniquePics(task.todos)) {
      await notify(tx, {
        userId: picId,
        actorId: user.id,
        category: "ASSIGNMENT",
        text: `"${task.name}" dihapus`,
        targetType: "ASSIGNMENT_LIST",
      });
    }
    return { programId: task.programId };
  });
}

export async function toggleTodo(todoId: string, user: CurrentUser): Promise<{ done: boolean }> {
  const found = await db.todo.findUnique({ where: { id: todoId }, select: { taskId: true } });
  if (!found) throw new TRPCError({ code: "NOT_FOUND" });

  return withTask(found.taskId, async (tx, task) => {
    const todo = task.todos.find((candidate) => candidate.id === todoId);
    // K-T36, K-T37: only the PIC, and only until QC is approved.
    if (!todo || todo.picId !== user.id || isLocked(task)) throw pngError("PNG-TDO-05", "FORBIDDEN");

    const done = !todo.isDone;
    await tx.todo.update({ where: { id: todoId }, data: { isDone: done } });
    await taskLog(tx, task.id, user, `${done ? "mencentang" : "membatalkan centang"} "${todo.name}"`);
    const allDone = task.todos.every((candidate) => (candidate.id === todoId ? done : candidate.isDone));
    if (done && allDone) {
      await notifyTask(tx, task.program.team.leaderId, user.id, `"${task.name}" siap di-QC`, task.id);
    }
    return { done };
  });
}

function assignableCheck(task: LockedTask) {
  const ids = new Set(teamMembers(task.program.team).map((member) => member.id));
  return (id: string) => ids.has(id);
}

export async function addTodo(input: TodoDraft & { taskId: string }, user: CurrentUser): Promise<void> {
  await withTask(input.taskId, async (tx, task) => {
    assertCanEditTodos(task, user);
    const error = findTodoError([input], today(), assignableCheck(task));
    if (error) throw pngError(error.code, "BAD_REQUEST", error.params);

    const name = input.name.trim();
    const last = task.todos.at(-1);
    await tx.todo.create({
      data: {
        taskId: task.id,
        sortOrder: (last?.sortOrder ?? -1) + 1,
        name,
        picId: input.picId,
        dueDate: dateOf(input.dueIso),
        instruction: input.instruction.trim() || null,
      },
    });
    await taskLog(tx, task.id, user, `menambah "${name}"`);
    await notifyTask(tx, input.picId, user.id, `To-do baru di "${task.name}"`, task.id);
  });
}

export async function updateTodo(input: TodoDraft & { todoId: string }, user: CurrentUser): Promise<void> {
  const found = await db.todo.findUnique({ where: { id: input.todoId }, select: { taskId: true } });
  if (!found) throw new TRPCError({ code: "NOT_FOUND" });

  await withTask(found.taskId, async (tx, task) => {
    assertCanEditTodos(task, user);
    const todo = task.todos.find((candidate) => candidate.id === input.todoId);
    if (!todo) throw new TRPCError({ code: "NOT_FOUND" });

    const previousDue = isoOf(todo.dueDate);
    const error = findTodoError([input], today(), assignableCheck(task), previousDue);
    if (error) throw pngError(error.code, "BAD_REQUEST", error.params);

    const name = input.name.trim();
    const instruction = input.instruction.trim();
    const members = teamMembers(task.program.team);
    const newPicName = members.find((member) => member.id === input.picId)?.name ?? "";

    // Same wording and order as the mockup editTodo history line.
    const changes: string[] = [];
    if (input.picId !== todo.picId) changes.push(`PIC ${todo.pic.name} → ${newPicName}`);
    if (input.dueIso !== previousDue) changes.push(`DL ${formatIsoShort(previousDue)} → ${formatIsoShort(input.dueIso)}`);
    if (name !== todo.name) changes.push("nama");
    if (instruction !== (todo.instruction ?? "")) changes.push("arahan");

    await tx.todo.update({
      where: { id: todo.id },
      data: {
        name,
        picId: input.picId,
        dueDate: dateOf(input.dueIso),
        instruction: instruction || null,
        needsReassign: false,
      },
    });
    if (input.picId !== todo.picId) {
      await notifyTask(tx, input.picId, user.id, `To-do dialihkan ke Anda: "${name}"`, task.id);
    }
    if (changes.length) await taskLog(tx, task.id, user, `mengubah "${name}": ${changes.join(", ")}`);
  });
}

export async function moveTodo(todoId: string, direction: -1 | 1, user: CurrentUser): Promise<void> {
  const found = await db.todo.findUnique({ where: { id: todoId }, select: { taskId: true } });
  if (!found) throw new TRPCError({ code: "NOT_FOUND" });

  await withTask(found.taskId, async (tx, task) => {
    assertCanEditTodos(task, user);
    const index = task.todos.findIndex((candidate) => candidate.id === todoId);
    const current = task.todos[index];
    const neighbor = task.todos[index + direction];
    if (!current || !neighbor) return;
    await tx.todo.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } });
    await tx.todo.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } });
    await taskLog(tx, task.id, user, `menggeser "${current.name}"`);
  });
}

export async function removeTodo(todoId: string, user: CurrentUser): Promise<void> {
  const found = await db.todo.findUnique({ where: { id: todoId }, select: { taskId: true } });
  if (!found) throw new TRPCError({ code: "NOT_FOUND" });

  await withTask(found.taskId, async (tx, task) => {
    assertCanEditTodos(task, user);
    // CHANGELOG 3: a task without to-dos could never pass QC and would block closing the program.
    if (task.todos.length <= 1) throw pngError("PNG-TGS-02");
    const todo = task.todos.find((candidate) => candidate.id === todoId);
    if (!todo) throw new TRPCError({ code: "NOT_FOUND" });
    await tx.todo.delete({ where: { id: todoId } });
    await taskLog(tx, task.id, user, `menghapus "${todo.name}"`);
  });
}

function assertCanQc(task: LockedTask, user: CurrentUser) {
  // K-T11: QC is the team leader's alone, and QC is computed from the current leader (CHANGELOG 10).
  if (task.program.team.leaderId !== user.id) throw pngError("PNG-QC-03", "FORBIDDEN");
  const ready = task.todos.length > 0 && task.todos.every((todo) => todo.isDone);
  if (isLocked(task) || !ready) throw pngError("PNG-TDO-05", "FORBIDDEN");
}

export async function approveQc(taskId: string, user: CurrentUser): Promise<void> {
  await withTask(taskId, async (tx, task) => {
    assertCanQc(task, user);
    await tx.task.update({ where: { id: taskId }, data: { qcApprovedAt: new Date(), qcApprovedById: user.id } });
    await taskLog(tx, taskId, user, "approve QC · tugas selesai");
    for (const picId of uniquePics(task.todos)) {
      await notifyTask(tx, picId, user.id, `"${task.name}" lolos QC`, taskId);
    }
  });
}

export async function returnForRevision(
  taskId: string,
  picks: { todoId: string; note: string }[],
  user: CurrentUser,
): Promise<{ count: number }> {
  return withTask(taskId, async (tx, task) => {
    assertCanQc(task, user);
    const selected = picks.map((pick) => ({ ...pick, todo: task.todos.find((todo) => todo.id === pick.todoId) }));
    const error = findRevisionError(selected.map((pick) => ({ todoName: pick.todo?.name ?? "", note: pick.note })));
    if (error) throw pngError(error.code, "BAD_REQUEST", error.params);

    for (const { todo, note } of selected) {
      if (!todo) throw new TRPCError({ code: "NOT_FOUND" });
      await tx.todo.update({ where: { id: todo.id }, data: { isDone: false, revisionCount: { increment: 1 } } });
      await tx.revisionNote.create({ data: { todoId: todo.id, note: note.trim(), createdById: user.id } });
      await notifyTask(tx, todo.picId, user.id, `Revisi: "${todo.name}" di "${task.name}"`, taskId);
    }
    await taskLog(tx, taskId, user, `mengembalikan ${selected.length} to-do untuk revisi`);
    return { count: selected.length };
  });
}

// K-T04: a PIC may read the report attached to their task, photos included, without being a participant.
export async function canViewViaTask(reportId: string, user: CurrentUser): Promise<boolean> {
  const tasks = await db.task.findMany({
    where: { reportId, ...activeTaskWhere },
    include: { program: { include: { team: { select: { leaderId: true } } } }, todos: { select: { picId: true } } },
  });
  return tasks.some((task) => isTaskVisible(canManage(user, task.program.team.leaderId), task.todos, user.id));
}
