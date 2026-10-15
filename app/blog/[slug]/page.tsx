import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CustomMDX } from "app/components/mdx";
import { JsonLd } from "app/components/json-ld";
import { WatcherBar } from "app/components/watcher-bar";
import { formatDate, getBlogPosts } from "app/blog/utils";
import {
  baseOpenGraph,
  ogImageSize,
  pageAlternates,
  postImageUrl,
  postJsonLd,
} from "app/lib/seo";
import { person } from "app/lib/site";

// Only the posts generated at build time exist; anything else is a 404.
export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = getBlogPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

type BlogProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: BlogProps): Promise<Metadata | undefined> {
  const { slug } = await params;

  const post = getBlogPosts().find((post) => post.slug === slug);
  if (!post) {
    return;
  }

  const { title, publishedAt, updatedAt, summary: description } = post.metadata;
  const image = postImageUrl(post);
  const path = `/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: pageAlternates(path),
    openGraph: {
      ...baseOpenGraph(),
      title,
      description,
      type: "article",
      publishedTime: publishedAt,
      modifiedTime: updatedAt ?? publishedAt,
      authors: [person.name],
      url: path,
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

export default async function Blog({ params }: BlogProps) {
  const { slug } = await params;

  const post = getBlogPosts().find((post) => post.slug === slug);
  if (!post) {
    return notFound();
  }

  const { publishedAt, updatedAt } = post.metadata;

  return (
    <section>
      <WatcherBar />
      <JsonLd data={postJsonLd(post)} />
      <h1 className="title font-semibold text-2xl tracking-tighter">
        {post.metadata.title}
      </h1>
      <div className="flex justify-between items-center mt-2 mb-8 text-sm">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          By <Link href="/">{person.name}</Link> ·{" "}
          <time dateTime={publishedAt}>{formatDate(publishedAt, true)}</time>
          {updatedAt && updatedAt !== publishedAt && (
            <>
              {" "}
              · Updated{" "}
              <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
            </>
          )}
        </p>
      </div>
      <article className="prose">
        <CustomMDX source={post.content} />
      </article>
    </section>
  );
}
