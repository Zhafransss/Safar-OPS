// Every team read must use this filter so deleted teams never surface (U-09).
// Programs keep pointing at their team, so a program detail still shows a deleted team's name.
export const activeTeamWhere = { deletedAt: null } as const;
