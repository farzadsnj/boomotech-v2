import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const username = process.env.ADMIN_USERNAME?.trim().toLocaleLowerCase("en-AU");
const email = process.env.ADMIN_EMAIL?.trim().toLocaleLowerCase("en-AU");
const password = process.env.ADMIN_TEMP_PASSWORD;

if (!username || !email) {
  console.error("Set ADMIN_USERNAME and ADMIN_EMAIL in the protected bootstrap environment before running this command.");
  process.exit(1);
}
if (username !== "farzadsnj") {
  console.error("ADMIN_USERNAME must match the approved initial administrator username.");
  process.exit(1);
}
if (password && (password.length < 16 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password))) {
  console.error("ADMIN_TEMP_PASSWORD must contain at least 16 characters with uppercase and lowercase letters and a number. Replace it before public deployment.");
  process.exit(1);
}

const [{ db, closeDatabase }, { bootstrapInitialAdministrator }] = await Promise.all([
  import("../src/db/index"),
  import("../src/lib/auth/admin-bootstrap"),
]);

try {
  const result = await bootstrapInitialAdministrator(db, { username, email, password });
  if (result.status === "unnecessary") {
    console.log("Administrator bootstrap is unnecessary: the approved account already exists and was not changed.");
  } else {
    console.log("Administrator account created. Remove ADMIN_TEMP_PASSWORD from the environment now, then sign in to enrol MFA before using administrator features.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Administrator bootstrap failed safely.");
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
