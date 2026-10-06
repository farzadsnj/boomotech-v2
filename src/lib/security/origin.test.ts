import { describe, expect, it, vi } from "vitest";
import { hasApprovedMutationOrigin } from "./origin";

describe("mutation origin validation", () => {
  it("accepts the same origin and rejects a foreign origin", () => {
    vi.stubEnv("SITE_URL", "http://localhost:3000");
    expect(hasApprovedMutationOrigin(new Request("http://localhost:3000/api/requests/BT-0000000000", { headers: { origin: "http://localhost:3000" } }))).toBe(true);
    expect(hasApprovedMutationOrigin(new Request("http://localhost:3000/api/requests/BT-0000000000", { headers: { origin: "https://attacker.example" } }))).toBe(false);
    vi.unstubAllEnvs();
  });

  it("does not trust the request host as an approved production origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SITE_URL", "https://boomotech.example");
    expect(hasApprovedMutationOrigin(new Request("https://attacker.example/api/requests/BT-0000000000", { headers: { origin: "https://attacker.example" } }))).toBe(false);
    expect(hasApprovedMutationOrigin(new Request("https://internal-proxy/api/requests/BT-0000000000", { headers: { origin: "https://boomotech.example" } }))).toBe(true);
    vi.unstubAllEnvs();
  });
});
