import "server-only";

import { OWNERS } from "@/config/owners";
import { initials } from "@/lib/initials";
import { db } from "@/server/db";

// K-T79 compares against everyone, including owners who have not logged in yet.
export async function loadInitialsResolver(): Promise<(name: string) => string> {
  const users = await db.user.findMany({ select: { name: true } });
  const allNames = [...new Set([...users.map((user) => user.name), ...OWNERS.map((owner) => owner.name)])];
  return (name) => initials(name, allNames.filter((other) => other !== name));
}
