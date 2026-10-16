import { eq } from "drizzle-orm";
import { APIError, createAuthMiddleware, getSessionFromCtx, isAPIError } from "better-auth/api";
import { db } from "@/db";
import { session as sessionTable, verification } from "@/db/schema";

const MFA_VERIFY_PATHS = new Set(["/two-factor/verify-totp", "/two-factor/verify-backup-code"]);

export function administratorMfaEnforcement() {
  return {
    id: "boomotech-administrator-mfa-enforcement",
    hooks: {
      before: [{
        matcher: (context: { path?: string }) => Boolean(context.path?.startsWith("/admin/") || context.path === "/two-factor/disable" || (context.path && MFA_VERIFY_PATHS.has(context.path))),
        handler: createAuthMiddleware(async (context) => {
          const session = await getSessionFromCtx(context);
          if (!session && MFA_VERIFY_PATHS.has(context.path)) {
            try {
              const cookie = context.context.createAuthCookie("two_factor");
              const identifier = await context.getSignedCookie(cookie.name, context.context.secret);
              if (identifier) {
                const [challenge] = await db.select({ expiresAt: verification.expiresAt }).from(verification).where(eq(verification.identifier, identifier)).limit(1);
                if (challenge && challenge.expiresAt.getTime() <= Date.now()) {
                  await db.delete(verification).where(eq(verification.identifier, identifier));
                  throw APIError.from("UNAUTHORIZED", { code: "INVALID_TWO_FACTOR_COOKIE", message: "Invalid two factor cookie" });
                }
              }
            } catch (error) {
              if (isAPIError(error)) throw error;
              throw APIError.from("SERVICE_UNAVAILABLE", { code: "AUTHENTICATION_TEMPORARILY_UNAVAILABLE", message: "Authentication is temporarily unavailable." });
            }
          }
          if (context.path === "/two-factor/disable" && session?.user.role === "admin") {
            throw APIError.from("FORBIDDEN", {
              code: "ADMIN_MFA_REQUIRED",
              message: "Administrator multi-factor authentication cannot be disabled.",
            });
          }
          if (context.path.startsWith("/admin/") && session?.user.role === "admin" && session.user.twoFactorEnabled !== true) {
            throw APIError.from("FORBIDDEN", {
              code: "ADMIN_MFA_REQUIRED",
              message: "Administrator multi-factor authentication is required.",
            });
          }
        }),
      }],
      after: [{
        matcher: (context: { path?: string }) => context.path === "/two-factor/generate-backup-codes",
        handler: createAuthMiddleware(async (context) => {
          if (isAPIError(context.context.returned)) return;
          const session = await getSessionFromCtx(context);
          if (session?.user.role === "admin") {
            await db.delete(sessionTable).where(eq(sessionTable.userId, session.user.id));
          }
        }),
      }],
    },
  };
}
