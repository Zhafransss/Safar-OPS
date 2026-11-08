import { afterEach, describe, expect, it, vi } from "vitest";

import { findOwner, isOwnerEmail, OWNERS } from "@/config/owners";

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

  it.each(OWNERS.map((owner) => [owner.email, owner.name]))("recognizes %s as %s", (email, name) => {
    expect(isOwnerEmail(email)).toBe(true);
    expect(findOwner(email)?.name).toBe(name);
  });

  it("ignores case and surrounding spaces", () => {
    expect(isOwnerEmail("  WahyudinST@Gmail.com ")).toBe(true);
  });

  it("rejects everyone else", () => {
    expect(isOwnerEmail("rudi@example.com")).toBe(false);
  });
});
