import "server-only";

import { findOwner, normalizeEmail } from "@/config/owners";
import { db } from "@/server/db";

// Option B from DESIGN 4.2: users are registered at first login. Swap this module for
// option A if a Jubelio user-list endpoint is confirmed; callers stay the same.
export function displayNameFor(email: string, jubelioUserName: string): string {
  const owner = findOwner(email);
  if (owner) return owner.name;
  const isEmail = jubelioUserName.includes("@");
  return isEmail ? (jubelioUserName.split("@")[0] ?? jubelioUserName) : jubelioUserName;
}

export async function registerUserAtLogin(email: string, jubelioUserName: string) {
  const normalized = normalizeEmail(email);
  return db.user.upsert({
    where: { email: normalized },
    create: { email: normalized, name: displayNameFor(normalized, jubelioUserName) },
    update: { isActive: true },
  });
}
