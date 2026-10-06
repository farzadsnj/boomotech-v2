import { describe, expect, it } from "vitest";
import { boomotechKnowledge } from "./knowledge";

describe("BoomoTech chat knowledge", () => {
  it("is generated from the approved service and FAQ content", () => {
    expect(boomotechKnowledge).toContain("SERVICE: IT support");
    expect(boomotechKnowledge).toContain("URL: /services/network-wifi");
    expect(boomotechKnowledge).toContain("PAGE: Common questions, answered carefully");
    expect(boomotechKnowledge).toContain("Never send passwords");
  });

  it("contains every approved service path", async () => {
    const { services } = await import("@/content/services");
    for (const service of services) expect(boomotechKnowledge).toContain(`URL: ${service.path}`);
  });
});
