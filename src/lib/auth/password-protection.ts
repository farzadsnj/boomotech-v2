import { APIError, createAuthMiddleware } from "better-auth/api";
import { passwordCodePointLength } from "./password-policy";

const PASSWORD_PATHS = new Set([
  "/sign-up/email",
  "/change-password",
  "/reset-password",
  "/admin/create-user",
  "/admin/set-user-password",
]);

function passwordFromBody(path: string, body: Record<string, unknown>) {
  return path === "/sign-up/email" || path === "/admin/create-user" ? body.password : body.newPassword;
}

export function passwordLengthProtection() {
  return {
    id: "boomotech-password-length-protection",
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
        }),
      }],
    },
  };
}
