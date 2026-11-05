import { describe, expect, it } from "vitest";

import { formatDate, formatFullDate, formatShortDate, greeting, jakartaParts, relativeAge, reportPeriod } from "@/lib/date";

describe("report date helpers", () => {
  const lateNight = new Date("2026-10-26T17:30:00Z"); // 27 Oct 00.30 WIB

  it("formats in Jakarta time", () => {
    expect(formatDate(lateNight)).toBe("27 Okt 2026");
    expect(formatShortDate(lateNight)).toBe("27 Okt");
  });

  it("counts calendar days, not elapsed hours", () => {
    const evening = new Date("2026-10-26T15:00:00Z"); // 26 Oct 22.00 WIB
    expect(relativeAge(evening, lateNight)).toBe("1 hari yang lalu");
    expect(relativeAge(lateNight, lateNight)).toBe("hari ini");
    expect(relativeAge(new Date("2026-10-23T05:00:00Z"), lateNight)).toBe("4 hari yang lalu");
  });

  it("uses the Jakarta month for the report period", () => {
    expect(reportPeriod(new Date("2026-10-31T17:30:00Z"))).toBe("2611");
    expect(reportPeriod(lateNight)).toBe("2610");
  });
});

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
