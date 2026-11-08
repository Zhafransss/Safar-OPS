import { execFileSync } from "node:child_process";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { parseLocalAccounts } from "@/config/local-accounts";
import { loginWithLocalAccount, verifyPassword } from "@/server/auth/local-login";

// Hash with the real script, so the script and the login check can never drift apart.
function hashWithScript(password: string): string {
  const script = path.resolve(__dirname, "../../../scripts/hash-password.mjs");
  return execFileSync(process.execPath, [script], { input: `${password}\n`, stdio: ["pipe", "pipe", "ignore"] })
    .toString()
    .trim();
}

const PASSWORD = "correct horse battery";
const HASH = hashWithScript(PASSWORD);

function useAccounts(accounts: unknown) {
  vi.stubEnv("LOCAL_ACCOUNTS", JSON.stringify(accounts));
}

describe("verifyPassword", () => {
  it("accepts the password hashed by scripts/hash-password.mjs", async () => {
    expect(HASH).toMatch(/^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/);
    expect(await verifyPassword(PASSWORD, HASH)).toBe(true);
  });

  it("rejects a wrong password and malformed hashes", async () => {
    expect(await verifyPassword("wrong", HASH)).toBe(false);
    expect(await verifyPassword(PASSWORD, "scrypt:abcd:")).toBe(false);
    expect(await verifyPassword(PASSWORD, "plain:text:value")).toBe(false);
  });
});

describe("loginWithLocalAccount", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is off when LOCAL_ACCOUNTS is unset", async () => {
    vi.stubEnv("LOCAL_ACCOUNTS", "");
    expect(await loginWithLocalAccount("leader@velora.com", PASSWORD)).toBeNull();
  });

  it("logs a listed account in with its name, ignoring email case", async () => {
    useAccounts([{ email: "leader@velora.com", name: "Leader Uji", hash: HASH }]);
    expect(await loginWithLocalAccount(" Leader@Velora.com ", PASSWORD)).toEqual({ ok: true, userName: "Leader Uji" });
  });

  it("rejects a wrong password as invalid credentials", async () => {
    useAccounts([{ email: "leader@velora.com", name: "Leader Uji", hash: HASH }]);
    expect(await loginWithLocalAccount("leader@velora.com", "wrong")).toEqual({
      ok: false,
      reason: "invalid_credentials",
    });
  });

  it("leaves every other email to Jubelio", async () => {
    useAccounts([{ email: "leader@velora.com", name: "Leader Uji", hash: HASH }]);
    expect(await loginWithLocalAccount("rudi@example.com", PASSWORD)).toBeNull();
  });
});

describe("parseLocalAccounts", () => {
  it("fails loudly without echoing the value", () => {
    expect(() => parseLocalAccounts("[{bad json")).toThrow("LOCAL_ACCOUNTS is not valid JSON");
    expect(() => parseLocalAccounts(JSON.stringify([{ email: "x@velora.com", name: "X", hash: "secret" }]))).toThrow(
      /LOCAL_ACCOUNTS is not valid/,
    );
    expect(() => parseLocalAccounts(JSON.stringify([{ email: "x@velora.com", name: "X", hash: "secret" }]))).not.toThrow(
      /secret/,
    );
  });
});
