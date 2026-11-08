import { z } from "zod";

// CHANGELOG no. 23: accounts that log in without Jubelio, for testing a deployed app.
// Set LOCAL_ACCOUNTS (a JSON array) on Vercel; leave it unset to turn the feature off.
// Hashes come from `pnpm hash-password`, so no password is written in code or env.
const localAccountSchema = z.object({
  email: z.email().toLowerCase(),
  name: z.string().trim().min(1).max(100),
  hash: z.string().startsWith("scrypt:"),
  owner: z.boolean().optional(),
});

export type LocalAccount = z.infer<typeof localAccountSchema>;

// A broken value fails loudly, so a typo is not mistaken for a wrong password.
// The messages never echo the value, because it holds password hashes.
export function parseLocalAccounts(raw: string | undefined): LocalAccount[] {
  if (!raw?.trim()) return [];
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("LOCAL_ACCOUNTS is not valid JSON");
  }
  const parsed = z.array(localAccountSchema).safeParse(json);
  if (!parsed.success) throw new Error(`LOCAL_ACCOUNTS is not valid:\n${z.prettifyError(parsed.error)}`);
  return parsed.data;
}
