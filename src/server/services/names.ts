import "server-only";

import { OWNERS, placeholderName } from "@/config/owners";
import { initials } from "@/lib/initials";
import { db } from "@/server/db";

// K-T79 compares against everyone, including owners who have not logged in yet.
export async function loadInitialsResolver(): Promise<(name: string) => string> {
  const users = await db.user.findMany({ select: { name: true, email: true } });
  const known = new Set(users.map((user) => user.email));
  const missingOwners = OWNERS.filter((owner) => !known.has(owner.email)).map(placeholderName);
  const allNames = [...new Set([...users.map((user) => user.name), ...missingOwners])];
  return (name) => initials(name, allNames.filter((other) => other !== name));
}
