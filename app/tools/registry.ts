// No Next.js imports, so `node --test` can import it.

import type { Locale } from "../lib/i18n.ts";

export type CreditPack = { credits: number; bonus: number; priceBRL: number };

/** One browser family's file of a manual build, under /public */
export type BuildFile = { file: string; bytes: number; sha256: string };

/** A version to install by hand while the tool isn't in a store: the
 * production build, one file for Chromium browsers (Chrome, Edge, Brave,
 * Opera, Vivaldi…) and one for Firefox */
export type ManualBuild = {
  version: string;
  releasedAt: string;
  files: { chromium: BuildFile; firefox?: BuildFile };
};

/** A one-time purchase that grants a lifetime license of the tool */
export type LifetimeLicense = { name: string; priceBRL: number };

export type Tool = {
  slug: string;
  /** Square icon, under /public */
  icon: string;
  /** Where it's installed from; null until it's published there */
  storeUrl: string | null;
  /** Until then, the build to install by hand, if there is one */
  manualBuild?: ManualBuild;
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
    manualBuild: {
      version: "0.1.0",
      releasedAt: "2026-10-24",
      files: {
        chromium: {
          file: "/tools/ai-summarizer/ai-summarizer-0.1.0-chromium.zip",
          bytes: 2331413,
          sha256: "02e06558fba97f96d1e32dd18be26ef5e3ec2ad91737a3243b2fca0c69b12113",
        },
        firefox: {
          file: "/tools/ai-summarizer/ai-summarizer-0.1.0-firefox.zip",
          bytes: 2331169,
          sha256: "0024bc17dae74168031a252927a2eb67a2ec3980d7e835b6d20a350bc214789f",
        },
      },
    },
    publishedAt: "2026-10-16",
    updatedAt: "2026-10-24",
    privacyUpdatedAt: "2026-10-24",
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
          "Summarizes, with AI, only the part of a page or PDF you pick, reads it aloud or turns it into a video, and fills in forms.",
        platform: "Browser extension",
      },
      "pt-br": {
        name: "AI Summarizer",
        summary:
          "Resume com IA só o trecho da página ou do PDF que você escolhe, lê o resumo em voz alta ou o transforma em vídeo e preenche formulários.",
        platform: "Extensão para navegadores",
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
