import { describe, expect, it } from "vitest";
import { parseDashboardTheme } from "./theme";

describe("dashboard theme preference", () => {
  it("accepts only the supported dark value and otherwise defaults safely", () => {
    expect(parseDashboardTheme("dark")).toBe("dark");
    expect(parseDashboardTheme("light")).toBe("light");
    expect(parseDashboardTheme("system")).toBe("light");
    expect(parseDashboardTheme(undefined)).toBe("light");
  });
});
