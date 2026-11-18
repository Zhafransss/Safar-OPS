import "server-only";

import { cache } from "react";

import { isOwnerEmail } from "@/config/owners";
import { getSessionUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { loadInitialsResolver } from "@/server/services/names";
import { activeTaskWhere } from "@/server/services/task-scope";
import { activeTeamWhere } from "@/server/services/team-scope";

export type TeamRole = { role: "Leader" | "Staff"; teamName: string; color: string };

export type Viewer = {
  id: string;
  name: string;
  initials: string;
  isOwner: boolean;
  // Mockup roleHTML: leader label first, then each staff team.
  teamRoles: TeamRole[];
  ledTeam: { id: string; name: string; color: string } | null;
  unreadNotifications: number;
};

// cache() keeps a page and its layout to one lookup per request.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  const [ledTeam, memberships, initialsOf, unreadNotifications] = await Promise.all([
    db.team.findFirst({ where: { leaderId: user.id, ...activeTeamWhere } }),
    db.teamMember.findMany({ where: { userId: user.id, team: activeTeamWhere }, include: { team: true } }),
    loadInitialsResolver(),
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
    // Same resolver as the team chart, so an avatar shows the same initials everywhere.
    initials: initialsOf(user.name),
    isOwner,
    teamRoles: isOwner ? [] : teamRoles,
    ledTeam: ledTeam ? { id: ledTeam.id, name: ledTeam.name, color: ledTeam.color } : null,
    unreadNotifications,
  };
});

// The counts on the Beranda menu cards: new reports to me and my open to-dos.
export async function getWorkSummary(userId: string) {
  const [newReports, myTodos] = await Promise.all([
    db.report.count({ where: { toId: userId, status: "SENT", recipientOpenedAt: null } }),
    db.todo.count({
      where: { picId: userId, isDone: false, task: { ...activeTaskWhere, qcApprovedAt: null } },
    }),
  ]);
  return { newReports, myTodos };
}
