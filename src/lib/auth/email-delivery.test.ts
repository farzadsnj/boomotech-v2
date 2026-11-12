import { describe, expect, it, vi } from "vitest";
import { requireAuthenticationEmailDelivery } from "./email-delivery";

describe("authentication email delivery enforcement", () => {
  it("does not report success when the provider rejects delivery", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const providerFailure = Object.assign(new Error("synthetic provider response"), { name: "VerificationEmailDeliveryError" });

    await expect(requireAuthenticationEmailDelivery("verification", async () => {
      throw providerFailure;
    })).rejects.toBe(providerFailure);

    const event = String(warning.mock.calls[0]?.[0]);
    expect(JSON.parse(event)).toMatchObject({
      event: "security_dependency_unavailable",
      dependency: "authentication_email",
      operation: "verification",
      reason: "delivery",
      errorType: "VerificationEmailDeliveryError",
    });
    expect(event).not.toContain("synthetic provider response");
    expect(String(error.mock.calls[0]?.[0])).not.toContain("synthetic provider response");
    warning.mockRestore();
    error.mockRestore();
  });

  it("completes only after the delivery operation succeeds", async () => {
    const delivery = vi.fn().mockResolvedValue(undefined);
    await expect(requireAuthenticationEmailDelivery("password-reset", delivery)).resolves.toBeUndefined();
    expect(delivery).toHaveBeenCalledOnce();
  });
});
