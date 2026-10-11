import { describe, expect, it, vi } from "vitest";
import { recordSecurityEvent, redactSecurityMetadata } from "./events";

describe("security event redaction", () => {
  it("redacts sensitive keys and masks contact values", () => {
    expect(redactSecurityMetadata({
      route: "/api/example",
      token: "synthetic-sensitive-value",
      detail: "Contact person@example.test or +61 400 000 000",
    })).toEqual({ route: "/api/example", token: "[REDACTED]", detail: "Contact [MASKED_EMAIL] or [MASKED_PHONE]" });
  });

  it("emits a structured event without raw sensitive metadata", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    recordSecurityEvent("authorization_denied", { route: "/api/example", cookie: "synthetic-sensitive-value" });
    const output = String(warning.mock.calls[0]?.[0]);
    expect(JSON.parse(output)).toMatchObject({ category: "security", event: "authorization_denied", route: "/api/example", cookie: "[REDACTED]" });
    expect(output).not.toContain("synthetic-sensitive-value");
    warning.mockRestore();
  });
});
