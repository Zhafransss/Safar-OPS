// Prints a password hash for LOCAL_ACCOUNTS (docs/DEPLOY.md). Run with: pnpm hash-password
// The password is read from the prompt or stdin, so it stays out of shell history.
// Format checked by src/server/auth/local-login.ts: scrypt:<salt hex>:<key hex>.
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline/promises";

const readline = createInterface({ input: process.stdin, output: process.stderr });
const password = await readline.question("Password: ");
readline.close();

if (password.length < 8) {
  console.error("Use at least 8 characters.");
  process.exit(1);
}

const salt = randomBytes(16);
const key = scryptSync(password, salt, 64);
console.log(`scrypt:${salt.toString("hex")}:${key.toString("hex")}`);
