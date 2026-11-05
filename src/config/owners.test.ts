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
