import { describe, expect, it } from "vitest";
import { searchIndex, searchSite } from "./search-index";

describe("local public search", () => {
  it("ranks title matches before body matches", () => {
    expect(searchSite("reliable connections")[0]?.path).toBe("/services/network-wifi");
  });
  it("searches approved service detail and FAQ copy", () => {
    expect(searchSite("printer").some((result) => result.path === "/services/it-support")).toBe(true);
    expect(searchSite("multi factor").some((result) => result.path === "/services/cybersecurity")).toBe(true);
  });
  it("does not index legal, authentication, administration or disabled commerce routes", () => {
    expect(searchIndex.some(({ path }) => ["/privacy", "/terms", "/login", "/admin", "/shop"].some((privatePath) => path === privatePath || path.startsWith(`${privatePath}/`)))).toBe(false);
  });
  it("returns an empty result for a short or unrelated query", () => {
    expect(searchSite("x")).toEqual([]);
    expect(searchSite("zyxwvutsrq")).toEqual([]);
  });
});
