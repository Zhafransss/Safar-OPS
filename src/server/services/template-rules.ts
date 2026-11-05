import type { ErrorCode } from "@/config/error-codes";

export type TemplateDraft = { name: string; todos: string[] };

// Mockup saveTpl: blank rows are ignored rather than rejected.
export function normalizeTemplate(draft: TemplateDraft): TemplateDraft {
  return { name: draft.name.trim(), todos: draft.todos.map((todo) => todo.trim()).filter(Boolean) };
}

export function findTemplateError(draft: TemplateDraft): ErrorCode | null {
  if (!draft.name) return "PNG-TPL-01";
  if (draft.todos.length === 0) return "PNG-TPL-02";
  return null;
}
