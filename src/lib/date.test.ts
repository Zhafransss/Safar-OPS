import { describe, expect, it } from "vitest";

import {
  diffDays,
  formatDate,
  formatFullDate,
  formatIsoShort,
  formatShortDate,
  greeting,
  jakartaIsoDate,
  jakartaParts,
  relativeAge,
  reportPeriod,
} from "@/lib/date";

describe("DL date helpers", () => {
  it("uses the Jakarta date at 00.30 WIB", () => {
    expect(jakartaIsoDate(new Date("2026-10-26T17:30:00Z"))).toBe("2026-10-27");
  });

  it("counts calendar days across a month end", () => {
    expect(diffDays("2026-12-01", "2026-11-30")).toBe(1);
    expect(diffDays("2026-11-04", "2026-11-05")).toBe(-1);
  });

  it("formats a DL without any time zone shift", () => {
    expect(formatIsoShort("2026-11-01")).toBe("1 Nov");
  });
});

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
