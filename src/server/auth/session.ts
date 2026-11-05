import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import { db } from "@/server/db";

const SESSION_COOKIE = "ops2_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Renew at most once a day so reads do not write on every request.
const RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function writeCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  await writeCookie(token, expiresAt);
}

async function readSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session || session.expiresAt <= new Date() || !session.user.isActive) return null;
  return { session, token };
}

// Safe in Server Components, which cannot write cookies.
export async function getSessionUser() {
  const found = await readSession();
  return found?.session.user ?? null;
}

// Route handlers only: extends the session while the user stays active.
export async function getSessionUserAndRenew() {
  const found = await readSession();
  if (!found) return null;
  const { session, token } = found;
  const age = SESSION_TTL_MS - (session.expiresAt.getTime() - Date.now());
  if (age > RENEW_AFTER_MS) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await db.session.update({ where: { id: session.id }, data: { expiresAt } });
    await writeCookie(token, expiresAt);
  }
  return session.user;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(SESSION_COOKIE);
}
