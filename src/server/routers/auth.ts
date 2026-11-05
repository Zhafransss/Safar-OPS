import { z } from "zod";

import { normalizeEmail } from "@/config/owners";
import { isLoginThrottled, recordLoginAttempt } from "@/server/auth/login-throttle";
import { createSession, destroySession } from "@/server/auth/session";
import { loginWithJubelio } from "@/server/integrations/jubelio";
import { registerUserAtLogin } from "@/server/integrations/user-directory";
import { pngError, protectedProcedure, publicProcedure, router } from "@/server/trpc";

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string().min(1).max(254), password: z.string().min(1).max(200) }))
    .mutation(async ({ input, ctx }) => {
      const email = normalizeEmail(input.email);
      if (await isLoginThrottled(email, ctx.ip)) throw pngError("PNG-AUT-03", "TOO_MANY_REQUESTS");

      const result = await loginWithJubelio(email, input.password);
      if (!result.ok) {
        // An outage says nothing about the password, so it must not count toward the lockout.
        if (result.reason === "unavailable") throw pngError("PNG-AUT-02", "BAD_GATEWAY");
        await recordLoginAttempt(email, ctx.ip, false);
        throw pngError("PNG-AUT-01", "UNAUTHORIZED");
      }

      await recordLoginAttempt(email, ctx.ip, true);
      const user = await registerUserAtLogin(email, result.userName);
      await createSession(user.id);
      return { ok: true };
    }),

  logout: protectedProcedure.mutation(async () => {
    await destroySession();
    return { ok: true };
  }),
});
