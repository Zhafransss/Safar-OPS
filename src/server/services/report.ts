import "server-only";

import { TRPCError } from "@trpc/server";

import { isOwnerEmail } from "@/config/owners";
import type { Prisma } from "@/generated/prisma/client";
import { formatDate, formatShortDate, relativeAge, reportPeriod } from "@/lib/date";
import {
  canSeeReport,
  findReportError,
  forwardParties,
  formatReportNumber,
  isClosed,
  MAX_PHOTOS,
  participantsOf,
  readReceipt,
  REPORT_TYPES,
  reportActions,
  reportVersion,
  STATUS_LABEL,
  type ReportActor,
  type ReportDraft,
  type ReportParties,
  type ReportStatus,
} from "@/lib/report-rules";
import { db } from "@/server/db";
import { isOwnKey, photoExists } from "@/server/integrations/photo-storage";
import { loadInitialsResolver } from "@/server/services/names";
import { notify } from "@/server/services/notifications";
import { activeTaskWhere } from "@/server/services/task-scope";
import { pngError } from "@/server/trpc";

type Tx = Prisma.TransactionClient;
type CurrentUser = { id: string; name: string; email: string };

export type ReportTab = "saya" | "tim" | "semua";

const typeLabel = (value: string) => REPORT_TYPES.find((type) => type.value === value)?.label ?? value;

// Mockup leadersOf: the leaders of every team the recipient is staff in.
async function recipientLeaderIds(tx: Tx, toId: string): Promise<string[]> {
  const teams = await tx.team.findMany({ where: { members: { some: { userId: toId } } }, select: { leaderId: true } });
  return teams.map((team) => team.leaderId);
}

async function actorFor(tx: Tx, user: CurrentUser, toId: string): Promise<ReportActor> {
  return { id: user.id, isOwner: isOwnerEmail(user.email), recipientLeaderIds: await recipientLeaderIds(tx, toId) };
}

function partiesOf(report: { fromId: string; toId: string; status: ReportStatus; ccs: { userId: string }[] }): ReportParties {
  return { fromId: report.fromId, toId: report.toId, status: report.status, ccIds: report.ccs.map((cc) => cc.userId) };
}

export async function userCanSeeReport(
  report: { fromId: string; toId: string; status: ReportStatus; ccs: { userId: string }[] },
  user: CurrentUser,
): Promise<boolean> {
  return canSeeReport(partiesOf(report), await actorFor(db, user, report.toId));
}

