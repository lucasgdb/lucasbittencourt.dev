import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // With one root layout per language, only global-not-found renders 404s
    globalNotFound: true,
  },
  // Read from disk at request time
  outputFileTracingIncludes: {
    "/api/mcp": ["./app/blog/posts/**/*.mdx"],
  },
};

export default nextConfig;
