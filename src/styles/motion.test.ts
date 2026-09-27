import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(fileURLToPath(new URL("./motion.css", import.meta.url)), "utf8");

describe("motion styles", () => {
  it("provides a reduced-motion override that leaves revealed content visible", () => {
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".motion-enabled .reveal");
    expect(css).toContain(".reveal { opacity: 1; transform: none; }");
    expect(css).toMatch(/opacity:\s*1\s*!important/);
    expect(css).toMatch(/animation:\s*none\s*!important/);
  });
});
