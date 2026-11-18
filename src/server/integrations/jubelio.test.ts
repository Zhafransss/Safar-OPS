import { afterEach, describe, expect, it, vi } from "vitest";

import { loginWithJubelio, mapLoginResponse, nameFrom } from "@/server/integrations/jubelio";

describe("mapLoginResponse", () => {
  it("accepts a token response and reads fullName", () => {
    expect(mapLoginResponse(200, { token: "abc", fullName: "Saeful Askar" })).toEqual({
      ok: true,
      token: "abc",
      name: "Saeful Askar",
    });
  });

  it("has no name when fullName is missing", () => {
    expect(mapLoginResponse(200, { token: "abc" })).toEqual({ ok: true, token: "abc", name: null });
  });

  it("maps the HTTP 500 credential error to invalid_credentials", () => {
    expect(mapLoginResponse(500, { code: "Invalid email or password" })).toEqual({
      ok: false,
      reason: "invalid_credentials",
    });
  });

  it.each([
    [500, { code: "Something else" }],
    [503, null],
    [200, {}],
  ])("treats status %s as unavailable", (status, body) => {
    expect(mapLoginResponse(status, body)).toEqual({ ok: false, reason: "unavailable" });
  });
});

describe("nameFrom (U-01)", () => {
  it("trims a real name", () => {
    expect(nameFrom("  Developer velora ")).toBe("Developer velora");
  });

  it.each([[""], ["   "], ["rudi@example.com"], [null], [42]])("rejects %j", (value) => {
    expect(nameFrom(value)).toBeNull();
  });
});

describe("loginWithJubelio (U-01)", () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubJubelio(login: object, employee: { status: number; body?: object } | "throw") {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/login")) return Response.json(login);
      if (employee === "throw") throw new Error("timeout");
      return Response.json(employee.body ?? {}, { status: employee.status });
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("takes the name from the employee lookup, sending the login token", async () => {
    const fetchMock = stubJubelio({ token: "tok", fullName: "Lama" }, { status: 200, body: { name: "Saeful Askar" } });
    expect(await loginWithJubelio("saefulaskarcompany@gmail.com", "pw")).toEqual({ ok: true, name: "Saeful Askar" });
    const [url, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(url).toContain("/wms/employee/saefulaskarcompany%40gmail.com");
    expect(init.headers).toEqual({ authorization: "tok" });
  });

  it("falls back to fullName when the lookup fails", async () => {
    stubJubelio({ token: "tok", fullName: "Saeful Askar" }, { status: 500 });
    expect(await loginWithJubelio("a@b.com", "pw")).toEqual({ ok: true, name: "Saeful Askar" });
  });

  it("still logs in without any name", async () => {
    stubJubelio({ token: "tok" }, "throw");
    expect(await loginWithJubelio("a@b.com", "pw")).toEqual({ ok: true, name: null });
  });
});
