import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, haveIBeenPwned, twoFactor, username } from "better-auth/plugins";
import { db } from "@/db";
import { authSchema, session as sessionTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";
import { sendAccountVerificationEmail } from "@/features/email-verification/send";
import { verificationTtlMinutes } from "@/features/email-verification/grants";
import { passwordResetTtlMinutes, sendAccountPasswordResetEmail } from "@/features/password-reset/send";
import { hashPassword, verifyPassword } from "./password";
import { getBetterAuthUrl, requireBetterAuthSecret, usesSecureAuthenticationCookies } from "./auth-env";
import { persistentLoginLockout } from "./login-lockout";
import { passwordLengthProtection } from "./password-protection";
import { administratorMfaEnforcement } from "./admin-mfa";

const siteOrigin = getSiteUrl().origin;
const authOrigin = getBetterAuthUrl().origin;
const localOrigins = process.env.NODE_ENV === "production"
  ? []
  : ["http://localhost:3000", "http://localhost:3100", "http://127.0.0.1:3000", "http://127.0.0.1:3100"];

export const auth = betterAuth({
  appName: "BoomoTech",
  baseURL: authOrigin,
  secret: requireBetterAuthSecret(),
  trustedOrigins: [...new Set([authOrigin, siteOrigin, ...localOrigins])],
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 15,
    // The custom policy hook counts Unicode code points and enforces 128.
    // This larger UTF-16 limit permits up to 128 supplementary characters.
    maxPasswordLength: 256,
    autoSignIn: false,
    resetPasswordTokenExpiresIn: passwordResetTtlMinutes() * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, token }) => {
      try {
        await sendAccountPasswordResetEmail({ user: { email: user.email, name: user.name }, token });
      } catch (error) {
        const category = error instanceof Error && error.name.includes("Configuration") ? "configuration" : "delivery";
        console.error(`Password reset email ${category} error. Check the server-only email settings and provider status.`);
      }
    },
    password: { hash: hashPassword, verify: verifyPassword },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    autoSignInAfterVerification: true,
    expiresIn: verificationTtlMinutes() * 60,
    sendVerificationEmail: async ({ user, token }) => {
      try {
        await sendAccountVerificationEmail({ user: { id: user.id, email: user.email, name: user.name }, token });
      } catch (error) {
        const category = error instanceof Error && error.name.includes("Configuration") ? "configuration" : "delivery";
        console.error(`Authentication email ${category} error. Check the server-only email settings and provider status.`);
      }
    },
  },
  verification: { storeIdentifier: "hashed" },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: false },
  },
  databaseHooks: {
    user: {
      update: {
        after: async (updatedUser, context) => {
          if (context?.path === "/two-factor/verify-totp" && updatedUser.twoFactorEnabled === true) {
            await db.delete(sessionTable).where(eq(sessionTable.userId, updatedUser.id));
          }
        },
      },
    },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-up/email": { window: 60 * 15, max: 5 },
      "/sign-in/email": { window: 60 * 15, max: 10 },
      "/sign-in/username": { window: 60 * 15, max: 10 },
      "/send-verification-email": { window: 60 * 15, max: 3 },
      "/request-password-reset": { window: 60 * 15, max: 3 },
      "/reset-password": { window: 60 * 15, max: 5 },
    },
  },
  plugins: [
    passwordLengthProtection(),
    haveIBeenPwned({
      enabled: process.env.AUTH_EMAIL_CAPTURE_MODE !== "test",
      customPasswordCompromisedMessage: "Choose a password that has not appeared in known data breaches.",
    }),
    username({ minUsernameLength: 3, maxUsernameLength: 32 }),
    admin({ defaultRole: "user", adminRoles: ["admin"] }),
    administratorMfaEnforcement(),
    persistentLoginLockout(),
    twoFactor({
      issuer: "BoomoTech",
      twoFactorCookieMaxAge: 300,
      trustDeviceMaxAge: 1,
      accountLockout: { enabled: true, maxFailedAttempts: 5, durationSeconds: 900 },
      backupCodeOptions: { amount: 10, length: 12, storeBackupCodes: "encrypted" },
    }),
  ],
  advanced: {
    useSecureCookies: usesSecureAuthenticationCookies(),
    database: { validateSchema: true },
    ipAddress: {
      ipAddressHeaders: process.env.NODE_ENV === "production"
        ? ["cf-connecting-ip"]
        : ["x-forwarded-for", "x-real-ip"],
      disableIpTracking: false,
      ipv6Subnet: 64,
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
