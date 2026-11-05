import { z } from "zod";

import {
  addTodo,
  approveQc,
  cancelProgram,
  closeProgram,
  createProgram,
  createTask,
  moveTodo,
  removeTask,
  removeTodo,
  returnForRevision,
  toggleTodo,
  updateTodo,
} from "@/server/services/assignment";
import { protectedProcedure, router } from "@/server/trpc";

const id = z.string().max(40);
// Empty values pass here on purpose: assignment-rules answers with the PNG code the mockup shows.
const todoDraft = z.object({
  name: z.string().max(200),
  picId: z.string().max(40),
  dueIso: z.union([z.literal(""), z.iso.date()]),
  instruction: z.string().max(2000),
});

export const programRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string().max(200), teamId: id.nullable() }))
    .mutation(({ input, ctx }) => createProgram(input, ctx.user)),

  close: protectedProcedure.input(z.object({ id })).mutation(({ input, ctx }) => closeProgram(input.id, ctx.user)),

  cancel: protectedProcedure.input(z.object({ id })).mutation(({ input, ctx }) => cancelProgram(input.id, ctx.user)),
});

export const taskRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        programId: id,
        name: z.string().max(200),
        reportNumber: z.string().max(20).nullable(),
        todos: z.array(todoDraft).max(100),
      }),
    )
    .mutation(({ input, ctx }) => createTask(input, ctx.user)),

  remove: protectedProcedure.input(z.object({ id })).mutation(({ input, ctx }) => removeTask(input.id, ctx.user)),
});

export const todoRouter = router({
  add: protectedProcedure
    .input(todoDraft.extend({ taskId: id }))
    .mutation(({ input, ctx }) => addTodo(input, ctx.user)),

  update: protectedProcedure
    .input(todoDraft.extend({ todoId: id }))
    .mutation(({ input, ctx }) => updateTodo(input, ctx.user)),

  move: protectedProcedure
    .input(z.object({ todoId: id, direction: z.union([z.literal(-1), z.literal(1)]) }))
    .mutation(({ input, ctx }) => moveTodo(input.todoId, input.direction, ctx.user)),

  remove: protectedProcedure
    .input(z.object({ todoId: id }))
    .mutation(({ input, ctx }) => removeTodo(input.todoId, ctx.user)),

  toggle: protectedProcedure
    .input(z.object({ todoId: id }))
    .mutation(({ input, ctx }) => toggleTodo(input.todoId, ctx.user)),
});

export const qcRouter = router({
  approve: protectedProcedure.input(z.object({ taskId: id })).mutation(({ input, ctx }) => approveQc(input.taskId, ctx.user)),

  returnForRevision: protectedProcedure
    .input(
      z.object({
        taskId: id,
        picks: z.array(z.object({ todoId: id, note: z.string().max(2000) })).max(100),
      }),
    )
    .mutation(({ input, ctx }) => returnForRevision(input.taskId, input.picks, ctx.user)),
});
