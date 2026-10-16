import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import { CustomMDX } from "app/components/mdx";
import { formatDate } from "app/blog/utils";
import { getDictionary, type Locale } from "app/lib/i18n";
import { baseOpenGraph, pageAlternates } from "app/lib/seo";
import { legalUpdatedAt } from "app/lib/site";

export type LegalDocument = "terms" | "privacy";

export function legalMetadata(doc: LegalDocument, locale: Locale): Metadata {
  const { title, description } = getDictionary(locale).legal[doc];
  const alternates = pageAlternates(`/${doc}`, locale);
  return {
    title,
    description,
    alternates,
    openGraph: { ...baseOpenGraph(locale), title, description, url: alternates.canonical },
  };
}

export function LegalPage({ doc, locale }: { doc: LegalDocument; locale: Locale }) {
  const dict = getDictionary(locale).legal;
  const content = fs.readFileSync(
    path.join(process.cwd(), "app", "legal", `${doc}.${locale}.mdx`),
    "utf-8"
  );

  return (
    <section>
      <h1 className="title font-semibold text-2xl tracking-tighter">
        {dict[doc].title}
      </h1>
      <p className="mt-2 mb-8 text-sm text-neutral-600 dark:text-neutral-400">
        {dict.updated}:{" "}
        <time dateTime={legalUpdatedAt[doc]}>
          {formatDate(legalUpdatedAt[doc], false, locale)}
        </time>
      </p>
      <article className="prose">
        <CustomMDX source={content} />
      </article>
    </section>
  );
}
