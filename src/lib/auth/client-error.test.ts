import { describe, expect, it } from "vitest";
import { authenticationErrorCategory } from "./client-error";

describe("authentication client error categories", () => {
  it("redirects only the documented verification error", () => {
    expect(authenticationErrorCategory({ status: 403, code: "EMAIL_NOT_VERIFIED" })).toBe("verification-required");
    expect(authenticationErrorCategory({ status: 403, code: "ADMIN_MFA_REQUIRED" })).toBe("credentials");
    expect(authenticationErrorCategory({ status: 403 })).toBe("credentials");
  });

  it("separates throttling and infrastructure failures without exposing account details", () => {
    expect(authenticationErrorCategory({ status: 429, code: "TOO_MANY_REQUESTS" })).toBe("rate-limited");
    expect(authenticationErrorCategory({ status: 503, code: "AUTHENTICATION_TEMPORARILY_UNAVAILABLE" })).toBe("unavailable");
    expect(authenticationErrorCategory({ status: 401, code: "INVALID_USERNAME_OR_PASSWORD" })).toBe("credentials");
  });
});
