import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These routes read files from disk at request time, so the files must be
  // bundled with their serverless functions.
  outputFileTracingIncludes: {
    "/api/mcp": ["./app/blog/posts/**/*.mdx"],
    "/og": ["./app/og/fonts/*.ttf", "./public/logo.png"],
  },
};

export default nextConfig;
