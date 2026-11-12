import { describe, expect, it } from "vitest";
import { adjacentPairScore, pauseTimer, startTimer, timerRemainingSeconds, writingFormChecks } from "./logic";

describe("PTE practice logic", () => {
  it("explains paragraph order as correct adjacent pairs", () => {
    expect(adjacentPairScore(["a", "b", "d", "c"], ["a", "b", "c", "d"])).toEqual({ correct: 1, total: 3, percent: 33 });
    expect(adjacentPairScore(["a", "b", "c", "d"], ["a", "b", "c", "d"])).toEqual({ correct: 3, total: 3, percent: 100 });
  });

  it("keeps timer time accurate across backgrounding and reload", () => {
    const initial = { mode: "timed" as const, durationSeconds: 600, startedAt: null, elapsedBeforeSeconds: 45, running: false };
    const started = startTimer(initial, 1_000_000);
    expect(timerRemainingSeconds(started, 1_120_000)).toBe(435);
    const paused = pauseTimer(started, 1_120_000);
    expect(paused).toMatchObject({ running: false, startedAt: null, elapsedBeforeSeconds: 165 });
    expect(timerRemainingSeconds(paused, 9_000_000)).toBe(435);
  });

  it("checks writing form without presenting it as language scoring", () => {
    expect(writingFormChecks("summarise-written-text", "One controlled sentence.", [3, 10])).toEqual({ wordCount: 3, withinWordRange: true, oneSentence: true });
    expect(writingFormChecks("write-essay", "Too short.", [200, 300])).toMatchObject({ withinWordRange: false, oneSentence: null });
  });
});
