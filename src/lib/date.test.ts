import { describe, expect, it } from "vitest";

import { formatFullDate, greeting, jakartaParts } from "@/lib/date";

describe("Asia/Jakarta dates", () => {
  it("rolls to the next day at 00.30 WIB while UTC is still the previous day", () => {
    const date = new Date("2026-10-26T17:30:00Z");
    expect(jakartaParts(date)).toMatchObject({ year: 2026, month: 10, day: 27, hour: 0 });
    expect(formatFullDate(date)).toBe("Selasa, 27 Okt 2026");
  });

  it.each([
    ["2026-10-27T00:00:00Z", "Selamat Pagi"],
    ["2026-10-27T04:00:00Z", "Selamat Siang"],
    ["2026-10-27T08:00:00Z", "Selamat Sore"],
    ["2026-10-27T11:00:00Z", "Selamat Malam"],
    ["2026-10-26T20:30:00Z", "Selamat Malam"],
  ])("greets %s with %s", (iso, expected) => {
    expect(greeting(new Date(iso))).toBe(expected);
  });
});
