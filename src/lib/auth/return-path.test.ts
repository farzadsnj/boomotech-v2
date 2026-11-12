import { describe, expect, it } from "vitest";
import { authHref, PTE_RETURN_PATH, validatedReturnPath } from "./return-path";

describe("authentication return paths", () => {
  it("allows only the PTEpath route and its local children", () => {
    expect(validatedReturnPath(PTE_RETURN_PATH)).toBe(PTE_RETURN_PATH);
    expect(validatedReturnPath(`${PTE_RETURN_PATH}/practice`)).toBe(`${PTE_RETURN_PATH}/practice`);
    expect(authHref("/login", PTE_RETURN_PATH)).toBe("/login?returnTo=%2Flearning%2Fpte-academic");
  });

  it.each(["https://evil.test", "//evil.test/path", "/login", "/admin", "/learning/other", "/learning/pte-academic#token", "/learning%2Fpte-academic", "/learning/pte-academic\\evil"])("rejects unsafe or looping destination %s", (value) => {
    expect(validatedReturnPath(value)).toBeUndefined();
  });
});
