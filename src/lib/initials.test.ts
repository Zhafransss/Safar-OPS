import { describe, expect, it } from "vitest";

import { initials } from "@/lib/initials";

describe("initials (K-T79)", () => {
  it("uses the first letter of up to two words", () => {
    expect(initials("Kartika", [])).toBe("K");
    expect(initials("Chaesar Syaefuddin", [])).toBe("CS");
    expect(initials("Chaesar 2", [])).toBe("C2");
  });

  it("uses two letters of the name for both users on a clash", () => {
    expect(initials("Kartika", ["Kurnia"])).toBe("Ka");
    expect(initials("Kurnia", ["Kartika"])).toBe("Ku");
  });
});
