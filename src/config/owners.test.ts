import { afterEach, describe, expect, it, vi } from "vitest";

import { isOwnerEmail, OWNERS, placeholderName } from "@/config/owners";

describe("developer owner", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadWith(nodeEnv: string) {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", nodeEnv);
    return import("@/config/owners");
  }

  it("exists in development", async () => {
    const owners = await loadWith("development");
    expect(owners.isOwnerEmail("developer@safar.local")).toBe(true);
  });

  it("does not exist in production", async () => {
    const owners = await loadWith("production");
    expect(owners.isOwnerEmail("developer@safar.local")).toBe(false);
    expect(owners.OWNERS).toHaveLength(4);
  });
});

describe("local test owners (CHANGELOG no. 23)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("adds only LOCAL_ACCOUNTS entries marked owner", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "LOCAL_ACCOUNTS",
      JSON.stringify([
        { email: "Owner@Velora.com", name: "Owner Uji", hash: "scrypt:00:00", owner: true },
        { email: "leader@velora.com", name: "Leader Uji", hash: "scrypt:00:00" },
      ]),
    );
    const owners = await import("@/config/owners");
    expect(owners.OWNERS).toHaveLength(5);
    expect(owners.findOwner("owner@velora.com")?.name).toBe("Owner Uji");
    expect(owners.isOwnerEmail("leader@velora.com")).toBe(false);
  });
});

describe("owners (K-T72)", () => {
  it("has exactly four accounts", () => {
    expect(OWNERS).toHaveLength(4);
  });

  it.each(OWNERS.map((owner) => [owner.email]))("recognizes %s", (email) => {
    expect(isOwnerEmail(email)).toBe(true);
  });

  // U-01: owners are known by email; their names come from Jubelio at login.
  it("writes no owner name in code", () => {
    expect(OWNERS.every((owner) => owner.name === undefined)).toBe(true);
  });

  it("ignores case and surrounding spaces", () => {
    expect(isOwnerEmail("  WahyudinST@Gmail.com ")).toBe(true);
  });

  it("rejects everyone else", () => {
    expect(isOwnerEmail("rudi@example.com")).toBe(false);
  });
});

describe("placeholderName (U-01)", () => {
  it("uses the email local part until the first login", () => {
    expect(placeholderName({ email: "saefulaskarcompany@gmail.com" })).toBe("saefulaskarcompany");
  });

  it("keeps a name set for accounts that never reach Jubelio", () => {
    expect(placeholderName({ email: "developer@safar.local", name: "Developer" })).toBe("Developer");
  });
});
