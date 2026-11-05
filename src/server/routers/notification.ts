import { z } from "zod";

import {
  clearNotifications,
  listNotifications,
  markNotificationRead,
  openNotification,
  undoNotificationRead,
} from "@/server/services/notification-inbox";
import { protectedProcedure, router } from "@/server/trpc";

const byId = z.object({ id: z.string().max(40) });

export const notificationRouter = router({
  list: protectedProcedure.query(({ ctx }) => listNotifications(ctx.user)),
  open: protectedProcedure.input(byId).mutation(({ input, ctx }) => openNotification(input.id, ctx.user)),
  markRead: protectedProcedure.input(byId).mutation(({ input, ctx }) => markNotificationRead(input.id, ctx.user)),
  undo: protectedProcedure.input(byId).mutation(({ input, ctx }) => undoNotificationRead(input.id, ctx.user)),
  clearAll: protectedProcedure.mutation(({ ctx }) => clearNotifications(ctx.user)),
});
