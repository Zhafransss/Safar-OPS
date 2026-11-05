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

// CHANGELOG 18: the mockup hardcodes "Selamat Siang" as a sample.
export function greeting(date: Date): string {
  const { hour } = jakartaParts(date);
  if (hour >= 4 && hour < 11) return "Selamat Pagi";
  if (hour >= 11 && hour < 15) return "Selamat Siang";
  if (hour >= 15 && hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}
