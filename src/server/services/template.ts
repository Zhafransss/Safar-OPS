import "server-only";

import { TRPCError } from "@trpc/server";

import { db } from "@/server/db";
import { findTemplateError, normalizeTemplate, type TemplateDraft } from "@/server/services/template-rules";
import { pngError } from "@/server/trpc";

// K-T39: only a leader manages templates, and only for their own team. Owners cannot.
async function requireLedTeam(userId: string) {
  const team = await db.team.findUnique({ where: { leaderId: userId } });
  if (!team) throw pngError("PNG-TPL-03", "FORBIDDEN");
  return team;
}

export function listTemplates(teamId: string) {
  return db.template.findMany({
    where: { teamId },
    include: { todos: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
}

export function getTemplate(id: string, teamId: string) {
  return db.template.findFirst({
    where: { id, teamId },
    include: { todos: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function saveTemplate(templateId: string | null, input: TemplateDraft, userId: string): Promise<void> {
  const team = await requireLedTeam(userId);
  const draft = normalizeTemplate(input);
  const error = findTemplateError(draft);
  if (error) throw pngError(error);

  const todos = { create: draft.todos.map((name, sortOrder) => ({ name, sortOrder })) };
  if (!templateId) {
    await db.template.create({ data: { teamId: team.id, name: draft.name, todos } });
    return;
  }

  const existing = await getTemplate(templateId, team.id);
  if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
  await db.$transaction([
    db.templateTodo.deleteMany({ where: { templateId } }),
    db.template.update({ where: { id: templateId }, data: { name: draft.name, todos } }),
  ]);
}

export async function removeTemplate(templateId: string, userId: string): Promise<void> {
  const team = await requireLedTeam(userId);
  const { count } = await db.template.deleteMany({ where: { id: templateId, teamId: team.id } });
  if (count === 0) throw new TRPCError({ code: "NOT_FOUND" });
}
