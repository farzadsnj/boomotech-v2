const AUTH_SECRET_MINIMUM_LENGTH = 32;
const LOCAL_AUTH_URL = "http://localhost:3000";

export function requireBetterAuthSecret(environment: Record<string, string | undefined> = process.env) {
  const secret = environment.BETTER_AUTH_SECRET?.trim();
  if (!secret || secret.length < AUTH_SECRET_MINIMUM_LENGTH) {
    throw new Error("Authentication configuration error: set BETTER_AUTH_SECRET to a private value of at least 32 characters before building or starting the application.");
  }
  return secret;
}

export function getBetterAuthUrl(environment: Record<string, string | undefined> = process.env) {
  const configured = environment.BETTER_AUTH_URL?.trim();
  if (!configured) {
    if (environment.NODE_ENV === "production") {
      throw new Error("Authentication configuration error: set BETTER_AUTH_URL to the public HTTPS origin before building or starting production.");
    }
    return new URL(LOCAL_AUTH_URL);
  }

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error("Authentication configuration error: BETTER_AUTH_URL must be a valid absolute URL.");
  }
  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    throw new Error("Authentication configuration error: BETTER_AUTH_URL must contain only the application origin.");
  }
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error("Authentication configuration error: BETTER_AUTH_URL must use HTTPS outside local development.");
  }
  if (environment.NODE_ENV === "production" && environment.SITE_URL?.trim()) {
    try {
      const siteOrigin = new URL(environment.SITE_URL).origin;
      if (siteOrigin === "https://boomotech.com.au" && url.origin !== siteOrigin) {
        throw new Error("Authentication configuration error: BETTER_AUTH_URL must match the production SITE_URL origin.");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("must match")) throw error;
    }
  }
  return new URL(url.origin);
}
