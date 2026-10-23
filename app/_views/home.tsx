import Link from "next/link";
import type { Metadata } from "next";
import { Feed } from "app/components/feed";
import { JsonLd } from "app/components/json-ld";
import { getDictionary, localizePath, type Locale } from "app/lib/i18n";
import { homeJsonLd, pageAlternates } from "app/lib/seo";
import { person } from "app/lib/site";

export function homeMetadata(locale: Locale): Metadata {
  return {
    title: { absolute: `${person.name} – ${getDictionary(locale).jobTitle}` },
    alternates: pageAlternates("/", locale),
  };
}

export function HomePage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [before, link, after] = dict.home.writing;
  const linkClass = "underline underline-offset-2";

  return (
    <section>
      <JsonLd data={homeJsonLd(locale)} />
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">
        {person.name}
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
