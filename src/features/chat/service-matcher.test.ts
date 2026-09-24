import { describe, expect, it } from "vitest";
import { matchServices, serviceGuidance } from "./service-matcher";

describe("service matching", () => {
  it("matches office computers and Wi-Fi to approved services", () => {
    const paths = matchServices("I need help setting up computers and Wi-Fi for my office").map(({ service }) => service.path);
    expect(paths).toContain("/services/it-support");
    expect(paths).toContain("/services/network-wifi");
  });
  it("returns a safe fallback for an unknown request", () => {
    expect(serviceGuidance("something completely unrelated").matches).toHaveLength(0);
  });
  it("returns service records as the source of labels and links", () => {
    const [match] = matchServices("cyber security and phishing");
    expect(match.service.name).toBe("Cybersecurity");
    expect(match.service.path).toBe("/services/cybersecurity");
  });
});
