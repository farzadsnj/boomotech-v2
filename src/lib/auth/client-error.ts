export type AuthenticationErrorCategory = "verification-required" | "rate-limited" | "unavailable" | "credentials";

type AuthenticationClientError = { code?: string; status?: number } | null | undefined;

export function authenticationErrorCategory(error: AuthenticationClientError): AuthenticationErrorCategory {
  const code = error?.code?.toUpperCase() ?? "";
  if (code === "EMAIL_NOT_VERIFIED") return "verification-required";
  if (error?.status === 429 || code === "AUTHENTICATION_LOCKED" || code.includes("RATE_LIMIT") || code.includes("TOO_MANY")) return "rate-limited";
  if ((error?.status ?? 0) >= 500 || code === "AUTHENTICATION_TEMPORARILY_UNAVAILABLE") return "unavailable";
  return "credentials";
}
