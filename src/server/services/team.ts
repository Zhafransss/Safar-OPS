import "server-only";

import { TRPCError } from "@trpc/server";

import { isOwnerEmail, OWNERS, placeholderName } from "@/config/owners";
import { TEAM_PALETTE } from "@/config/team-palette";
import { db } from "@/server/db";
import { loadInitialsResolver } from "@/server/services/names";
import { notify } from "@/server/services/notifications";
import { activeTaskWhere } from "@/server/services/task-scope";
import { activeTeamWhere } from "@/server/services/team-scope";
import { findTeamError, firstFreeColor, normalizeDraft, type TeamDraft } from "@/server/services/team-rules";
import type { TeamRole } from "@/server/services/viewer";
import { pngError } from "@/server/trpc";

export type PickerUser = { id: string; name: string; isOwner: boolean; teamRoles: TeamRole[] };

const teamInclude = {
  leader: { select: { id: true, name: true } },
  members: { include: { user: { select: { id: true, name: true } } }, orderBy: { sortOrder: "asc" } },
} as const;

function loadTeams() {
  return db.team.findMany({ where: activeTeamWhere, include: teamInclude, orderBy: { createdAt: "asc" } });
}

type LoadedTeam = Awaited<ReturnType<typeof loadTeams>>[number];

async function loadAssignableUsers() {
  const users = await db.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  return users.filter((user) => !isOwnerEmail(user.email));
}

// Mockup roleHTML: the led team first, then staff teams in team order.
function rolesOf(userId: string, teams: readonly LoadedTeam[]): TeamRole[] {
  const led = teams
    .filter((team) => team.leaderId === userId)
    .map((team) => ({ role: "Leader" as const, teamName: team.name, color: team.color }));
  const staff = teams
    .filter((team) => team.members.some((member) => member.userId === userId))
    .map((team) => ({ role: "Staff" as const, teamName: team.name, color: team.color }));
  return [...led, ...staff];
}

// Owner emails are known up front, so they are listed and selectable before their first login.
// Their name is a placeholder until that login brings Jubelio's name (U-01). A fixed owner name
// also replaces whatever an earlier version stored, without waiting for a login (CHANGELOG 49).
async function ensureOwnerUsers() {
  await db.user.createMany({
    data: OWNERS.map((owner) => ({ email: owner.email, name: placeholderName(owner) })),
    skipDuplicates: true,
  });
  for (const { email, name } of OWNERS) {
    if (name) await db.user.updateMany({ where: { email, NOT: { name } }, data: { name } });
  }
}

export async function getTeamChart() {
  await ensureOwnerUsers();
  const [teams, initialsOf, ownerUsers] = await Promise.all([
    loadTeams(),
    loadInitialsResolver(),
    db.user.findMany({ where: { email: { in: OWNERS.map((owner) => owner.email) } }, select: { email: true, name: true } }),
  ]);
  const ownerName = (email: string) => ownerUsers.find((user) => user.email === email)?.name ?? email;

  return {
    owners: OWNERS.map((owner) => {
      const name = ownerName(owner.email);
      return { name, initials: initialsOf(name) };
    }),
    paletteFull: firstFreeColor(teams.map((team) => team.color)) === null,
    teams: teams.map((team) => ({
      id: team.id,
      name: team.name,
      color: team.color,
      leader: { name: team.leader.name, initials: initialsOf(team.leader.name) },
      staff: team.members.map((member) => ({
        id: member.userId,
        name: member.user.name,
        initials: initialsOf(member.user.name),
        // Mockup vTim: "rangkap" means the person also sits in another team, as staff or leader.
        isDoubleRole: teams.some(
          (other) =>
            other.id !== team.id &&
            (other.leaderId === member.userId || other.members.some((m) => m.userId === member.userId)),
        ),
      })),
    })),
  };
}

// Open work of a team: tasks not deleted, not passed QC, in an active program.
function openTaskInTeam(teamId: string) {
  return { ...activeTaskWhere, qcApprovedAt: null, program: { teamId, status: "ACTIVE" as const } };
}

