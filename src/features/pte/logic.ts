export type PteTimerState = { mode: "timed" | "untimed"; durationSeconds: number; startedAt: number | null; elapsedBeforeSeconds: number; running: boolean };

export function adjacentPairScore(order: string[], correctOrder: string[]) {
  if (correctOrder.length < 2) return { correct: 0, total: 0, percent: 0 };
  const correctPairs = new Set(correctOrder.slice(0, -1).map((item, index) => `${item}:${correctOrder[index + 1]}`));
  const correct = order.slice(0, -1).filter((item, index) => correctPairs.has(`${item}:${order[index + 1]}`)).length;
  const total = correctOrder.length - 1;
  return { correct, total, percent: Math.round((correct / total) * 100) };
}

export function wordCount(value: string) { return value.trim() ? value.trim().split(/\s+/u).length : 0; }

export function writingFormChecks(taskType: "summarise-written-text" | "write-essay", value: string, range: readonly [number, number]) {
  const count = wordCount(value); const sentenceStops = (value.match(/[.!?](?:\s|$)/g) ?? []).length;
  return { wordCount: count, withinWordRange: count >= range[0] && count <= range[1], oneSentence: taskType === "summarise-written-text" ? sentenceStops === 1 : null };
}

export function timerElapsedSeconds(timer: PteTimerState, now = Date.now()) {
  return Math.min(timer.durationSeconds, timer.elapsedBeforeSeconds + (timer.running && timer.startedAt ? Math.max(0, Math.floor((now - timer.startedAt) / 1000)) : 0));
}
export function timerRemainingSeconds(timer: PteTimerState, now = Date.now()) { return Math.max(0, timer.durationSeconds - timerElapsedSeconds(timer, now)); }
export function pauseTimer(timer: PteTimerState, now = Date.now()): PteTimerState { return { ...timer, elapsedBeforeSeconds: timerElapsedSeconds(timer, now), startedAt: null, running: false }; }
export function startTimer(timer: PteTimerState, now = Date.now()): PteTimerState { return timer.mode === "untimed" || timerRemainingSeconds(timer, now) === 0 ? timer : { ...timer, startedAt: now, running: true }; }

