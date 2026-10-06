import { describe, expect, it } from "vitest";
import { infoPages } from "@/content/pages";
import { site } from "@/content/site";

describe("privacy and browser-storage information", () => {
  it("publishes privacy and cookie policy pages", () => {
    const privacy = infoPages.find((page) => page.path === "/privacy");
    const cookies = infoPages.find((page) => page.path === "/cookies");

    expect(privacy?.kind).toBe("legal");
    expect(privacy?.title).toBe("Privacy policy");
    expect(privacy?.sections?.some((section) => section.title === "Service providers and overseas processing")).toBe(true);
    expect(cookies?.kind).toBe("legal");
    expect(cookies?.sections?.some((section) => section.title === "Browser cache")).toBe(true);
  });

  it("links both policies from the global footer", () => {
    const information = site.footer.find((group) => group.title === "Information");
    expect(information?.links).toEqual(expect.arrayContaining([
      { label: "Privacy policy", href: "/privacy" },
      { label: "Cookies & browser storage", href: "/cookies" },
    ]));
  });
});
