// No Next.js imports, so `node --test` can import it.

import type { Locale } from "../lib/i18n.ts";

export type CreditPack = { credits: number; bonus: number; priceBRL: number };

/** A one-time purchase that grants a lifetime license of the tool */
export type LifetimeLicense = { name: string; priceBRL: number };

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
  /** The tool's own EULA (/tool/<slug>/eula), if it has one */
  eulaUpdatedAt?: string;
  /** Prepaid credit packs sold in the tool, if any */
  creditPacks?: CreditPack[];
  /** Lifetime license sold in the tool, if any */
  lifetimeLicense?: LifetimeLicense;
  // summary: one line, without the platform (shown next to it)
  text: Record<Locale, { name: string; summary: string; platform: string }>;
};

export const tools: Tool[] = [
  {
    slug: "ai-summarizer",
    icon: "/tools/ai-summarizer/icon.svg",
    storeUrl: null,
    publishedAt: "2026-10-16",
    updatedAt: "2026-10-19",
    privacyUpdatedAt: "2026-10-19",
    creditPacks: [
      { credits: 500, bonus: 0, priceBRL: 5 },
      { credits: 1000, bonus: 100, priceBRL: 10 },
      { credits: 5000, bonus: 750, priceBRL: 50 },
      { credits: 10000, bonus: 2000, priceBRL: 100 },
    ],
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
  {
    slug: "video-downloader",
    icon: "/tools/video-downloader/icon.svg",
    storeUrl: null,
    publishedAt: "2026-10-19",
    updatedAt: "2026-10-19",
    privacyUpdatedAt: "2026-10-19",
    eulaUpdatedAt: "2026-10-19",
    lifetimeLicense: { name: "Video Downloader Premium", priceBRL: 24.9 },
    text: {
      en: {
        name: "Video Downloader",
        summary:
          "Finds the videos on a page, files and HLS or DASH streams, and downloads them inside the browser.",
        platform: "Chrome extension",
      },
      "pt-br": {
        name: "Video Downloader",
        summary:
          "Encontra os vídeos de uma página, arquivos e streams HLS ou DASH, e baixa dentro do navegador.",
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
