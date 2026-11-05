import { programRouter, qcRouter, taskRouter, todoRouter } from "@/server/routers/assignment";
import { authRouter } from "@/server/routers/auth";
import { reportRouter } from "@/server/routers/report";
import { teamRouter } from "@/server/routers/team";
import { templateRouter } from "@/server/routers/template";
import { router } from "@/server/trpc";

export const appRouter = router({
  auth: authRouter,
  program: programRouter,
  qc: qcRouter,
  report: reportRouter,
  task: taskRouter,
  team: teamRouter,
  template: templateRouter,
  todo: todoRouter,
});

export type AppRouter = typeof appRouter;
