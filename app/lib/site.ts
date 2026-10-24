export const baseUrl = "https://lucasbittencourt.dev";

export const mcpPath = "/api/mcp";
export const mcpEndpoint = `${baseUrl}${mcpPath}`;

// Update when app/mcp/content*.mdx changes
export const mcpUpdatedAt = "2026-10-15";

export const site = {
  name: "lucasbittencourt.dev",
};

export const business = {
  legalName: "Lucas Genesses Dias Bittencourt",
  cnpj: "42.564.890/0001-04",
  address:
    "Rua Expedicionário Benedito Vitoriano Siqueira, 44, Jardim do Vale, Guaratinguetá/SP, CEP 12519-370",
  email: "lucasgdbittencourt@gmail.com",
  whatsapp: "+55 (12) 98834-4336",
  whatsappUrl: "https://wa.me/5512988344336",
};

// Update when app/services/*.mdx changes
export const servicesUpdatedAt = "2026-10-19";

// Update when app/legal/<doc>.*.mdx changes (each document has its own date)
export const legalUpdatedAt = { terms: "2026-10-24", privacy: "2026-10-19" };

export const person = {
  name: "Lucas Bittencourt",
  jobTitle: "AI Software Engineer",
  expertise: [
    "Artificial intelligence",
    "AI agents",
    "Model Context Protocol",
    "Software engineering",
  ],
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
