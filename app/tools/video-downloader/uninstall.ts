// The survey that opens after Video Downloader is uninstalled. Answers go to
// video-downloader-api. No Next.js imports, so `node --test` can import it.

import { defineSurvey, surveyApiUrl } from "../uninstall-survey.ts";

export const videoDownloaderSurvey = defineSurvey({
  // Inlined at build time, as every NEXT_PUBLIC_ variable
  apiUrl: surveyApiUrl(
    process.env.NEXT_PUBLIC_VIDEO_DOWNLOADER_API_URL,
    "http://localhost:8082",
    "https://video-downloader-api.lucasbittencourt.dev",
  ),
  reasons: [
    "download_failed",
    "slow_or_unreliable",
    "quality_issues",
    "difficult_to_use",
    "missing_feature",
    "privacy_concerns",
    "alternative_found",
    "no_longer_needed",
    "bug_or_error",
    "other",
  ],
  text: {
    en: {
      title: "Why are you uninstalling Video Downloader?",
      description: "Your feedback helps us improve. This short survey is optional.",
      reasonLegend: "What made you uninstall Video Downloader?",
      reasons: {
        download_failed: "I couldn't download the video I wanted.",
        slow_or_unreliable: "Downloads were too slow or unreliable.",
        quality_issues: "The video or audio quality wasn't good enough.",
        difficult_to_use: "The extension was difficult to use.",
        missing_feature: "A feature I needed was missing.",
        privacy_concerns: "I had privacy or security concerns.",
        alternative_found: "I found a better alternative.",
        no_longer_needed: "I no longer need the extension.",
        bug_or_error: "I experienced a bug or error.",
        other: "Other.",
      },
      commentLabel: "What went wrong?",
      commentHint:
        "Optional. Describe the problem or the feature you missed. Please don't include personal data, passwords or private links.",
      againLegend: "Would you consider using Video Downloader again?",
      successBody: "Your feedback helps us make Video Downloader better.",
      metaTitle: "Uninstall Video Downloader: feedback",
    },
    "pt-br": {
      title: "Por que você está desinstalando o Video Downloader?",
      description: "Sua opinião nos ajuda a melhorar. Esta pesquisa curta é opcional.",
      reasonLegend: "O que fez você desinstalar o Video Downloader?",
      reasons: {
        download_failed: "Não consegui baixar o vídeo que eu queria.",
        slow_or_unreliable: "Os downloads eram lentos demais ou instáveis.",
        quality_issues: "A qualidade do vídeo ou do áudio não era boa o suficiente.",
        difficult_to_use: "A extensão era difícil de usar.",
        missing_feature: "Faltava uma funcionalidade de que eu precisava.",
        privacy_concerns: "Tive preocupações com privacidade ou segurança.",
        alternative_found: "Encontrei uma alternativa melhor.",
        no_longer_needed: "Não preciso mais da extensão.",
        bug_or_error: "Encontrei um bug ou erro.",
        other: "Outro.",
      },
      commentLabel: "O que deu errado?",
      commentHint:
        "Opcional. Descreva o problema ou a funcionalidade que faltou. Não inclua dados pessoais, senhas ou links privados.",
      againLegend: "Você usaria o Video Downloader de novo?",
      successBody: "Sua opinião nos ajuda a deixar o Video Downloader melhor.",
      metaTitle: "Desinstalar o Video Downloader: sua opinião",
    },
  },
});
