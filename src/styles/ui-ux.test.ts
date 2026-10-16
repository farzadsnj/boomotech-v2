import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const globals = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const professional = readFileSync(new URL("./professional.css", import.meta.url), "utf8");

describe("UI and UX CSS safeguards", () => {
  it("uses the wider responsive container", () => {
    expect(globals).toContain("1440px");
    expect(globals).toContain("--space-container-gutter: clamp(");
  });

  it("limits animated navigation underlines to top-level links", () => {
    expect(globals).not.toMatch(/\.desktop-nav a::after/);
    expect(globals).toContain(".desktop-nav > a::after");
    expect(globals).toContain(".desktop-nav > .nav-cluster > a::after");
  });

  it("provides reduced-motion fallbacks for new animations", () => {
    expect(professional).toContain(".service-discovery__prompt i, .orbit-diagram__track, .orbit-diagram__node > span { animation: none !important; }");
  });
});
