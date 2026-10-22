// The tools whose extension opens a survey when uninstalled, by slug
// (/tool/<slug>/uninstall). A plain module: the client form imports it too.

import { aiSummarizerSurvey } from "./ai-summarizer/uninstall.ts";
import type { Survey } from "./uninstall-survey.ts";
import { videoDownloaderSurvey } from "./video-downloader/uninstall.ts";

export const uninstallSurveys: Record<string, Survey> = {
  "video-downloader": videoDownloaderSurvey,
  "ai-summarizer": aiSummarizerSurvey,
};
