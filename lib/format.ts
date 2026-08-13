export const TASHKENT_TIMEZONE = "Asia/Tashkent";

export function formatMoney(value: number, compact = false) {
  if (compact && Math.abs(value) >= 1_000_000) {
    return `${new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 1 }).format(value / 1_000_000)} mln`;
  }
  return `${new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(value)} so‘m`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(value);
}

export function todayTashkent() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TASHKENT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function currentMonthTashkent() {
  return todayTashkent().slice(0, 7);
}

export function monthRange(month: string) {
  const [year, rawMonth] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, rawMonth, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
}

export function previousMonth(month: string) {
  const [year, rawMonth] = month.split("-").map(Number);
  const value = new Date(Date.UTC(year, rawMonth - 2, 1));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function daysAgoDate(days: number) {
  const today = todayTashkent();
  const date = new Date(`${today}T00:00:00+05:00`);
  date.setUTCDate(date.getUTCDate() - days);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TASHKENT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function shortDate(date: string) {
  return new Intl.DateTimeFormat("uz-UZ", { day: "2-digit", month: "short" }).format(
    new Date(`${date.slice(0, 10)}T00:00:00+05:00`),
  );
}

export function longDate(date = todayTashkent()) {
  return new Intl.DateTimeFormat("uz-UZ", {
    timeZone: TASHKENT_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00+05:00`));
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
