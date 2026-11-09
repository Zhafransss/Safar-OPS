import { z } from "zod";

import { MAX_PHOTOS } from "@/lib/report-rules";
import {
  addReportCc,
  createReport,
  finishReport,
  forwardReport,
  getReportVersion,
  listReports,
  markReportOpened,
  rejectReport,
  sendReportMessage,
  startReport,
} from "@/server/services/report";
import { protectedProcedure, router } from "@/server/trpc";

const statusEnum = z.enum(["SENT", "IN_PROGRESS", "REJECTED", "DONE"]);
const typeEnum = z.enum(["CASE_FINDING", "REQUEST", "QUESTION", "GENERAL"]);
const number = z.string().max(20);
// One above the limit so the rule reports PNG-LAP-06 instead of a generic validation error.
const photoKeys = z.array(z.string().max(200)).max(MAX_PHOTOS + 1);

export const reportRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        tab: z.enum(["saya", "tim", "semua"]),
        status: z.union([statusEnum, z.literal("ALL")]),
        query: z.string().max(200),
      }),
    )
    .query(({ input, ctx }) => listReports(input, ctx.user)),

  version: protectedProcedure
    .input(z.object({ number }))
    .query(({ input, ctx }) => getReportVersion(input.number, ctx.user)),

  // Empty values pass here on purpose: report-rules answers with the PNG code the mockup shows.
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().max(200),
        type: typeEnum.nullable(),
        body: z.string().max(5000),
        toId: z.string().nullable(),
        ccIds: z.array(z.string()).max(100),
        photoKeys,
      }),
    )
    .mutation(({ input, ctx }) => createReport(input, ctx.user)),

  start: protectedProcedure.input(z.object({ number })).mutation(({ input, ctx }) => startReport(input.number, ctx.user)),

  reject: protectedProcedure
    .input(z.object({ number, reason: z.string().max(1000) }))
    .mutation(({ input, ctx }) => rejectReport(input.number, input.reason, ctx.user)),

  finish: protectedProcedure.input(z.object({ number })).mutation(({ input, ctx }) => finishReport(input.number, ctx.user)),

  forward: protectedProcedure
    .input(z.object({ number, toId: z.string() }))
    .mutation(({ input, ctx }) => forwardReport(input.number, input.toId, ctx.user)),

  addCc: protectedProcedure
    .input(z.object({ number, userId: z.string() }))
    .mutation(({ input, ctx }) => addReportCc(input.number, input.userId, ctx.user)),

  sendMessage: protectedProcedure
    .input(z.object({ number, body: z.string().max(5000), photoKeys }))
    .mutation(({ input, ctx }) => sendReportMessage(input, ctx.user)),

  markOpened: protectedProcedure
    .input(z.object({ number }))
    .mutation(({ input, ctx }) => markReportOpened(input.number, ctx.user)),
});
