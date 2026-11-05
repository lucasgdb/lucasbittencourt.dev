import type { Metadata } from "next";
import { BlogPosts } from "app/components/posts";
import { JsonLd } from "app/components/json-ld";
import { getSortedBlogPosts } from "app/blog/utils";
import { getDictionary, type Locale } from "app/lib/i18n";
import { baseOpenGraph, blogJsonLd, pageAlternates } from "app/lib/seo";

export function blogIndexMetadata(locale: Locale): Metadata {
  const dict = getDictionary(locale);
  return {
    title: dict.blog.title,
    description: dict.blogDescription,
    alternates: pageAlternates("/blog", locale),
    openGraph: {
      ...baseOpenGraph(locale),
      title: dict.blog.title,
      description: dict.blogDescription,
      url: pageAlternates("/blog", locale).canonical,
    },
  };
}

export function BlogIndexPage({ locale }: { locale: Locale }) {
  return (
    <section>
      <JsonLd data={blogJsonLd(getSortedBlogPosts(locale), locale)} />
      <h1 className="font-semibold text-2xl mb-4 tracking-tighter">
        {getDictionary(locale).blog.heading}
      </h1>
      <p className="mb-8 text-neutral-600 dark:text-neutral-400">
        {getDictionary(locale).blogDescription}
      </p>
      <BlogPosts locale={locale} />
    </section>
  );
}
