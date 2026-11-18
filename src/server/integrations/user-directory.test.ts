import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn(async (args: unknown) => args);
vi.mock("@/server/db", () => ({ db: { user: { upsert: (args: unknown) => upsert(args) } } }));

import { registerUserAtLogin } from "@/server/integrations/user-directory";

describe("registerUserAtLogin (U-01)", () => {
  beforeEach(() => upsert.mockClear());

  it("stores and refreshes the Jubelio name, owners included", async () => {
    await registerUserAtLogin(" SaefulAskarCompany@gmail.com ", "Saeful Askar");
    expect(upsert).toHaveBeenCalledWith({
      where: { email: "saefulaskarcompany@gmail.com" },
      create: { email: "saefulaskarcompany@gmail.com", name: "Saeful Askar" },
      update: { isActive: true, name: "Saeful Askar" },
    });
  });

  it("starts a new user without a name as the email local part and keeps a known name", async () => {
    await registerUserAtLogin("rudi@example.com", null);
    expect(upsert).toHaveBeenCalledWith({
      where: { email: "rudi@example.com" },
      create: { email: "rudi@example.com", name: "rudi" },
      update: { isActive: true },
    });
  });
});
