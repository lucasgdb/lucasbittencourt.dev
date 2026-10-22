import type { Metadata } from "next";
import { UninstallSurvey } from "app/components/uninstall-form";
import type { Locale } from "app/lib/i18n";
import { baseOpenGraph, pageAlternates } from "app/lib/seo";
import { uninstallSurveys } from "app/tools/uninstall-surveys";

// --- /tool/<slug>/uninstall -------------------------------------------------

export function uninstallStaticParams() {
  return Object.keys(uninstallSurveys).map((slug) => ({ slug }));
}

const uninstallPath = (slug: string) => `/tool/${slug}/uninstall`;

export function uninstallMetadata(slug: string, locale: Locale): Metadata | undefined {
  const survey = uninstallSurveys[slug];
  if (!survey) {
    return;
  }
  const text = survey.text[locale];
  const alternates = pageAlternates(uninstallPath(slug), locale);
  return {
    title: text.metaTitle,
    description: text.description,
    alternates,
    // Reached from the browser after an uninstall, not from search
    robots: { index: false, follow: true },
    openGraph: {
      ...baseOpenGraph(locale),
      title: text.metaTitle,
      description: text.description,
      url: alternates.canonical,
    },
  };
}

export function UninstallPage({ slug, locale }: { slug: string; locale: Locale }) {
  const text = uninstallSurveys[slug].text[locale];
  return (
    <section>
      <h1 className="title font-semibold text-2xl tracking-tighter">{text.title}</h1>
      <p className="mt-2 mb-10 text-neutral-600 dark:text-neutral-400">{text.description}</p>
      <UninstallSurvey slug={slug} locale={locale} />
    </section>
  );
}
