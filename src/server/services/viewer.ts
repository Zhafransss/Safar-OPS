import "server-only";

import { cache } from "react";

import { isOwnerEmail } from "@/config/owners";
import { initials } from "@/lib/initials";
import { getSessionUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { activeTaskWhere } from "@/server/services/task-scope";

export type TeamRole = { role: "Leader" | "Staff"; teamName: string; color: string };

export type Viewer = {
  id: string;
  name: string;
  initials: string;
  isOwner: boolean;
  // Mockup roleHTML: leader label first, then each staff team.
  teamRoles: TeamRole[];
  ledTeam: { name: string; color: string } | null;
  unreadNotifications: number;
};

// cache() keeps a page and its layout to one lookup per request.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  const [ledTeam, memberships, otherUsers, unreadNotifications] = await Promise.all([
    db.team.findUnique({ where: { leaderId: user.id } }),
    db.teamMember.findMany({ where: { userId: user.id }, include: { team: true } }),
    db.user.findMany({ where: { id: { not: user.id }, isActive: true }, select: { name: true } }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  const isOwner = isOwnerEmail(user.email);
  const teamRoles: TeamRole[] = [
    ...(ledTeam ? [{ role: "Leader" as const, teamName: ledTeam.name, color: ledTeam.color }] : []),
    ...memberships.map((m) => ({ role: "Staff" as const, teamName: m.team.name, color: m.team.color })),
  ];

  return {
    id: user.id,
    name: user.name,
    initials: initials(user.name, otherUsers.map((u) => u.name)),
    isOwner,
    teamRoles: isOwner ? [] : teamRoles,
    ledTeam: ledTeam ? { name: ledTeam.name, color: ledTeam.color } : null,
    unreadNotifications,
  };
});

export async function getHubSummary(userId: string) {
  const [newReports, myTodos] = await Promise.all([
    db.report.count({ where: { toId: userId, status: "SENT", recipientOpenedAt: null } }),
    db.todo.count({
      where: { picId: userId, isDone: false, task: { ...activeTaskWhere, qcApprovedAt: null } },
    }),
  ]);
  return { newReports, myTodos };
}