export async function getTeamFormData(teamId: string | null) {
  const [teams, users, openTodos, activePrograms, templateCount] = await Promise.all([
    loadTeams(),
    loadAssignableUsers(),
    teamId
      ? db.todo.groupBy({
          by: ["picId"],
          where: { isDone: false, task: openTaskInTeam(teamId) },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    // U-09: what deleting the team would be blocked by, and what it takes with it.
    teamId ? db.program.count({ where: { teamId, status: "ACTIVE" } }) : Promise.resolve(0),
    teamId ? db.template.count({ where: { teamId } }) : Promise.resolve(0),
  ]);
  const team = teamId ? teams.find((candidate) => candidate.id === teamId) : undefined;
  if (teamId && !team) return null;

  return {
    activePrograms,
    templateCount,
    openTodoCounts: Object.fromEntries(openTodos.map((row) => [row.picId, row._count._all])) as Record<string, number>,
    team: team
      ? {
          id: team.id,
          name: team.name,
          color: team.color,
          leaderId: team.leaderId,
          staffIds: team.members.map((member) => member.userId),
        }
      : null,
    usedColors: teams
      .filter((candidate) => candidate.id !== teamId)
      .map((candidate) => ({ color: candidate.color, teamName: candidate.name })),
    defaultColor: firstFreeColor(teams.map((candidate) => candidate.color)) ?? TEAM_PALETTE[0].color,
    users: users.map((user): PickerUser => ({ id: user.id, name: user.name, isOwner: false, teamRoles: rolesOf(user.id, teams) })),
  };
}

// Everyone a report can go to, owners included before their first login.
// U-02: the viewer is left out of recipient, CC and forward; PNG-LAP-05 still guards the server.
export async function getReportRecipients(viewerId: string): Promise<PickerUser[]> {
  await ensureOwnerUsers();
  const [teams, users] = await Promise.all([
    loadTeams(),
    db.user.findMany({ where: { isActive: true, id: { not: viewerId } }, orderBy: { name: "asc" } }),
  ]);
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    isOwner: isOwnerEmail(user.email),
    teamRoles: rolesOf(user.id, teams),
  }));
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function saveTeam(teamId: string | null, input: TeamDraft, actorId: string): Promise<{ message: string }> {
  const users = await loadAssignableUsers();
  const nameById = new Map(users.map((user) => [user.id, user.name]));
  const nameOf = (id: string) => nameById.get(id) ?? "";
  const draft = normalizeDraft(input, new Set(nameById.keys()));

  async function assertValid() {
    const teams = await db.team.findMany({ where: activeTeamWhere });
    if (!teamId && firstFreeColor(teams.map((team) => team.color)) === null) throw pngError("PNG-TIM-08");
    const error = findTeamError(draft, teamId, teams, nameOf);
    if (error) throw pngError(error.code, "BAD_REQUEST", error.params);
    return teams;
  }

  const teams = await assertValid();
  const previous = teamId ? teams.find((team) => team.id === teamId) : undefined;
  if (teamId && !previous) throw new TRPCError({ code: "NOT_FOUND" });

  // assertValid guarantees a leader, which the draft type cannot express.
  const leaderId = draft.leaderId as string;
  const fields = { name: draft.name, color: draft.color, leaderId };
  const memberRows = draft.staffIds.map((userId, sortOrder) => ({ userId, sortOrder }));

  try {
    await db.$transaction(async (tx) => {
      if (!teamId) {
        await tx.team.create({ data: { ...fields, members: { create: memberRows } } });
        return;
      }
      // U-09: waits for a delete of this team in progress, so a save never refills a deleted team.
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Team" WHERE id = ${teamId} AND "deletedAt" IS NULL FOR UPDATE`;
      if (locked.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
      const before = await tx.teamMember.findMany({ where: { teamId }, select: { userId: true } });
      await tx.teamMember.deleteMany({ where: { teamId } });
      await tx.team.update({ where: { id: teamId }, data: { ...fields, members: { create: memberRows } } });

      // FR-TIM-04, FR-TIM-05: open to-dos of anyone who left the team now need a new PIC.
      const stayed = new Set([leaderId, ...draft.staffIds]);
      const leaving = [...new Set([previous?.leaderId, ...before.map((member) => member.userId)])].filter(
        (id): id is string => !!id && !stayed.has(id),
      );
      for (const userId of leaving) {
        const { count } = await tx.todo.updateMany({
          where: { picId: userId, isDone: false, task: { ...openTaskInTeam(teamId) } },
          data: { needsReassign: true },
        });
        if (count === 0) continue;
        const person = await tx.user.findUnique({ where: { id: userId }, select: { name: true } });
        await notify(tx, {
          userId: leaderId,
          actorId,
          category: "ASSIGNMENT",
          text: `${person?.name ?? ""} keluar dari ${draft.name}. Ada to-do yang perlu dialihkan.`,
          targetType: "ASSIGNMENT_LIST",
        });
      }

      if (previous && previous.leaderId !== leaderId) {
        await notify(tx, {
          userId: leaderId,
          actorId,
          category: "ASSIGNMENT",
          text: `Anda menjadi leader ${draft.name}. QC yang tertunda pindah ke Anda.`,
          targetType: "ASSIGNMENT_LIST",
        });
      }
    });
  } catch (error) {
    // Two owners saving at once: the database constraint wins, so report it as the normal rule error.
    if (isUniqueViolation(error)) await assertValid();
    throw error;
  }

  const leaderChanged = previous !== undefined && previous.leaderId !== leaderId;
  return {
    message: leaderChanged ? `Tim disimpan. QC yang tertunda pindah ke ${nameOf(leaderId)}.` : "Tim disimpan.",
  };
}

// U-09: owners delete a team once it has no active program. The row stays, so finished and
// cancelled programs still show their team; staff leave it and its templates are deleted, since
// tasks copied their to-dos when they were made (CHANGELOG 37). Color and leader become free.
export async function deleteTeam(teamId: string, actorId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    // Row lock: a program created for this team at the same moment waits for the delete (NFR-05).
    await tx.$queryRaw`SELECT id FROM "Team" WHERE id = ${teamId} FOR UPDATE`;
    const team = await tx.team.findFirst({ where: { id: teamId, ...activeTeamWhere } });
    if (!team) throw new TRPCError({ code: "NOT_FOUND" });
    const active = await tx.program.count({ where: { teamId, status: "ACTIVE" } });
    if (active > 0) throw pngError("PNG-TIM-09");

    await tx.teamMember.deleteMany({ where: { teamId } });
    await tx.template.deleteMany({ where: { teamId } });
    await tx.team.update({ where: { id: teamId }, data: { deletedAt: new Date(), deletedById: actorId } });
  });
}
