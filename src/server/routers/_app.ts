import { authRouter } from "@/server/routers/auth";
import { router } from "@/server/trpc";

export const appRouter = router({ auth: authRouter });

export type AppRouter = typeof appRouter;
