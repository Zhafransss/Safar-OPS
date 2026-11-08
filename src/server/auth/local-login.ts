import "server-only";

import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { parseLocalAccounts } from "@/config/local-accounts";
import { normalizeEmail } from "@/config/owners";
import type { JubelioLoginResult } from "@/server/integrations/jubelio";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keyLength: number) => Promise<Buffer>;

// Format written by scripts/hash-password.mjs: scrypt:<salt hex>:<key hex>, Node's default scrypt cost.
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  if (expected.length < 32) return false;
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

// Returns null when the email is not a local account, so the caller asks Jubelio instead.
export async function loginWithLocalAccount(email: string, password: string): Promise<JubelioLoginResult | null> {
  const target = normalizeEmail(email);
  const account = parseLocalAccounts(process.env.LOCAL_ACCOUNTS).find((candidate) => candidate.email === target);
  if (!account) return null;
  return (await verifyPassword(password, account.hash))
    ? { ok: true, userName: account.name }
    : { ok: false, reason: "invalid_credentials" };
}
