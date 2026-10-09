import { getBetterAuthUrl, requireBetterAuthSecret } from "../auth/auth-env";

const LOCAL_DATABASE_URL = "postgres://boomotech:boomotech@localhost:5433/boomotech";
const PRODUCTION_ORIGIN = "https://boomotech.com.au";

export class ApplicationConfigurationError extends Error {
  name = "ApplicationConfigurationError";
}

export function getDatabaseUrl(environment: Record<string, string | undefined> = process.env) {
  const configured = environment.DATABASE_URL?.trim();
  if (!configured) {
    if (environment.NODE_ENV === "production") {
      throw new ApplicationConfigurationError("Database configuration error: set DATABASE_URL before building or starting production.");
    }
    return LOCAL_DATABASE_URL;
  }
  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new ApplicationConfigurationError("Database configuration error: DATABASE_URL must be a valid PostgreSQL connection URL.");
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new ApplicationConfigurationError("Database configuration error: DATABASE_URL must use the postgres or postgresql scheme.");
  }
  return configured;
}

function requireValue(name: string, environment: Record<string, string | undefined>) {
  if (!environment[name]?.trim()) throw new ApplicationConfigurationError(`Production configuration error: set ${name}.`);
}

export function validateProductionEnvironment(environment: Record<string, string | undefined> = process.env) {
  const authUrl = getBetterAuthUrl(environment).origin;
  if (authUrl !== PRODUCTION_ORIGIN) {
    throw new ApplicationConfigurationError(`Production configuration error: BETTER_AUTH_URL must be ${PRODUCTION_ORIGIN}.`);
  }
  const siteUrl = environment.SITE_URL?.trim();
  let siteOrigin = "";
  try { siteOrigin = siteUrl ? new URL(siteUrl).origin : ""; } catch { siteOrigin = ""; }
  if (siteOrigin !== PRODUCTION_ORIGIN) {
    throw new ApplicationConfigurationError(`Production configuration error: SITE_URL must be ${PRODUCTION_ORIGIN}.`);
  }
  getDatabaseUrl({ ...environment, NODE_ENV: "production" });
  requireBetterAuthSecret(environment);
  for (const name of ["RESEND_API_KEY", "AUTH_FROM_EMAIL", "BOOKING_NOTIFICATION_EMAIL", "BOOKING_FROM_EMAIL"]) {
    requireValue(name, environment);
  }
  for (const name of ["OPENAI_CHAT_ENABLED", "SHOP_ENABLED"]) {
    const value = environment[name]?.trim().toLowerCase();
    if (value && value !== "true" && value !== "false") throw new ApplicationConfigurationError(`Production configuration error: ${name} must be true or false.`);
  }
  if (environment.OPENAI_CHAT_ENABLED?.trim().toLowerCase() === "true") requireValue("OPENAI_API_KEY", environment);
  if (environment.ADMIN_TEMP_PASSWORD?.trim()) {
    throw new ApplicationConfigurationError("Production configuration error: remove ADMIN_TEMP_PASSWORD after the administrator bootstrap completes.");
  }
  return { authUrl, siteUrl: PRODUCTION_ORIGIN };
}
