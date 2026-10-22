// What every uninstall survey shares (/tool/<slug>/uninstall): the stable
// values its API stores (never the translated labels), the Zod schemas the
// form validates with, and the texts that don't name the tool. Each tool
// gives its endpoint, reasons and own texts with defineSurvey.
// No Next.js imports, so `node --test` can import it.

import * as z from "zod/v4";
import type { Locale } from "../lib/i18n.ts";

export const wouldUseAgainValues = ["yes", "maybe", "no"] as const;

export type WouldUseAgain = (typeof wouldUseAgainValues)[number];

export const ratings = [1, 2, 3, 4, 5] as const;

export const maxCommentLength = 1000;

/** What the uninstall URL may carry (set by the extension): never an id */
const versionPattern = /^[0-9]{1,5}(\.[0-9]{1,5}){0,3}$/;
const browsers = ["chrome", "edge"] as const;

/** The form's own state: nothing chosen yet is "" or null */
export type FeedbackForm = {
  reason: string;
  comment: string;
  rating: number | null;
  wouldUseAgain: WouldUseAgain | "";
};

export const emptyForm: FeedbackForm = {
  reason: "",
  comment: "",
  rating: null,
  wouldUseAgain: "",
};

/** The texts that name the tool or its reasons */
type ToolText<Reason extends string> = {
  title: string;
  description: string;
  reasonLegend: string;
  reasons: Record<Reason, string>;
  commentLabel: string;
  commentHint: string;
  againLegend: string;
  successBody: string;
  metaTitle: string;
};

const commonText = {
  en: {
    ratingLegend: "How was your experience?",
    ratingLabels: ["Very poor", "Poor", "Okay", "Good", "Excellent"],
    ratingAria: (value: number, label: string) => `${value} of 5, ${label}`,
    again: { yes: "Yes", maybe: "Maybe", no: "No" },
    optional: "Optional",
    clear: "Clear",
    submit: "Send feedback",
    sending: "Sending…",
    errors: {
      reason: "Choose a reason.",
      comment: `Use up to ${maxCommentLength.toLocaleString("en-US")} characters.`,
      send: "We couldn't send your feedback. Your answers are still here: try again.",
    },
    successTitle: "Thank you for your feedback!",
    otherTools: "Explore our other tools →",
  },
  "pt-br": {
    ratingLegend: "Como foi sua experiência?",
    ratingLabels: ["Muito ruim", "Ruim", "Razoável", "Boa", "Excelente"],
    ratingAria: (value: number, label: string) => `${value} de 5, ${label}`,
    again: { yes: "Sim", maybe: "Talvez", no: "Não" },
    optional: "Opcional",
    clear: "Limpar",
    submit: "Enviar opinião",
    sending: "Enviando…",
    errors: {
      reason: "Escolha um motivo.",
      comment: `Use até ${maxCommentLength.toLocaleString("pt-BR")} caracteres.`,
      send: "Não foi possível enviar sua opinião. Suas respostas continuam aqui: tente de novo.",
    },
    successTitle: "Obrigado pela sua opinião!",
    otherTools: "Conheça nossas outras ferramentas →",
  },
} as const satisfies Record<Locale, unknown>;

export type SurveyText = ToolText<string> & (typeof commonText)[Locale];

/**
 * One tool's survey. `apiUrl` is where its API runs (answers go to its
 * public POST /feedback/uninstall, which must list this site's origin in
 * its CORS_ALLOWED_ORIGINS); `reasons` are in the order shown
 */
export function defineSurvey<const Reason extends string>(config: {
  apiUrl: string;
  reasons: readonly [Reason, ...Reason[]];
  text: Record<Locale, ToolText<Reason>>;
}) {
  const { reasons } = config;

  /**
   * The body the API accepts (it validates again): unknown properties are
   * rejected, empty answers are left out
   */
  const payloadSchema = z.strictObject({
    reason: z.enum(reasons),
    comment: z.string().trim().min(1).max(maxCommentLength).optional(),
    rating: z.int().min(1).max(5).optional(),
    would_use_again: z.enum(wouldUseAgainValues).optional(),
    locale: z.enum(["en", "pt-br"]).optional(),
    browser: z.enum(browsers).optional(),
    extension_version: z.string().regex(versionPattern).optional(),
  });

  const text: Record<Locale, SurveyText> = {
    en: { ...commonText.en, ...config.text.en },
    "pt-br": { ...commonText["pt-br"], ...config.text["pt-br"] },
  };

  return {
    feedbackEndpoint: `${config.apiUrl.replace(/\/+$/, "")}/feedback/uninstall`,
    reasons: reasons as readonly string[],
    text,
    payloadSchema,

    /** The form's rules, with the messages shown under each field */
    formSchema(locale: Locale) {
      const errors = text[locale].errors;
      return z.object({
        reason: z.enum(reasons, { error: errors.reason }),
        comment: z.string().max(maxCommentLength, { error: errors.comment }),
        rating: z.int().min(1).max(5).nullable(),
        wouldUseAgain: z.enum([...wouldUseAgainValues, ""]),
      });
    },

    /**
     * The body to send: the answers, the page's language, and what the
     * extension put in the URL (?v=0.1.0&browser=chrome) when it's well
     * formed. Anything else in the URL is ignored
     */
    toPayload(form: FeedbackForm, locale: Locale, search: string) {
      const params = new URLSearchParams(search);
      const version = params.get("v") ?? "";
      const browser = params.get("browser") ?? "";
      const comment = form.comment.trim();
      return payloadSchema.parse({
        reason: form.reason,
        comment: comment || undefined,
        rating: form.rating ?? undefined,
        would_use_again: form.wouldUseAgain || undefined,
        locale,
        browser: (browsers as readonly string[]).includes(browser) ? browser : undefined,
        extension_version: versionPattern.test(version) ? version : undefined,
      });
    },
  };
}

export type Survey = ReturnType<typeof defineSurvey>;

/** The local API under `next dev`, the real one in a build */
export function surveyApiUrl(configured: string | undefined, local: string, production: string) {
  return configured || (process.env.NODE_ENV === "development" ? local : production);
}
