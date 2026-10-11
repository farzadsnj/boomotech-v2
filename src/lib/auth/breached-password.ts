import { createHash } from "node:crypto";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { recordSecurityEvent } from "@/lib/security/events";
import { passwordCodePointLength } from "./password-policy";

const PASSWORD_PATHS = new Set([
  "/sign-up/email",
  "/change-password",
  "/reset-password",
  "/admin/create-user",
  "/admin/set-user-password",
]);
const REQUEST_TIMEOUT_MS = 2_500;

export type PasswordCompromiseResult = "clear" | "compromised" | "unavailable";

function passwordFromBody(path: string, body: Record<string, unknown>) {
  if (path === "/sign-up/email" || path === "/admin/create-user") return body.password;
  return body.newPassword;
}

export async function checkPasswordCompromise(
  password: string,
  fetcher: typeof fetch = fetch,
): Promise<PasswordCompromiseResult> {
  const digest = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = digest.slice(0, 5);
  const suffix = digest.slice(5);
  try {
    const response = await fetcher(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true", "User-Agent": "BoomoTech password safety check" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return "unavailable";
    const matchingPrefix = `${suffix}:`;
    for (const line of (await response.text()).split(/\r?\n/)) {
      if (line.toUpperCase().startsWith(matchingPrefix)) return "compromised";
    }
    return "clear";
  } catch {
    return "unavailable";
  }
}

export function breachedPasswordProtection(
  checker: (password: string) => Promise<PasswordCompromiseResult> = checkPasswordCompromise,
) {
  const activeChecker = process.env.AUTH_EMAIL_CAPTURE_MODE === "test"
    ? async (): Promise<PasswordCompromiseResult> => "clear"
    : checker;
  return {
    id: "boomotech-breached-password-protection",
    hooks: {
      before: [{
        matcher: (context: { path?: string }) => Boolean(context.path && PASSWORD_PATHS.has(context.path)),
        handler: createAuthMiddleware(async (context) => {
          const candidate = passwordFromBody(context.path, context.body as Record<string, unknown>);
          if (typeof candidate !== "string") return;
          const length = passwordCodePointLength(candidate);
          if (length < 15 || length > 128) {
            throw APIError.from("BAD_REQUEST", { code: "PASSWORD_LENGTH_INVALID", message: "Use a password between 15 and 128 characters." });
          }
          const result = await activeChecker(candidate);
          if (result === "compromised") {
            throw APIError.from("BAD_REQUEST", { code: "PASSWORD_COMPROMISED", message: "Choose a password that has not appeared in known data breaches." });
          }
          if (result === "unavailable") {
            recordSecurityEvent("security_dependency_unavailable", { dependency: "password_breach_range" });
          }
        }),
      }],
    },
  };
}
