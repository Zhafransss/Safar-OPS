import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));

import { displayNameFor } from "@/server/integrations/user-directory";

describe("displayNameFor", () => {
  it("uses the configured name for owners", () => {
    expect(displayNameFor("wahyudinst@gmail.com", "wahyudinst@gmail.com")).toBe("Wahyudin");
  });

  it("uses a real name when Jubelio returns one", () => {
    expect(displayNameFor("rudi@example.com", "Rudi Hartono")).toBe("Rudi Hartono");
  });

  it("falls back to the email local part", () => {
    expect(displayNameFor("rudi@example.com", "rudi@example.com")).toBe("rudi");
  });
});
