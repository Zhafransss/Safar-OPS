import { afterEach, describe, expect, it, vi } from "vitest";

import { detectExtension, isOwnKey, newPhotoKey, photoResponse } from "@/server/integrations/photo-storage";

describe("detectExtension", () => {
  it("recognizes real image headers", () => {
    expect(detectExtension(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpg");
    expect(detectExtension(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe("png");
    expect(detectExtension(new TextEncoder().encode("RIFF....WEBPVP8 "))).toBe("webp");
  });

  it("rejects anything else, whatever it is named", () => {
    expect(detectExtension(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
  });
});

describe("photo keys", () => {
  it("belong to their uploader only", () => {
    const key = newPhotoKey("user-a", "jpg");
    expect(isOwnKey(key, "user-a")).toBe(true);
    expect(isOwnKey(key, "user-b")).toBe(false);
  });

  it("reject path traversal", () => {
    expect(isOwnKey("../../etc/passwd", "user-a")).toBe(false);
    expect(isOwnKey("user-a/../../secret.jpg", "user-a")).toBe(false);
  });
});

describe("R2 photo reads", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function useR2(stored: Response) {
    vi.stubEnv("R2_BUCKET", "photos");
    vi.stubEnv("R2_ACCOUNT_ID", "acct");
    vi.stubEnv("R2_ACCESS_KEY_ID", "id");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "secret");
    const fetchMock = vi.fn(async (_request: Request) => stored);
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("streams the photo from R2 so the browser never contacts R2", async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const fetchMock = useR2(new Response(bytes, { headers: { "content-length": "4" } }));
    const key = newPhotoKey("user-a", "jpg");

    const response = await photoResponse(key);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("cache-control")).toContain("private");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    const request = fetchMock.mock.calls[0]?.[0];
    expect(request?.url).toBe(`https://acct.r2.cloudflarestorage.com/photos/${key}`);
    expect(request?.headers.get("authorization")).toContain("AWS4-HMAC-SHA256");
  });

  it("answers 404 when the object is missing from R2", async () => {
    useR2(new Response(null, { status: 404 }));
    const response = await photoResponse(newPhotoKey("user-a", "png"));
    expect(response.status).toBe(404);
  });
});
