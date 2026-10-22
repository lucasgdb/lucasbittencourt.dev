// The survey that opens after AI Summarizer is uninstalled. Answers go to
// ai-summarizer-api. No Next.js imports, so `node --test` can import it.

import { defineSurvey, surveyApiUrl } from "../uninstall-survey.ts";

export const aiSummarizerSurvey = defineSurvey({
  // Inlined at build time, as every NEXT_PUBLIC_ variable
  apiUrl: surveyApiUrl(
    process.env.NEXT_PUBLIC_AI_SUMMARIZER_API_URL,
    "http://localhost:8080",
    "https://ai-summarizer-api-production.up.railway.app",
  ),
  reasons: [
    "poor_summaries",
    "too_expensive",
    "slow_or_unreliable",
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
      title: "Why are you uninstalling AI Summarizer?",
      description: "Your feedback helps us improve. This short survey is optional.",
      reasonLegend: "What made you uninstall AI Summarizer?",
      reasons: {
        poor_summaries: "The summaries weren't accurate or useful enough.",
        too_expensive: "Credits were too expensive.",
        slow_or_unreliable: "It was too slow or unreliable.",
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
        "Optional. Describe the problem or the feature you missed. Please don't include personal data, passwords, private links or the content you summarized.",
      againLegend: "Would you consider using AI Summarizer again?",
      successBody: "Your feedback helps us make AI Summarizer better.",
      metaTitle: "Uninstall AI Summarizer: feedback",
    },
    "pt-br": {
      title: "Por que você está desinstalando o AI Summarizer?",
      description: "Sua opinião nos ajuda a melhorar. Esta pesquisa curta é opcional.",
      reasonLegend: "O que fez você desinstalar o AI Summarizer?",
      reasons: {
        poor_summaries: "Os resumos não eram precisos ou úteis o suficiente.",
        too_expensive: "Os créditos eram caros demais.",
        slow_or_unreliable: "Era lento demais ou instável.",
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
        "Opcional. Descreva o problema ou a funcionalidade que faltou. Não inclua dados pessoais, senhas, links privados ou o conteúdo que você resumiu.",
      againLegend: "Você usaria o AI Summarizer de novo?",
      successBody: "Sua opinião nos ajuda a deixar o AI Summarizer melhor.",
      metaTitle: "Desinstalar o AI Summarizer: sua opinião",
    },
  },
});
