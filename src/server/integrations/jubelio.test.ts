import { describe, expect, it } from "vitest";

import { mapLoginResponse } from "@/server/integrations/jubelio";

const email = "staff@example.com";

describe("mapLoginResponse", () => {
  it("accepts a token response", () => {
    expect(mapLoginResponse(200, { token: "abc", userName: "Rudi" }, email)).toEqual({ ok: true, userName: "Rudi" });
  });

  it("falls back to the email when userName is missing", () => {
    expect(mapLoginResponse(200, { token: "abc" }, email)).toEqual({ ok: true, userName: email });
  });

  it("maps the HTTP 500 credential error to invalid_credentials", () => {
    expect(mapLoginResponse(500, { code: "Invalid email or password" }, email)).toEqual({
      ok: false,
      reason: "invalid_credentials",
    });
  });

  it.each([
    [500, { code: "Something else" }],
    [503, null],
    [200, {}],
  ])("treats status %s as unavailable", (status, body) => {
    expect(mapLoginResponse(status, body, email)).toEqual({ ok: false, reason: "unavailable" });
  });
});
