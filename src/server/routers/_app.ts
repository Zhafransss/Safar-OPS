import { authRouter } from "@/server/routers/auth";
import { reportRouter } from "@/server/routers/report";
import { teamRouter } from "@/server/routers/team";
import { templateRouter } from "@/server/routers/template";
import { router } from "@/server/trpc";

export const appRouter = router({ auth: authRouter, report: reportRouter, team: teamRouter, template: templateRouter });

export type AppRouter = typeof appRouter;
