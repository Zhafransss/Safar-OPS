import "server-only";

import type { NotificationCategory, Prisma } from "@/generated/prisma/client";

export type NotifyInput = {
  userId: string;
  actorId: string;
  category: NotificationCategory;
  text: string;
  targetType: "ASSIGNMENT_LIST" | "REPORT";
  targetId?: string;
};

// Runs inside the caller's transaction so a notification never outlives a failed change.
export async function notify(tx: Prisma.TransactionClient, input: NotifyInput): Promise<void> {
  const { actorId, ...data } = input;
  // PRD 10.2: nobody is notified about their own action.
  if (data.userId === actorId) return;
  await tx.notification.create({ data });
}
