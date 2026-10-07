import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

const originalNodeEnv = process.env.NODE_ENV;

function setNodeEnv(value: string) {
  Object.defineProperty(process.env, "NODE_ENV", { configurable: true, enumerable: true, writable: true, value });
}

async function configuredHeaders() {
  if (typeof nextConfig.headers !== "function") throw new Error("Next.js headers are not configured.");
  return nextConfig.headers();
}

describe("production security configuration", () => {
  afterEach(() => setNodeEnv(originalNodeEnv ?? "test"));

  it("binds the production Next.js process to loopback on port 3000", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { scripts: { start: string } };
    expect(packageJson.scripts.start).toBe("next start --hostname 127.0.0.1 --port 3000");
  });

  it("adds conservative HSTS only in production", async () => {
    setNodeEnv("development");
    const development = await configuredHeaders();
    expect(development[0].headers).not.toContainEqual(expect.objectContaining({ key: "Strict-Transport-Security" }));

    setNodeEnv("production");
    const production = await configuredHeaders();
    expect(production[0].headers).toContainEqual({ key: "Strict-Transport-Security", value: "max-age=86400" });
  });

  it("preserves CSP and sensitive no-store headers", async () => {
    setNodeEnv("production");
    const rules = await configuredHeaders();
    expect(rules[0].headers).toContainEqual(expect.objectContaining({ key: "Content-Security-Policy" }));
    const dashboard = rules.find((rule) => rule.source === "/dashboard/:path*");
    expect(dashboard?.headers).toContainEqual({ key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" });
  });
});
