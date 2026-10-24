import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CustomMDX } from "app/components/mdx";
import { JsonLd } from "app/components/json-ld";
import { WatcherBar } from "app/components/watcher-bar";
import { ReadAloud } from "app/components/read-aloud";
import { ReadingSettings } from "app/components/reading-settings";
import { Atkinson_Hyperlegible, Literata } from "next/font/google";
import { formatDate, getBlogPosts } from "app/blog/utils";
import {
  getDictionary,
  localizePath,
  otherLocale,
  type Locale,
} from "app/lib/i18n";
import {
  baseOpenGraph,
  ogImageSize,
  pageAlternates,
  postImageUrl,
  postJsonLd,
} from "app/lib/seo";
import { person } from "app/lib/site";

function findPost(slug: string, locale: Locale) {
  return getBlogPosts(locale).find((post) => post.slug === slug);
}


// Reading fonts a reader can pick (see ReadingSettings): not preloaded, so
// their files only download for whoever chooses them
const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
  display: "swap",
  preload: false,
});
// The original (not "Next"): Next.js has its metrics, so the fallback shown
// while it downloads is sized to match (and the build doesn't warn)
const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-atkinson",
  display: "swap",
  preload: false,
});

export function postStaticParams(locale: Locale) {
  return getBlogPosts(locale).map((post) => ({ slug: post.slug }));
}

export function postMetadata(slug: string, locale: Locale): Metadata | undefined {
  const post = findPost(slug, locale);
  if (!post) {
    return;
  }

  const { title, publishedAt, updatedAt, summary: description } = post.metadata;
  const image = postImageUrl(post);
  const path = `/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: pageAlternates(path, locale),
    openGraph: {
      ...baseOpenGraph(locale),
      title,
      description,
      type: "article",
      publishedTime: publishedAt,
      modifiedTime: updatedAt ?? publishedAt,
      authors: [person.name],
      url: localizePath(path, locale),
      images: [
        post.metadata.image
          ? { url: image, alt: title }
          : { url: image, ...ogImageSize, alt: title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function PostPage({ slug, locale }: { slug: string; locale: Locale }) {
  const post = findPost(slug, locale);
  if (!post) {
    notFound();
  }

  const dict = getDictionary(locale);
  const { publishedAt, updatedAt } = post.metadata;
  const translated = Boolean(findPost(slug, otherLocale(locale)));

  return (
    <section className={`${literata.variable} ${atkinson.variable}`}>
      <WatcherBar />
      <JsonLd data={postJsonLd(post, locale, translated)} />
      <h1 className="title font-semibold text-2xl tracking-tighter">
        {post.metadata.title}
      </h1>
      <div className="mt-2 mb-8 flex flex-col items-start gap-3 text-sm">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {dict.post.by} <Link href={localizePath("/", locale)}>{person.name}</Link> ·{" "}
          <time dateTime={publishedAt}>
            {formatDate(publishedAt, true, locale)}
          </time>
          {updatedAt && updatedAt !== publishedAt && (
            <>
              {" "}
              · {dict.post.updated}{" "}
              <time dateTime={updatedAt}>
                {formatDate(updatedAt, false, locale)}
              </time>
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <ReadAloud title={post.metadata.title} labels={dict.post.readAloud} />
          <ReadingSettings labels={dict.post.reading} themeLabels={dict.theme} />
        </div>
      </div>
      <article className="prose post">
        <CustomMDX source={post.content} />
      </article>
    </section>
  );
}
