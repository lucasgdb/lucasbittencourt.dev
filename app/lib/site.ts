export const baseUrl = "https://lucasbittencourt.dev";

export const mcpPath = "/api/mcp";
export const mcpEndpoint = `${baseUrl}${mcpPath}`;

// Update when app/mcp/content*.mdx changes
export const mcpUpdatedAt = "2026-10-15";

export const site = {
  name: "lucasbittencourt.dev",
};

export const person = {
  name: "Lucas Bittencourt",
  jobTitle: "Full-stack Software Engineer",
  technologies: ["React.js", "Node.js", "PostgreSQL", "Docker", "TypeScript"],
  profiles: {
    github: "https://github.com/lucasgdb",
    linkedin: "https://linkedin.com/in/lucas-bittencourt",
  },
  sourceCode: "https://github.com/lucasgdb/lucasbittencourt.dev",
};

// AI training crawlers (GPTBot, Google-Extended, ...). See docs/SEO.md.
export const allowAiTraining = true;

export function isIndexable(vercelEnv = process.env.VERCEL_ENV) {
  return !vercelEnv || vercelEnv === "production";
}
