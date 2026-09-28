import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("stores Argon2id hashes and verifies without exposing the password", async () => {
    const password = "SecureTestPassword9";
    const passwordHash = await hashPassword(password);
    expect(passwordHash).toMatch(/^\$argon2id\$/);
    expect(passwordHash).not.toContain(password);
    await expect(verifyPassword({ hash: passwordHash, password })).resolves.toBe(true);
    await expect(verifyPassword({ hash: passwordHash, password: "IncorrectPassword9" })).resolves.toBe(false);
  });
});
