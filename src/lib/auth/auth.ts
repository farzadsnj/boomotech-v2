import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, username } from "better-auth/plugins";
import { db } from "@/db";
import { authSchema } from "@/db/schema";
import { getSiteUrl } from "@/lib/site-url";
import { sendAccountVerificationEmail } from "@/features/email-verification/send";
import { verificationTtlMinutes } from "@/features/email-verification/grants";
import { hashPassword, verifyPassword } from "./password";
import { requireBetterAuthSecret } from "./auth-env";

const siteOrigin = getSiteUrl().origin;
const localOrigins = process.env.NODE_ENV === "production"
  ? []
  : ["http://localhost:3000", "http://localhost:3100", "http://127.0.0.1:3000", "http://127.0.0.1:3100"];

export const auth = betterAuth({
  appName: "BoomoTech",
  baseURL: process.env.BETTER_AUTH_URL ?? siteOrigin,
  secret: requireBetterAuthSecret(),
  trustedOrigins: [...new Set([siteOrigin, ...localOrigins])],
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    autoSignIn: false,
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
    },
  },
  plugins: [
    username({ minUsernameLength: 3, maxUsernameLength: 32 }),
    admin({ defaultRole: "user", adminRoles: ["admin"] }),
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    database: { validateSchema: true },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
