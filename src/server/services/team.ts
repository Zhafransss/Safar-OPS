import "server-only";

import { TRPCError } from "@trpc/server";

import { isOwnerEmail, OWNERS } from "@/config/owners";
import { TEAM_PALETTE } from "@/config/team-palette";
import { db } from "@/server/db";
import { loadInitialsResolver } from "@/server/services/names";
import { notify } from "@/server/services/notifications";
import { findTeamError, firstFreeColor, normalizeDraft, type TeamDraft } from "@/server/services/team-rules";
import type { TeamRole } from "@/server/services/viewer";
import { pngError } from "@/server/trpc";

export type PickerUser = { id: string; name: string; isOwner: boolean; teamRoles: TeamRole[] };

const teamInclude = {
  leader: { select: { id: true, name: true } },
  members: { include: { user: { select: { id: true, name: true } } }, orderBy: { sortOrder: "asc" } },
} as const;

function loadTeams() {
  return db.team.findMany({ include: teamInclude, orderBy: { createdAt: "asc" } });
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

export async function getTeamChart() {
  const [teams, initialsOf] = await Promise.all([loadTeams(), loadInitialsResolver()]);

  return {
    owners: OWNERS.map((owner) => ({ name: owner.name, initials: initialsOf(owner.name) })),
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

export async function getTeamFormData(teamId: string | null) {
  const [teams, users] = await Promise.all([loadTeams(), loadAssignableUsers()]);
  const team = teamId ? teams.find((candidate) => candidate.id === teamId) : undefined;
  if (teamId && !team) return null;

  return {
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

// Everyone a report can go to. Owner emails are known up front, so they are selectable before their first login.
export async function getReportRecipients(): Promise<PickerUser[]> {
  await db.user.createMany({ data: OWNERS.map(({ name, email }) => ({ name, email })), skipDuplicates: true });
  const [teams, users] = await Promise.all([
    loadTeams(),
    db.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
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
    const teams = await db.team.findMany();
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
      await tx.teamMember.deleteMany({ where: { teamId } });
      await tx.team.update({ where: { id: teamId }, data: { ...fields, members: { create: memberRows } } });
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
