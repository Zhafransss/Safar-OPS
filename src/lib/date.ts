// All calendar logic runs in Asia/Jakarta because servers run in UTC (NFR-06, CHANGELOG 9).
const TIME_ZONE = "Asia/Jakarta";

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"] as const;

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  hourCycle: "h23",
});

export type JakartaParts = { year: number; month: number; day: number; hour: number };

export function jakartaParts(date: Date): JakartaParts {
  const parts = Object.fromEntries(partsFormatter.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
  };
}

export function formatFullDate(date: Date): string {
  const { year, month, day } = jakartaParts(date);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${DAY_NAMES[dayOfWeek]}, ${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

// Mockup fmt: "27 Okt 2026".
export function formatDate(date: Date): string {
  const { year, month, day } = jakartaParts(date);
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

// Mockup fmtS: "27 Okt".
export function formatShortDate(date: Date): string {
  const { month, day } = jakartaParts(date);
  return `${day} ${MONTH_NAMES[month - 1]}`;
}

function jakartaDayNumber(date: Date): number {
  const { year, month, day } = jakartaParts(date);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

// Mockup ago (K-T27): calendar days in Jakarta, not elapsed hours.
export function relativeAge(date: Date, now: Date): string {
  const days = jakartaDayNumber(now) - jakartaDayNumber(date);
  if (days <= 0) return "hari ini";
  return days === 1 ? "1 hari yang lalu" : `${days} hari yang lalu`;
}

// Today in Jakarta as YYYY-MM-DD, the form to-do DLs are compared in.
export function jakartaIsoDate(date: Date): string {
  const { year, month, day } = jakartaParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Calendar days from b to a, both YYYY-MM-DD. Negative means a is earlier.
export function diffDays(a: string, b: string): number {
  return (Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000;
}

// A DL has no time, so it is formatted from its own digits and never shifted by a time zone.
export function formatIsoShort(iso: string): string {
  const [, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTH_NAMES[(month ?? 1) - 1]}`;
}

// K-T83: the YYMM prefix of a report number.
export function reportPeriod(date: Date): string {
  const { year, month } = jakartaParts(date);
  return `${String(year).slice(-2)}${String(month).padStart(2, "0")}`;
}

// CHANGELOG 18: the mockup hardcodes "Selamat Siang" as a sample.
export function greeting(date: Date): string {
  const { hour } = jakartaParts(date);
  if (hour >= 4 && hour < 11) return "Selamat Pagi";
  if (hour >= 11 && hour < 15) return "Selamat Siang";
  if (hour >= 15 && hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}
