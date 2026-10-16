// No Next.js imports, so `node --test` can import it.

import type { Locale } from "../lib/i18n.ts";

export type Tool = {
  slug: string;
  /** Square icon, under /public */
  icon: string;
  /** Where it's installed from; null until it's published there */
  storeUrl: string | null;
  publishedAt: string;
  updatedAt: string;
  /** The tool's own privacy policy (/tool/<slug>/privacy) */
  privacyUpdatedAt: string;
  // summary: one line, without the platform (shown next to it)
  text: Record<Locale, { name: string; summary: string; platform: string }>;
};

export const tools: Tool[] = [
  {
    slug: "ai-summarizer",
    icon: "/tools/ai-summarizer/icon.png",
    storeUrl: null,
    publishedAt: "2026-10-16",
    updatedAt: "2026-10-16",
    privacyUpdatedAt: "2026-10-16",
    text: {
      en: {
        name: "AI Summarizer",
        summary:
          "Summarizes, with AI, only the part of a page or PDF you pick.",
        platform: "Chrome extension",
      },
      "pt-br": {
        name: "AI Summarizer",
        summary:
          "Resume com IA só o trecho da página ou do PDF que você escolhe.",
        platform: "Extensão para o Chrome",
      },
    },
  },
];

export function getTools() {
  return tools;
}

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}
