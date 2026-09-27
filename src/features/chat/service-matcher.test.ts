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
  it("does not match AI inside email", () => {
    const paths = matchServices("My email is not working").map(({ service }) => service.path);
    expect(paths).toContain("/services/microsoft-365");
    expect(paths).not.toContain("/services/ai-automation");
  });
  it.each([
    ["My LAPTOP is very slow", "/services/it-support"],
    ["We need help with wi fi in a new office", "/services/network-wifi"],
    ["I think an account was hacked after a phishing email", "/services/cybersecurity"],
    ["Can you automate repetitive administration?", "/services/ai-automation"],
    ["We need ongoing IT support", "/services/managed-it"],
  ])("matches representative customer wording: %s", (question, expected) => expect(matchServices(question).map(({ service }) => service.path)).toContain(expected));
});
