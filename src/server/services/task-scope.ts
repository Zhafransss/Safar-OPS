// Every task read must use this filter so soft-deleted tasks never surface (CHANGELOG 19).
export const activeTaskWhere = { deletedAt: null } as const;
