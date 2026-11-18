import "server-only";

import { normalizeEmail, placeholderName } from "@/config/owners";
import { db } from "@/server/db";

// Option B from DESIGN 4.2: users are registered at first login. Swap this module for
// option A if a Jubelio user-list endpoint is used; callers stay the same.
// U-01: the name comes from Jubelio and is refreshed at every login, owners included. Without one,
// a new user starts with the email's local part and a known user keeps the name they had.
export async function registerUserAtLogin(email: string, name: string | null) {
  const normalized = normalizeEmail(email);
  return db.user.upsert({
    where: { email: normalized },
    create: { email: normalized, name: name ?? placeholderName({ email: normalized }) },
    update: { isActive: true, ...(name ? { name } : {}) },
  });
}
