import { describe, expect, it } from "vitest";
import { homeContent, phaseOneRoutes, site } from "./site";

describe("local site content", () => {
  it("provides a unique path for every Phase 1 preview", () => {
    const paths = phaseOneRoutes.map((route) => route.href);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toContain("/support");
    expect(paths).toContain("/get-a-quote");
    expect(paths).toContain("/privacy");
  });

  it("keeps homepage and navigation actions attached to existing routes", () => {
    const knownPaths = new Set(["/", ...phaseOneRoutes.map((route) => route.href)]);
    const actionPaths: string[] = [
      homeContent.primaryAction.href,
      homeContent.secondaryAction.href,
      ...homeContent.pathways.map((pathway) => pathway.href),
      ...homeContent.serviceGroups.flatMap((group) => group.links.map((link): string => link.href)),
      ...site.navigation.map((link) => link.href),
      ...site.footer.flatMap((group) => group.links.map((link): string => link.href)),
    ];
    for (const path of actionPaths) expect(knownPaths.has(path)).toBe(true);
  });
});