export async function listReports(input: { tab: ReportTab; status: ReportStatus | "ALL"; query: string }, user: CurrentUser) {
  const mine: Prisma.ReportWhereInput = {
    OR: [{ fromId: user.id }, { toId: user.id }, { ccs: { some: { userId: user.id } } }],
  };

  let scope: Prisma.ReportWhereInput;
  if (input.tab === "tim") {
    // K-T41: reports addressed to the team's staff, without repeating the leader's own.
    const team = await db.team.findUnique({ where: { leaderId: user.id }, include: { members: true } });
    if (!team) return [];
    scope = { toId: { in: team.members.map((member) => member.userId) }, NOT: mine };
  } else if (input.tab === "semua") {
    if (!isOwnerEmail(user.email)) return [];
    scope = {};
  } else {
    scope = mine;
  }

  const query = input.query.trim();
  const reports = await db.report.findMany({
    where: {
      AND: [
        scope,
        input.status === "ALL" ? {} : { status: input.status },
        query
          ? {
              OR: [
                { number: { contains: query, mode: "insensitive" } },
                { title: { contains: query, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    include: {
      from: { select: { name: true } },
      to: { select: { name: true } },
      ccs: { select: { userId: true } },
      _count: { select: { messages: { where: { isSystem: false } } } },
    },
    orderBy: { number: "desc" },
  });

  const now = new Date();
  return reports.map((report) => {
    const isCc = report.ccs.some((cc) => cc.userId === user.id);
    // Mockup lapCard.
    const direction =
      report.fromId === user.id
        ? `Saya → ${report.to.name}`
        : report.toId === user.id
          ? `${report.from.name} → saya`
          : isCc
            ? `CC · ${report.from.name} → ${report.to.name}`
            : `${report.from.name} → ${report.to.name}`;
    return {
      number: report.number,
      typeLabel: typeLabel(report.type),
      status: report.status,
      title: report.title,
      direction,
      age: relativeAge(report.createdAt, now),
      messageCount: report._count.messages,
      unread: report.toId === user.id && !report.recipientOpenedAt && !isClosed(report.status),
    };
  });
}

export type ReportCard = Awaited<ReturnType<typeof listReports>>[number];

export async function getReportDetail(number: string, user: CurrentUser) {
  const report = await db.report.findUnique({
    where: { number },
    include: {
      from: { select: { name: true } },
      to: { select: { name: true } },
      ccs: { include: { user: { select: { name: true } } }, orderBy: { userId: "asc" } },
      photos: { orderBy: { sortOrder: "asc" }, select: { id: true } },
      tasks: { where: activeTaskWhere, select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { name: true } },
          reads: { select: { userId: true } },
          photos: { orderBy: { sortOrder: "asc" }, select: { id: true } },
        },
      },
    },
  });
  if (!report) return null;

  const parties = partiesOf(report);
  const actor = await actorFor(db, user, report.toId);
  if (!canSeeReport(parties, actor)) return { denied: true as const };

  const [logs, initialsOf, participants] = await Promise.all([
    db.activityLog.findMany({ where: { entityType: "REPORT", entityId: report.id }, orderBy: { createdAt: "asc" } }),
    loadInitialsResolver(),
    db.user.findMany({ where: { id: { in: participantsOf(parties) } }, select: { id: true, name: true } }),
  ]);
  const nameOf = (id: string) => participants.find((person) => person.id === id)?.name ?? "";
  const participantIds = participantsOf(parties);
  const now = new Date();

  return {
    denied: false as const,
    number: report.number,
    typeLabel: typeLabel(report.type),
    status: report.status,
    title: report.title,
    body: report.body,
    fromId: report.fromId,
    fromName: report.from.name,
    toId: report.toId,
    toName: report.to.name,
    ccIds: parties.ccIds,
    ccNames: report.ccs.map((cc) => cc.user.name),
    created: `${formatDate(report.createdAt)} · ${relativeAge(report.createdAt, now)}`,
    photoIds: report.photos.map((photo) => photo.id),
    taskNames: report.tasks.map((task) => task.name),
    actions: reportActions(parties, actor),
    version: reportVersion({
      status: report.status,
      toId: report.toId,
      ccCount: report.ccs.length,
      messageCount: report.messages.length,
      readsOnMyMessages: report.messages
        .filter((message) => message.senderId === user.id)
        .reduce((sum, message) => sum + message.reads.length, 0),
    }),
    logs: logs.map((log) => ({ id: log.id, text: `${formatShortDate(log.createdAt)} · ${log.text}` })),
    messages: report.messages.map((message) => {
      const mine = message.senderId === user.id;
      const receipt =
        mine && !message.isSystem
          ? readReceipt(user.id, participantIds, message.reads.map((read) => read.userId))
          : null;
      const readerNames = receipt?.readers.map(nameOf) ?? [];
      return {
        id: message.id,
        isSystem: message.isSystem,
        mine,
        senderName: message.sender?.name ?? "",
        body: message.body,
        date: formatShortDate(message.createdAt),
        photoIds: message.photos.map((photo) => photo.id),
        receipt: receipt && {
          allRead: receipt.allRead,
          title: receipt.allRead
            ? "Dibaca semua peserta"
            : readerNames.length
              ? `Dibaca ${readerNames.join(", ")}`
              : "Terkirim, belum dibaca",
          initials: readerNames.map(initialsOf),
        },
      };
    }),
  };
}

// CHANGELOG 24: polled by the open chat, so it stays small: counts only, no message bodies.
export async function getReportVersion(number: string, user: CurrentUser): Promise<string | null> {
  const report = await db.report.findUnique({
    where: { number },
    include: { ccs: { select: { userId: true } }, _count: { select: { messages: true } } },
  });
  if (!report || !(await userCanSeeReport(report, user))) return null;
  const readsOnMyMessages = await db.reportMessageRead.count({
    where: { message: { reportId: report.id, senderId: user.id } },
  });
  return reportVersion({
    status: report.status,
    toId: report.toId,
    ccCount: report.ccs.length,
    messageCount: report._count.messages,
    readsOnMyMessages,
  });
}

export type ReportDetailData =Extract<NonNullable<Awaited<ReturnType<typeof getReportDetail>>>, { denied: false }>;

async function assertPhotoKeys(keys: readonly string[], userId: string): Promise<void> {
  if (keys.length > MAX_PHOTOS) throw pngError("PNG-LAP-06");
  const usable = await Promise.all(keys.map(async (key) => isOwnKey(key, userId) && (await photoExists(key))));
  if (usable.includes(false)) throw new TRPCError({ code: "BAD_REQUEST", message: "Foto tidak ditemukan." });
}

const photoRows = (keys: readonly string[]) => keys.map((blobPath, sortOrder) => ({ blobPath, sortOrder }));

function log(tx: Tx, reportId: string, actorId: string, text: string) {
  return tx.activityLog.create({ data: { entityType: "REPORT", entityId: reportId, actorId, text } });
}

function systemMessage(tx: Tx, reportId: string, body: string) {
  return tx.reportMessage.create({ data: { reportId, body, isSystem: true } });
}

function notifyReport(tx: Tx, userId: string, actorId: string, text: string, number: string) {
  return notify(tx, { userId, actorId, category: "REPORT", text, targetType: "REPORT", targetId: number });
}

// K-T83: one atomic statement, so simultaneous sends can never share a number.
async function nextReportNumber(tx: Tx): Promise<string> {
  const period = reportPeriod(new Date());
  const rows = await tx.$queryRaw<{ lastSeq: number }[]>`
    INSERT INTO "ReportCounter" ("period", "lastSeq") VALUES (${period}, 1)
    ON CONFLICT ("period") DO UPDATE SET "lastSeq" = "ReportCounter"."lastSeq" + 1
    RETURNING "lastSeq"`;
  return formatReportNumber(period, Number(rows[0]?.lastSeq));
}

export async function createReport(
  input: ReportDraft & { ccIds: string[]; photoKeys: string[] },
  user: CurrentUser,
): Promise<{ number: string; toName: string }> {
  const code = findReportError(input, user.id);
  if (code) throw pngError(code);
  await assertPhotoKeys(input.photoKeys, user.id);

  const toId = input.toId as string;
  const type = input.type as NonNullable<ReportDraft["type"]>;
  const ccIds = [...new Set(input.ccIds)].filter((id) => id !== toId && id !== user.id);
  const people = await db.user.findMany({ where: { id: { in: [toId, ...ccIds] }, isActive: true } });
  const nameOf = (id: string) => people.find((person) => person.id === id)?.name;
  const toName = nameOf(toId);
  if (!toName) throw pngError("PNG-LAP-04");
  const validCcIds = ccIds.filter((id) => nameOf(id));

  const number = await db.$transaction(async (tx) => {
    const reportNumber = await nextReportNumber(tx);
    const report = await tx.report.create({
      data: {
        number: reportNumber,
        title: input.title.trim(),
        type,
        body: input.body.trim(),
        fromId: user.id,
        toId,
        ccs: { create: validCcIds.map((userId) => ({ userId })) },
        photos: { create: photoRows(input.photoKeys) },
      },
    });
    const ccNote = validCcIds.length ? ` (CC ${validCcIds.map(nameOf).join(", ")})` : "";
    await log(tx, report.id, user.id, `${user.name} membuat laporan ke ${toName}${ccNote}`);
    const text = `Laporan baru dari ${user.name}: ${report.title}`;
    for (const recipient of [toId, ...validCcIds]) await notifyReport(tx, recipient, user.id, text, reportNumber);
    return reportNumber;
  });

  return { number, toName };
}

// Loads the report and checks the rule inside the transaction, so a stale screen cannot act on a changed report.
async function withReport<T>(
  number: string,
  user: CurrentUser,
  allowed: (actions: ReturnType<typeof reportActions>) => boolean,
  run: (tx: Tx, report: { id: string; fromId: string; toId: string; title: string }, parties: ReportParties) => Promise<T>,
): Promise<T> {
  return db.$transaction(async (tx) => {
    // Row lock: two people acting on one report run one after the other (NFR-05).
    await tx.$queryRaw`SELECT id FROM "Report" WHERE number = ${number} FOR UPDATE`;
    const report = await tx.report.findUnique({ where: { number }, include: { ccs: true } });
    if (!report) throw new TRPCError({ code: "NOT_FOUND" });
    const parties = partiesOf(report);
    const actor = await actorFor(tx, user, report.toId);
    if (!canSeeReport(parties, actor) || !allowed(reportActions(parties, actor))) {
      throw pngError("PNG-LAP-11", "FORBIDDEN");
    }
    return run(tx, report, parties);
  });
}

export async function startReport(number: string, user: CurrentUser): Promise<void> {
  await withReport(number, user, (a) => a.canStart, async (tx, report) => {
    const label = STATUS_LABEL.IN_PROGRESS;
    await tx.report.update({ where: { id: report.id }, data: { status: "IN_PROGRESS" } });
    await systemMessage(tx, report.id, `${user.name} mengubah status menjadi ${label}`);
    await log(tx, report.id, user.id, `${user.name} mengubah status menjadi ${label}`);
    await notifyReport(tx, report.fromId, user.id, `${number} ${label.toLowerCase()} oleh ${user.name}`, number);
  });
}

export async function rejectReport(number: string, reason: string, user: CurrentUser): Promise<void> {
  const trimmed = reason.trim();
  if (!trimmed) throw pngError("PNG-LAP-07");
  await withReport(number, user, (a) => a.canReject, async (tx, report) => {
    await tx.report.update({ where: { id: report.id }, data: { status: "REJECTED", rejectReason: trimmed } });
    await systemMessage(tx, report.id, `${user.name} menolak laporan. Alasan: ${trimmed}`);
    await log(tx, report.id, user.id, `${user.name} menolak laporan`);
    await notifyReport(tx, report.fromId, user.id, `${number} ditolak oleh ${user.name}`, number);
  });
}

export async function finishReport(number: string, user: CurrentUser): Promise<void> {
  await withReport(number, user, (a) => a.canFinish, async (tx, report) => {
    await tx.report.update({ where: { id: report.id }, data: { status: "DONE" } });
    await systemMessage(tx, report.id, `${user.name} menandai laporan selesai`);
    await log(tx, report.id, user.id, `${user.name} menandai selesai`);
    await notifyReport(tx, report.toId, user.id, `${number} ditandai selesai oleh ${user.name}`, number);
  });
}

async function activeUser(tx: Tx, id: string) {
  const person = await tx.user.findFirst({ where: { id, isActive: true } });
  if (!person) throw new TRPCError({ code: "BAD_REQUEST", message: "Pengguna tidak ditemukan." });
  return person;
}

export async function forwardReport(number: string, newToId: string, user: CurrentUser): Promise<{ message: string }> {
  return withReport(number, user, (a) => a.canForward, async (tx, report, parties) => {
    if (newToId === report.toId || newToId === report.fromId) throw pngError("PNG-LAP-11", "FORBIDDEN");
    const [target, previous] = await Promise.all([activeUser(tx, newToId), activeUser(tx, report.toId)]);
    const next = forwardParties(parties, newToId);

    await tx.reportCc.deleteMany({ where: { reportId: report.id } });
    await tx.report.update({
      where: { id: report.id },
      // The new recipient has not opened it, so the orange dot returns.
      data: {
        toId: next.toId,
        recipientOpenedAt: null,
        ccs: { create: next.ccIds.map((userId) => ({ userId })) },
      },
    });
    await systemMessage(tx, report.id, `${user.name} meneruskan laporan dari ${previous.name} ke ${target.name}`);
    await log(tx, report.id, user.id, `${user.name} meneruskan ke ${target.name}`);
    await notifyReport(tx, newToId, user.id, `Laporan diteruskan ke Anda: ${report.title}`, number);
    await notifyReport(tx, report.fromId, user.id, `${number} diteruskan ke ${target.name}`, number);
    return { message: `Diteruskan ke ${target.name}. ${previous.name} tetap bisa melihat riwayat.` };
  });
}

export async function addReportCc(number: string, userId: string, user: CurrentUser): Promise<{ message: string }> {
  return withReport(number, user, (a) => a.canAddCc, async (tx, report, parties) => {
    if (participantsOf(parties).includes(userId)) throw pngError("PNG-LAP-11", "FORBIDDEN");
    const target = await activeUser(tx, userId);
    await tx.reportCc.create({ data: { reportId: report.id, userId } });
    await systemMessage(tx, report.id, `${user.name} menambahkan ${target.name} (CC)`);
    await log(tx, report.id, user.id, `${user.name} menambahkan CC ${target.name}`);
    await notifyReport(tx, userId, user.id, `Kamu ditambahkan ke laporan: ${report.title}`, number);
    return { message: `${target.name} ditambahkan sebagai CC.` };
  });
}

export async function sendReportMessage(
  input: { number: string; body: string; photoKeys: string[] },
  user: CurrentUser,
): Promise<void> {
  const body = input.body.trim();
  if (!body && input.photoKeys.length === 0) throw pngError("PNG-LAP-08");
  await assertPhotoKeys(input.photoKeys, user.id);

  await withReport(input.number, user, (a) => a.canChat, async (tx, report, parties) => {
    await tx.reportMessage.create({
      data: { reportId: report.id, senderId: user.id, body, photos: { create: photoRows(input.photoKeys) } },
    });
    const text = `Pesan baru dari ${user.name} di ${input.number}`;
    for (const recipient of participantsOf(parties)) await notifyReport(tx, recipient, user.id, text, input.number);
  });
}

// Called from the screen rather than the page render, so a link prefetch cannot count as reading.
export async function markReportOpened(number: string, user: CurrentUser): Promise<void> {
  const report = await db.report.findUnique({ where: { number }, include: { ccs: true } });
  if (!report) return;
  const parties = partiesOf(report);
  if (!participantsOf(parties).includes(user.id)) return;

  const unread = await db.reportMessage.findMany({
    where: { reportId: report.id, isSystem: false, senderId: { not: user.id }, reads: { none: { userId: user.id } } },
    select: { id: true },
  });
  await db.$transaction(async (tx) => {
    if (unread.length) {
      await tx.reportMessageRead.createMany({
        data: unread.map((message) => ({ messageId: message.id, userId: user.id })),
        skipDuplicates: true,
      });
    }
    if (report.toId === user.id && !report.recipientOpenedAt) {
      await tx.report.update({ where: { id: report.id }, data: { recipientOpenedAt: new Date() } });
    }
  });
}
