import { z } from "zod";

import { removeTemplate, saveTemplate } from "@/server/services/template";
import { protectedProcedure, router } from "@/server/trpc";

const templateInput = z.object({
  name: z.string().max(200),
  todos: z.array(z.string().max(200)).max(100),
});

export const templateRouter = router({
  create: protectedProcedure.input(templateInput).mutation(({ input, ctx }) => saveTemplate(null, input, ctx.user.id)),

  update: protectedProcedure
    .input(templateInput.extend({ id: z.string() }))
    .mutation(({ input: { id, ...draft }, ctx }) => saveTemplate(id, draft, ctx.user.id)),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => removeTemplate(input.id, ctx.user.id)),
});
