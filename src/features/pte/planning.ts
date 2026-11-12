import { exerciseBank } from "./exercise-bank";
import type { PteTaskType } from "./types";

export type PlanInput = { startDate: string; durationDays: number; dailyMinutes: number; studyDays: number[]; weakness?: Partial<Record<PteTaskType, number>> };
export type PlannedDay = { studyDate: string; phase: "baseline" | "guided" | "timed" | "review" | "final"; exerciseIds: string[]; review: boolean };

function parseDate(value: string) { const [year, month, day] = value.split("-").map(Number); return new Date(Date.UTC(year, month - 1, day, 12)); }
function dateKey(value: Date) { return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`; }

export function buildLearningPlan(input: PlanInput): PlannedDay[] {
  if (!input.studyDays.length) return [];
  const weighted = [...exerciseBank].sort((a, b) => (input.weakness?.[b.taskType] ?? 0) - (input.weakness?.[a.taskType] ?? 0) || a.id.localeCompare(b.id));
  const days: PlannedDay[] = [];
  let cursor = parseDate(input.startDate); let exerciseIndex = 0; let calendarDays = 0;
  while (days.length < input.durationDays && calendarDays < 1_100) {
    calendarDays += 1;
    if (input.studyDays.includes(cursor.getUTCDay())) {
      const position = days.length / Math.max(1, input.durationDays - 1);
      const review = days.length > 0 && (days.length + 1) % 4 === 0;
      const phase: PlannedDay["phase"] = days.length === 0 ? "baseline" : position >= .9 ? "final" : review ? "review" : position >= .65 ? "timed" : "guided";
      const count = input.dailyMinutes >= 90 ? 3 : input.dailyMinutes >= 40 ? 2 : 1;
      const exerciseIds = Array.from({ length: count }, (_, offset) => weighted[(exerciseIndex + offset) % weighted.length].id);
      days.push({ studyDate: dateKey(cursor), phase, exerciseIds, review });
      exerciseIndex += review ? Math.max(1, count - 1) : count;
    }
    cursor = new Date(cursor.getTime() + 86_400_000);
  }
  return days;
}

export function localDateInTimeZone(timezone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function prioritiseMistakes<T extends { category: string; reviewedAt: string | null; createdAt: string }>(mistakes: T[]) {
  const unresolvedCounts = new Map<string, number>();
  for (const mistake of mistakes) if (!mistake.reviewedAt) unresolvedCounts.set(mistake.category, (unresolvedCounts.get(mistake.category) ?? 0) + 1);
  return [...mistakes].sort((left, right) => {
    if (Boolean(left.reviewedAt) !== Boolean(right.reviewedAt)) return left.reviewedAt ? 1 : -1;
    const frequency = (unresolvedCounts.get(right.category) ?? 0) - (unresolvedCounts.get(left.category) ?? 0);
    if (frequency) return frequency;
    return left.createdAt.localeCompare(right.createdAt);
  });
}
