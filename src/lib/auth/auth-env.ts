const AUTH_SECRET_MINIMUM_LENGTH = 32;

export function requireBetterAuthSecret(environment: Record<string, string | undefined> = process.env) {
  const secret = environment.BETTER_AUTH_SECRET?.trim();
  if (!secret || secret.length < AUTH_SECRET_MINIMUM_LENGTH) {
    throw new Error("Authentication configuration error: set BETTER_AUTH_SECRET to a private value of at least 32 characters before building or starting the application.");
  }
  return secret;
}
