import type { NextConfig } from "next";

const noStoreHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
];

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  serverExternalPackages: ["@electric-sql/pglite"],
  async redirects() {
    return [
      { source: "/it-support-helpdesk/", destination: "/services/it-support", permanent: true },
      { source: "/services/social-media-development/", destination: "/services/digital-presence", permanent: true },
      { source: "/services/digital-marketing/", destination: "/services/digital-presence", permanent: true },
      { source: "/services/ui-ux-branding-identity/", destination: "/services/ui-ux-branding", permanent: true },
    ];
  },
  async headers() {
    const scriptSources = ["'self'", "'unsafe-inline'", ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : [])];
    const contentSecurityPolicy = [
      "default-src 'self'",
      `script-src ${scriptSources.join(" ")}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");
    const sensitiveSources = [
      "/api/:path*",
      "/dashboard/:path*",
      "/admin/:path*",
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/check-email",
      "/email-verification-result",
      "/verify-email",
    ];
    const globalSecurityHeaders = [
      { key: "Content-Security-Policy", value: contentSecurityPolicy },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      ...(process.env.NODE_ENV === "production"
        ? [{ key: "Strict-Transport-Security", value: "max-age=86400" }]
        : []),
    ];
    return [
      {
        source: "/(.*)",
        headers: globalSecurityHeaders,
      },
      ...sensitiveSources.map((source) => ({ source, headers: noStoreHeaders })),
    ];
  },
};

export default nextConfig;
