import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openPrivateSearch, sealPrivateSearch } from "./private-search";

describe("private administrator search state", () => {
  beforeEach(() => vi.stubEnv("BETTER_AUTH_SECRET", "private-search-test-secret-at-least-32-characters"));
  afterEach(() => vi.unstubAllEnvs());

  it("encrypts a query and binds it to the administrator", () => {
    const token = sealPrivateSearch("admin-one", "customer@example.test");
    expect(token).not.toContain("customer");
    expect(openPrivateSearch(token, "admin-one")).toBe("customer@example.test");
    expect(openPrivateSearch(token, "admin-two")).toBeUndefined();
  });

  it("rejects tampered state", () => {
    const token = sealPrivateSearch("admin-one", "private search");
    expect(openPrivateSearch(`${token.slice(0, -1)}x`, "admin-one")).toBeUndefined();
  });
});
