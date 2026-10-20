import { z } from "zod";

export const BRISBANE_TIME_ZONE = "Australia/Brisbane";
const BRISBANE_OFFSET_MS = 10 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const calendarViews = ["month", "list"] as const;
export const calendarViewSchema = z.enum(calendarViews);
export type CalendarView = z.infer<typeof calendarViewSchema>;

export const requestActivityTypes = ["created", "resolved"] as const;
export const requestActivityTypeSchema = z.enum(requestActivityTypes);
export type RequestActivityType = z.infer<typeof requestActivityTypeSchema>;

export const calendarMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).refine((value) => {
  const year = Number(value.slice(0, 4));
  return year >= 2000 && year <= 2100;
}, "Choose a month between 2000 and 2100.");

export function brisbaneDateKey(instant: Date) {
  const local = new Date(instant.getTime() + BRISBANE_OFFSET_MS);
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}-${String(local.getUTCDate()).padStart(2, "0")}`;
}

export function currentBrisbaneMonth(now = new Date()) {
  return brisbaneDateKey(now).slice(0, 7);
}

export function parseCalendarMonth(value: string | undefined, now = new Date()) {
  const parsed = calendarMonthSchema.safeParse(value);
  return { month: parsed.success ? parsed.data : currentBrisbaneMonth(now), valid: parsed.success || value === undefined };
}

export function calendarMonthRange(month: string) {
  const parsed = calendarMonthSchema.parse(month);
  const [year, monthNumber] = parsed.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1) - BRISBANE_OFFSET_MS);
  const endExclusive = new Date(Date.UTC(year, monthNumber, 1) - BRISBANE_OFFSET_MS);
  const label = new Intl.DateTimeFormat("en-AU", {
    month: "long",
    timeZone: BRISBANE_TIME_ZONE,
    year: "numeric",
  }).format(start);
  return { endExclusive, label, month: monthNumber, start, year };
}

export function shiftCalendarMonth(month: string, amount: number) {
  const { month: monthNumber, year } = calendarMonthRange(month);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type CalendarDay = {
  date: string;
  day: number;
  inMonth: boolean;
};

export function calendarMonthDays(month: string): CalendarDay[] {
  const range = calendarMonthRange(month);
  const localFirst = new Date(Date.UTC(range.year, range.month - 1, 1));
  const mondayOffset = (localFirst.getUTCDay() + 6) % 7;
  const firstGridDay = localFirst.getTime() - mondayOffset * DAY_MS;
  return Array.from({ length: 42 }, (_, index) => {
    const localDay = new Date(firstGridDay + index * DAY_MS);
    const date = `${localDay.getUTCFullYear()}-${String(localDay.getUTCMonth() + 1).padStart(2, "0")}-${String(localDay.getUTCDate()).padStart(2, "0")}`;
    return { date, day: localDay.getUTCDate(), inMonth: localDay.getUTCMonth() === range.month - 1 };
  });
}
