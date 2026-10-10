import { describe, expect, it } from "vitest";
import { allPages, intendedPublicRoutes } from "./routes";
import { services } from "./services";
import { solutions } from "./solutions";
import { homeContent, site } from "./site";
import { publishedArticles } from "./blog";

const requiredPaths = [
  "/services", "/services/it-support", "/services/managed-it", "/services/microsoft-365",
  "/services/cloud-infrastructure", "/services/network-wifi", "/services/cybersecurity",
  "/services/backup-recovery", "/services/ai-automation", "/services/web-software",
  "/services/digital-presence", "/services/ui-ux-branding", "/solutions",
  "/solutions/small-business", "/solutions/professional-services", "/solutions/retail",
  "/solutions/home-office-individuals", "/solutions/remote-work", "/support",
  "/support/remote", "/support/onsite", "/support/safety", "/book",
  "/book/consultation", "/book/remote-support", "/book/onsite-support",
  "/book/project-discovery", "/resources", "/faq", "/about", "/contact",
  "/get-a-quote", "/privacy", "/cookies", "/terms",
];

describe("local Phase 1 content", () => {
  it("provides every approved route exactly once", () => {
    const paths = allPages.map((page) => page.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.sort()).toEqual([...requiredPaths].sort());
    expect(intendedPublicRoutes).toContain("/");
    expect(intendedPublicRoutes).toContain("/services/it-support");
    expect(intendedPublicRoutes).toContain("/tools/it-health-check");
    expect(intendedPublicRoutes).not.toContain("/privacy");
    expect(intendedPublicRoutes).not.toContain("/shop");
    expect(intendedPublicRoutes).toHaveLength(1 + 2 + services.length + solutions.length + 7 + publishedArticles.length);
  });

  it("gives every service the required useful content", () => {
    expect(services).toHaveLength(11);
    for (const service of services) {
      expect(service.visual.src).toMatch(/^\/visuals\/services\/.+\.svg$/);
      expect(service.visual.alt.length).toBeGreaterThan(15);
      expect(service.audience.length).toBeGreaterThan(20);
      expect(service.signals.length).toBeGreaterThanOrEqual(3);
      expect(service.inclusions.length).toBeGreaterThanOrEqual(3);
      expect(service.delivery.length).toBeGreaterThan(20);
      expect(service.outcomes.length).toBeGreaterThanOrEqual(3);
      expect(service.process.length).toBeGreaterThanOrEqual(3);
      expect(service.related.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("keeps page metadata unique and useful", () => {
    const titles = allPages.map((page) => page.title);
    const descriptions = allPages.map((page) => page.metaDescription);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const page of allPages) expect(page.metaDescription.length).toBeGreaterThan(50);
  });

  it("organises solutions around audiences, problems and priorities", () => {
    expect(solutions).toHaveLength(5);
    for (const solution of solutions) {
      expect(solution.visual.src).toMatch(/^\/visuals\/solutions\/.+\.svg$/);
      expect(solution.visual.alt.length).toBeGreaterThan(15);
      expect(solution.audience).toBeTruthy();
      expect(solution.challenges.length).toBeGreaterThanOrEqual(3);
      expect(solution.priorities.length).toBeGreaterThanOrEqual(3);
      expect(solution.approach.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("provides practical support, resources and verified founder content", () => {
    const support = allPages.find(({ path }) => path === "/support");
    const resources = allPages.find(({ path }) => path === "/resources");
    const about = allPages.find(({ path }) => path === "/about");
    expect(support && "faqs" in support ? support.faqs : []).toHaveLength(10);
    expect(resources && "resources" in resources ? resources.resources : []).toHaveLength(10);
    expect(JSON.stringify(about)).toContain("Farzad Sanjarani");
    expect(JSON.stringify(about)).toContain("QUT");
  });

  it("keeps homepage and navigation actions attached to known routes", () => {
    const knownPaths = new Set(["/", "/booking", "/blog", "/shop", "/login", "/tools/it-health-check", ...allPages.map(({ path }) => path)]);
    const actionPaths = [homeContent.primaryAction.href, homeContent.secondaryAction.href,
      ...homeContent.pathways.map((pathway) => pathway.href),
      ...homeContent.serviceGroups.flatMap((group) => group.links.map((link) => link.href)),
      ...site.navigation.map((link) => link.href),
      ...site.footer.flatMap((group) => group.links.map((link) => link.href))];
    for (const path of actionPaths) expect(knownPaths.has(path)).toBe(true);
  });

  it("keeps the dedicated blog implementation out of catch-all page records", () => {
    expect(allPages.some(({ path }) => path === "/blog")).toBe(false);
    expect(allPages.some(({ path }) => path === "/shop")).toBe(false);
  });

  it("does not contradict the enabled booking-request journey", () => {
    const publishedCopy = JSON.stringify({ homeContent, site, services, solutions, pages: allPages }).toLowerCase();
    for (const contradiction of ["booking is not active", "booking workflow is not active", "does not collect or transmit information"]) expect(publishedCopy).not.toContain(contradiction);
  });
});
