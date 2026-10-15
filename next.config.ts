import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The MCP route reads the posts from disk at request time, so they must be
  // bundled with its serverless function.
  outputFileTracingIncludes: {
    "/api/mcp": ["./app/blog/posts/**/*.mdx"],
  },
};

export default nextConfig;
