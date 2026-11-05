import "server-only";

import { initTRPC, TRPCError } from "@trpc/server";

import { formatError, type ErrorCode } from "@/config/error-codes";
import { getSessionUserAndRenew } from "@/server/auth/session";

export async function createContext(opts: { headers: Headers }) {
  const user = await getSessionUserAndRenew();
  // The left-most x-forwarded-for entry is set by the hosting proxy.
  const ip = opts.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return { user, ip };
}

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export function pngError(
  code: ErrorCode,
  status: TRPCError["code"] = "BAD_REQUEST",
  params?: Record<string, string | number>,
): TRPCError {
  return new TRPCError({ code: status, message: formatError(code, params) });
}

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
