import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("legacy routes", () => {
  it("redirects approved legacy service paths and leaves the retired demo absent", async () => {
    const redirects = await nextConfig.redirects!();
    expect(redirects).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: "/it-support-helpdesk/", destination: "/services/it-support", permanent: true }),
      expect.objectContaining({ source: "/services/digital-marketing/", destination: "/services/digital-presence", permanent: true })
    ]));
    expect(redirects.some((item) => item.source.includes("cms-software-solutions"))).toBe(false);
  });
});
