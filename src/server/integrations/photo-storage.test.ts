import { describe, expect, it } from "vitest";

import { detectExtension, isOwnKey, newPhotoKey } from "@/server/integrations/photo-storage";

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
