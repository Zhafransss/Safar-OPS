import "server-only";

import { TRPCError } from "@trpc/server";

import { relativeAge } from "@/lib/date";
import { db } from "@/server/db";
import { getProgramDetail, getTaskDetail } from "@/server/services/assignment";
import { userCanSeeReport } from "@/server/services/report";

type CurrentUser = { id: string; name: string; email: string };

const LIST_PATH = "/penugasan/program";

// The list holds unread notifications only: reading one is what removes it (K-T68, K-T69).
export async function listNotifications(user: CurrentUser) {
  const items = await db.notification.findMany({
    where: { userId: user.id, readAt: null },
    orderBy: { createdAt: "desc" },
  });

  // Mockup notifCC (K-T77): a report received only as CC gets a grey label.
  const numbers = [...new Set(items.filter((n) => n.targetType === "REPORT" && n.targetId).map((n) => n.targetId as string))];
  const reports = numbers.length
    ? await db.report.findMany({ where: { number: { in: numbers } }, include: { ccs: { select: { userId: true } } } })
    : [];
  const ccNumbers = new Set(
    reports
      .filter((r) => r.toId !== user.id && r.fromId !== user.id && r.ccs.some((cc) => cc.userId === user.id))
      .map((r) => r.number),
  );

  const now = new Date();
  return items.map((item) => ({
    id: item.id,
    category: item.category,
    text: item.text,
    age: relativeAge(item.createdAt, now),
    isCc: item.targetType === "REPORT" && ccNumbers.has(item.targetId ?? ""),
  }));
}

export type NotificationItem = Awaited<ReturnType<typeof listNotifications>>[number];

async function ownNotification(id: string, user: CurrentUser) {
  const item = await db.notification.findFirst({ where: { id, userId: user.id } });
  if (!item) throw new TRPCError({ code: "NOT_FOUND" });
  return item;
}

export async function markNotificationRead(id: string, user: CurrentUser): Promise<void> {
  await db.notification.updateMany({ where: { id, userId: user.id, readAt: null }, data: { readAt: new Date() } });
}

// "Batalkan" after a swipe puts the notification back in the list.
export async function undoNotificationRead(id: string, user: CurrentUser): Promise<void> {
  await db.notification.updateMany({ where: { id, userId: user.id }, data: { readAt: null } });
}

export async function clearNotifications(user: CurrentUser): Promise<void> {
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
}

// Mockup notifGo: the notification leaves the list, then the target opens if the user may still see it.
export async function openNotification(id: string, user: CurrentUser): Promise<{ href: string } | { denied: string }> {
  const item = await ownNotification(id, user);
  await markNotificationRead(id, user);
  const targetId = item.targetId ?? "";

  if (item.targetType === "REPORT") {
    const report = await db.report.findUnique({ where: { number: targetId }, include: { ccs: { select: { userId: true } } } });
    if (report && (await userCanSeeReport(report, user))) return { href: `/penugasan/laporan/${report.number}` };
    return { denied: "Laporan ini sudah tidak bisa Anda lihat." };
  }
  if (item.targetType === "TASK") {
    const task = await getTaskDetail(targetId, user);
    if (task && !task.denied) return { href: `/penugasan/tugas/${targetId}` };
    return { denied: "Tugas ini sudah tidak bisa Anda lihat." };
  }
  // CHANGELOG 7: a new program opens its detail; leader changes, staff leaving and deleted tasks open the list.
  if (item.targetType === "PROGRAM") {
    const program = await getProgramDetail(targetId, user);
    if (program && !program.denied) return { href: `/penugasan/program/${targetId}` };
  }
  return { href: LIST_PATH };
}
