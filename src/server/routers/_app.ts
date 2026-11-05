import { authRouter } from "@/server/routers/auth";
import { teamRouter } from "@/server/routers/team";
import { templateRouter } from "@/server/routers/template";
import { router } from "@/server/trpc";

export const appRouter = router({ auth: authRouter, team: teamRouter, template: templateRouter });

export type AppRouter = typeof appRouter;
