// Pure Penugasan rules, shared by the server and the forms. Dates are ISO strings (YYYY-MM-DD).
import type { ErrorCode } from "@/config/error-codes";
import { diffDays } from "@/lib/date";

export type ProgramStatus = "ACTIVE" | "DONE" | "CANCELLED";

export const PROGRAM_STATUS_LABEL: Record<ProgramStatus, string> = {
  ACTIVE: "Aktif",
  DONE: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const PROGRAM_STATUS_BADGE: Record<ProgramStatus, string> = {
  ACTIVE: "b-blue",
  DONE: "b-green",
  CANCELLED: "b-grey",
};

export const PROGRAM_FILTERS: readonly ProgramStatus[] = ["ACTIVE", "DONE", "CANCELLED"];

export type DueTodo = { isDone: boolean; dueIso: string };

// Mockup DUE: 5 late, 4 today, 3 H-1, 2 H-2, 1 H-3.
export const DUE: Record<number, { word: string; label: string; badge: string }> = {
  5: { word: "terlambat", label: "Terlambat", badge: "b-late" },
  4: { word: "hari ini", label: "Hari ini", badge: "b-brick" },
  3: { word: "H-1", label: "H-1", badge: "b-brick" },
  2: { word: "H-2", label: "H-2", badge: "b-gold" },
  1: { word: "H-3", label: "H-3", badge: "b-gold" },
};

// Mockup dueRank (K-T71): calendar days, and only for to-dos not yet ticked.
export function dueRank(todo: DueTodo, todayIso: string): number {
  if (todo.isDone) return 0;
  const days = diffDays(todo.dueIso, todayIso);
  if (days < 0) return 5;
  if (days === 0) return 4;
  return days <= 3 ? 4 - days : 0;
}

export function worstDue(todos: readonly DueTodo[], todayIso: string): number {
  return todos.reduce((worst, todo) => Math.max(worst, dueRank(todo, todayIso)), 0);
}

// Mockup tcard: "2 to-do terlambat", showing only the most urgent level (K-T64).
export function worstDueSummary(todos: readonly DueTodo[], todayIso: string) {
  const rank = worstDue(todos, todayIso);
  const level = DUE[rank];
  if (!level) return null;
  const count = todos.filter((todo) => dueRank(todo, todayIso) === rank).length;
  return { text: `${count} to-do ${level.word}`, badge: level.badge };
}

// Mockup progressOf (K-T67): QC counts as one step, so the total is to-dos plus one.
export function progressOf(todos: readonly { isDone: boolean }[], closed: boolean) {
  const total = todos.length + 1;
  const done = todos.filter((todo) => todo.isDone).length + (closed ? 1 : 0);
  return { done, total, percent: Math.round((done / total) * 100) };
}

export type TodoDraft = { name: string; picId: string; dueIso: string; instruction: string };
export type RuleError = { code: ErrorCode; params?: Record<string, string | number> };

// Mockup validTodos. CHANGELOG 1: a past DL only fails when the DL itself was changed,
// so a late to-do can be reassigned without inventing a new date.
export function findTodoError(
  todos: readonly TodoDraft[],
  todayIso: string,
  isAssignable: (userId: string) => boolean,
  previousDueIso?: string,
): RuleError | null {
  for (const [index, todo] of todos.entries()) {
    const name = todo.name.trim();
    if (!name) return { code: "PNG-TDO-01", params: { n: index + 1 } };
    if (!todo.picId || !isAssignable(todo.picId)) return { code: "PNG-TDO-02", params: { nama: todo.name } };
    if (!todo.dueIso) return { code: "PNG-TDO-03", params: { nama: todo.name } };
    if (todo.dueIso !== previousDueIso && diffDays(todo.dueIso, todayIso) < 0) {
      return { code: "PNG-TDO-04", params: { nama: todo.name } };
    }
  }
  return null;
}

export function findTaskError(name: string, todos: readonly TodoDraft[], todayIso: string, isAssignable: (userId: string) => boolean) {
  if (!name.trim()) return { code: "PNG-TGS-01" } satisfies RuleError;
  if (todos.length === 0) return { code: "PNG-TGS-02" } satisfies RuleError;
  return findTodoError(todos, todayIso, isAssignable);
}

export type RevisionPick = { todoName: string; note: string };

export function findRevisionError(picks: readonly RevisionPick[]): RuleError | null {
  if (picks.length === 0) return { code: "PNG-QC-01" };
  const missing = picks.find((pick) => !pick.note.trim());
  return missing ? { code: "PNG-QC-02", params: { "nama to-do": missing.todoName } } : null;
}

// Mockup visibleTugas (K-T15): managers see all tasks, others only tasks with a to-do of theirs.
export function isTaskVisible(canManage: boolean, todos: readonly { picId: string }[], userId: string): boolean {
  return canManage || todos.some((todo) => todo.picId === userId);
}
