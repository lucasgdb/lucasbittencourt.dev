import type { NextConfig } from "next";

// Safe on a static site: none of them touch scripts or styles. A full
// Content-Security-Policy (script-src) would need per-request nonces, which
// would turn every prerendered page dynamic.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    // With one root layout per language, only global-not-found renders 404s
    globalNotFound: true,
    // Keep Next.js on the latest security patch
    agentUpgrade: "security",
  },
  // Read from disk at request time
  outputFileTracingIncludes: {
    "/api/mcp": ["./app/blog/posts/**/*.mdx"],
  },
  // No redirect from /pt-BR to /pt-br: Next.js matches redirect sources
  // case-insensitively, so it would also match /pt-br and loop
  headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
