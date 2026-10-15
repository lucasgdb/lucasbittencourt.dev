// Single source of truth for the site identity. Used by the visible pages,
// metadata, JSON-LD, sitemap, robots.txt, RSS and llms.txt.

export const baseUrl = "https://lucasbittencourt.dev";

export const site = {
  name: "lucasbittencourt.dev",
  locale: "en_US",
  language: "en",
  description:
    "Portfolio and blog of Lucas Bittencourt, a full-stack software engineer working with React.js, Node.js, PostgreSQL, Docker and TypeScript.",
  blogDescription:
    "Articles by Lucas Bittencourt about JavaScript, TypeScript, React, Node.js and software engineering fundamentals.",
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

// Whether AI crawlers that collect content for model training (GPTBot,
// Google-Extended, ClaudeBot, ...) may crawl the site. Search crawlers are
// always allowed. See docs/SEO.md.
export const allowAiTraining = true;

// Preview and development deployments on Vercel must never be indexed.
export function isIndexable(vercelEnv = process.env.VERCEL_ENV) {
  return !vercelEnv || vercelEnv === "production";
}
