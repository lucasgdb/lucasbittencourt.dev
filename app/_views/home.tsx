import Link from "next/link";
import type { Metadata } from "next";
import { Feed } from "app/components/feed";
import { JsonLd } from "app/components/json-ld";
import { getDictionary, localizePath, type Locale } from "app/lib/i18n";
import { baseOpenGraph, homeJsonLd, pageAlternates } from "app/lib/seo";
import { person } from "app/lib/site";

export function homeMetadata(locale: Locale): Metadata {
  const dict = getDictionary(locale);
  const title = `${person.name} – ${dict.jobTitle}`;
  const alternates = pageAlternates("/", locale);
  return {
    title: { absolute: title },
    alternates,
    // In full: the layout's og:url is the English home page
    openGraph: {
      ...baseOpenGraph(locale),
      title,
      description: dict.siteDescription,
      url: alternates.canonical,
    },
  };
}

export function HomePage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [before, link, after] = dict.home.writing;
  const linkClass = "underline underline-offset-2";

  return (
    <section>
      <JsonLd data={homeJsonLd(locale)} />
      {/* The role in the heading tells this Lucas Bittencourt apart from
          others with the same name */}
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">
        {person.name}
        <span className="sr-only"> – </span>
        <span className="block text-lg font-normal tracking-tight text-neutral-600 dark:text-neutral-400">
          {dict.jobTitle}
        </span>
      </h1>
      <p className="mb-4">{dict.home.intro}</p>
      <p className="mb-4">
        {before}
        <Link href={localizePath("/blog", locale)} className={linkClass}>
          {link}
        </Link>
        {after}
      </p>
      <div className="my-8">
        <Feed locale={locale} />
      </div>
    </section>
  );
}
