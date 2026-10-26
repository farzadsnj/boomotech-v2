import { describe, expect, it } from "vitest";
import { searchIndex, searchSite } from "./search-index";

describe("local public search", () => {
  it("ranks title matches before body matches", () => {
    expect(searchSite("network problems")[0]?.path).toBe("/services/network-wifi");
  });
  it("searches approved service detail and FAQ copy", () => {
    expect(searchSite("printer").some((result) => result.path === "/services/it-support")).toBe(true);
    expect(searchSite("multi factor").some((result) => result.path === "/services/cybersecurity")).toBe(true);
  });
  it.each([
    ["my laptop is slow", "/services/it-support"],
    ["wifi keeps dropping", "/services/network-wifi"],
    ["printer offline", "/services/it-support"],
    ["business email not working", "/services/microsoft-365"],
    ["new employee account", "/services/microsoft-365"],
    ["need a website", "/services/web-software"],
    ["automate repetitive admin", "/services/ai-automation"],
  ])("ranks the intended service first for %s", (query, expected) => {
    expect(searchSite(query)[0]?.path).toBe(expected);
  });
  it("does not index legal, authentication, administration or disabled commerce routes", () => {
    expect(searchIndex.some(({ path }) => ["/privacy", "/terms", "/login", "/admin", "/shop"].some((privatePath) => path === privatePath || path.startsWith(`${privatePath}/`)))).toBe(false);
  });
  it("returns an empty result for a short or unrelated query", () => {
    expect(searchSite("x")).toEqual([]);
    expect(searchSite("zyxwvutsrq")).toEqual([]);
    expect(searchSite("is my the")).toEqual([]);
  });
});
