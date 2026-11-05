import { TEAM_PALETTE } from "@/config/team-palette";
import type { ErrorCode } from "@/config/error-codes";

export type TeamDraft = { name: string; color: string; leaderId: string | null; staffIds: string[] };
export type ExistingTeam = { id: string; name: string; color: string; leaderId: string };
export type RuleError = { code: ErrorCode; params?: Record<string, string> };

// A leader cannot also be staff of the same team, and owners are never assignable (K-T72).
export function normalizeDraft(draft: TeamDraft, assignableIds: ReadonlySet<string>): TeamDraft {
  const leaderId = draft.leaderId && assignableIds.has(draft.leaderId) ? draft.leaderId : null;
  const staffIds = [...new Set(draft.staffIds)].filter((id) => id !== leaderId && assignableIds.has(id));
  return { name: draft.name.trim(), color: draft.color, leaderId, staffIds };
}

// Same check order as the mockup saveTim, so the user sees the same error first.
export function findTeamError(
  draft: TeamDraft,
  teamId: string | null,
  teams: readonly ExistingTeam[],
  nameOf: (userId: string) => string,
): RuleError | null {
  const others = teams.filter((team) => team.id !== teamId);
  if (!draft.name) return { code: "PNG-TIM-01" };
  if (!draft.leaderId) return { code: "PNG-TIM-02" };
  const ledElsewhere = others.find((team) => team.leaderId === draft.leaderId);
  if (ledElsewhere) {
    return { code: "PNG-TIM-03", params: { Nama: nameOf(draft.leaderId), Tim: ledElsewhere.name } };
  }
  if (draft.staffIds.length === 0) return { code: "PNG-TIM-04" };
  const colorOwner = others.find((team) => team.color === draft.color);
  if (colorOwner) return { code: "PNG-TIM-07", params: { "nama tim": colorOwner.name } };
  return null;
}

export function firstFreeColor(usedColors: readonly string[]): string | null {
  return TEAM_PALETTE.find((entry) => !usedColors.includes(entry.color))?.color ?? null;
}
