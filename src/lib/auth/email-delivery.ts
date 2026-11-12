import { recordSecurityEvent } from "@/lib/security/events";

type AuthenticationEmailOperation = "password-reset" | "verification";

export async function requireAuthenticationEmailDelivery(
  operation: AuthenticationEmailOperation,
  delivery: () => Promise<void>,
) {
  try {
    await delivery();
  } catch (error) {
    const category = error instanceof Error && error.name.includes("Configuration")
      ? "configuration"
      : "delivery";
    recordSecurityEvent("security_dependency_unavailable", {
      dependency: "authentication_email",
      operation,
      reason: category,
      errorType: error instanceof Error ? error.name : "unknown",
    });
    console.error(`Authentication ${operation} email ${category} error. Check the server-only email settings, verified sender domain and provider status.`);
    throw error;
  }
}
