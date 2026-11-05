import { describe, expect, it } from "vitest";

import { isCrossSite } from "@/server/same-origin";

const post = (headers: Record<string, string>) => new Request("http://ops2.test/api/trpc/x", { method: "POST", headers });

describe("isCrossSite", () => {
  it("accepts the app's own origin", () => {
    expect(isCrossSite(post({ origin: "https://ops2.saefulaskar.com", host: "ops2.saefulaskar.com" }))).toBe(false);
  });

  it("prefers the host set by the hosting proxy", () => {
    const request = post({ origin: "https://ops2.saefulaskar.com", host: "internal:3000", "x-forwarded-host": "ops2.saefulaskar.com" });
    expect(isCrossSite(request)).toBe(false);
  });

  it("refuses another site", () => {
    expect(isCrossSite(post({ origin: "https://evil.example", host: "ops2.saefulaskar.com" }))).toBe(true);
  });

  it("refuses a malformed origin", () => {
    expect(isCrossSite(post({ origin: "null", host: "ops2.saefulaskar.com" }))).toBe(true);
  });

  it("allows requests without an origin, such as server-to-server checks", () => {
    expect(isCrossSite(post({ host: "ops2.saefulaskar.com" }))).toBe(false);
  });
});
