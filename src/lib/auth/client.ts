"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, twoFactorClient, usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [usernameClient(), adminClient(), twoFactorClient({ twoFactorPage: "/admin/mfa" })],
});
