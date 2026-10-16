import { createHmac } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { APIError, createAuthMiddleware, isAPIError } from "better-auth/api";
import { db } from "@/db";
import { authLoginGuard, session, user } from "@/db/schema";
import { requireBetterAuthSecret } from "./auth-env";

export const LOGIN_FAILURE_LIMIT = 5;
export const LOGIN_LOCK_MINUTES = 15;

const LOGIN_PATHS = new Set(["/sign-in/email", "/sign-in/username"]);
const INVALID_CREDENTIAL_CODES = new Set(["INVALID_EMAIL_OR_PASSWORD", "INVALID_USERNAME_OR_PASSWORD"]);

function normalizedIdentifier(path: string, body: Record<string, unknown>) {
  const value = path === "/sign-in/username" ? body.username : body.email;
  return typeof value === "string" ? value.trim().toLocaleLowerCase("en-AU") : "";
}

export function protectedLoginIdentifier(value: string) {
  return createHmac("sha256", requireBetterAuthSecret()).update(value).digest("hex");
}

async function guardKey(path: string, body: Record<string, unknown>) {
  const identifier = normalizedIdentifier(path, body);
  if (!identifier) return protectedLoginIdentifier(`unknown:${path}:empty`);
  const [knownUser] = await db.select({ id: user.id }).from(user).where(
    path === "/sign-in/username" ? eq(user.username, identifier) : eq(user.email, identifier),
  ).limit(1);
  return protectedLoginIdentifier(knownUser ? `user:${knownUser.id}` : `unknown:${path}:${identifier}`);
}

async function assertNotLocked(identifierHash: string, path: string) {
  const [guard] = await db.select({ lockedUntil: authLoginGuard.lockedUntil }).from(authLoginGuard)
    .where(eq(authLoginGuard.identifierHash, identifierHash)).limit(1);
  if (guard?.lockedUntil && guard.lockedUntil.getTime() > Date.now()) {
    throw APIError.from("UNAUTHORIZED", {
      code: path === "/sign-in/username" ? "INVALID_USERNAME_OR_PASSWORD" : "INVALID_EMAIL_OR_PASSWORD",
      message: path === "/sign-in/username" ? "Invalid username or password" : "Invalid email or password",
    });
  }
}

export async function recordLoginFailure(identifierHash: string) {
  await db.execute(sql`
    INSERT INTO auth_login_guard
      (identifier_hash, failed_attempts, window_started_at, locked_until, updated_at)
    VALUES (${identifierHash}, 1, NOW(), NULL, NOW())
    ON CONFLICT (identifier_hash) DO UPDATE SET
      failed_attempts = CASE
        WHEN auth_login_guard.locked_until > NOW() THEN auth_login_guard.failed_attempts
        WHEN auth_login_guard.window_started_at <= NOW() - INTERVAL '15 minutes' THEN 1
        ELSE auth_login_guard.failed_attempts + 1
      END,
      window_started_at = CASE
        WHEN auth_login_guard.locked_until > NOW() THEN auth_login_guard.window_started_at
        WHEN auth_login_guard.window_started_at <= NOW() - INTERVAL '15 minutes' THEN NOW()
        ELSE auth_login_guard.window_started_at
      END,
      locked_until = CASE
        WHEN auth_login_guard.locked_until > NOW() THEN auth_login_guard.locked_until
        WHEN (CASE
          WHEN auth_login_guard.window_started_at <= NOW() - INTERVAL '15 minutes' THEN 1
          ELSE auth_login_guard.failed_attempts + 1
        END) >= ${LOGIN_FAILURE_LIMIT} THEN NOW() + INTERVAL '15 minutes'
        ELSE NULL
      END,
      updated_at = NOW()
  `);
}

async function resetLoginFailures(identifierHash: string) {
  await db.delete(authLoginGuard).where(eq(authLoginGuard.identifierHash, identifierHash));
}

function unavailable() {
  return APIError.from("SERVICE_UNAVAILABLE", {
    code: "AUTHENTICATION_TEMPORARILY_UNAVAILABLE",
    message: "Sign in is temporarily unavailable. Try again later.",
  });
}

export function persistentLoginLockout() {
  return {
    id: "boomotech-persistent-login-lockout",
    hooks: {
      before: [{
        matcher: (context: { path?: string }) => Boolean(context.path && LOGIN_PATHS.has(context.path)),
        handler: createAuthMiddleware(async (context) => {
          try {
            await assertNotLocked(await guardKey(context.path, context.body as Record<string, unknown>), context.path);
          } catch (error) {
            if (isAPIError(error)) throw error;
            throw unavailable();
          }
        }),
      }],
      after: [{
        matcher: (context: { path?: string }) => Boolean(context.path && LOGIN_PATHS.has(context.path)),
        handler: createAuthMiddleware(async (context) => {
          try {
            const key = await guardKey(context.path, context.body as Record<string, unknown>);
            const returned = context.context.returned;
            if (isAPIError(returned)) {
              const code = typeof returned.body?.code === "string" ? returned.body.code : "";
              if (INVALID_CREDENTIAL_CODES.has(code)) await recordLoginFailure(key);
              return;
            }
            if (context.context.newSession && context.context.newSession.user.twoFactorEnabled !== true) await resetLoginFailures(key);
          } catch {
            if (context.context.newSession) {
              await db.delete(session).where(eq(session.token, context.context.newSession.session.token)).catch(() => undefined);
            }
            throw unavailable();
          }
        }),
      }, {
        matcher: (context: { path?: string }) => context.path === "/two-factor/verify-totp" || context.path === "/two-factor/verify-backup-code",
        handler: createAuthMiddleware(async (context) => {
          const returned = context.context.returned as { user?: { id?: string } } | unknown;
          if (isAPIError(returned) || !returned || typeof returned !== "object" || !("user" in returned)) return;
          const userId = (returned as { user?: { id?: string } }).user?.id;
          if (!userId) return;
          try {
            await resetLoginFailures(protectedLoginIdentifier(`user:${userId}`));
          } catch {
            const newSession = context.context.newSession;
            if (newSession) await db.delete(session).where(eq(session.token, newSession.session.token)).catch(() => undefined);
            throw unavailable();
          }
        }),
      }],
    },
  };
}
