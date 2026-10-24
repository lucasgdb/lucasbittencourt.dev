import Link from "next/link";
import { Fragment } from "react";
import { formatDate, getSortedBlogPosts } from "app/blog/utils";
import { getDictionary, localizePath, type Locale } from "app/lib/i18n";
import { getTools } from "app/tools/registry";

type Entry = { kind: "post" | "tool"; key: string; date: string; title: string; href: string };

/** Everything published on the site (posts and tools), newest first */
export function Feed({ locale }: { locale: Locale }) {
  const labels = getDictionary(locale).home.feed;
  const entries: Entry[] = [
    ...getSortedBlogPosts(locale).map((post) => ({
      kind: "post" as const,
      key: `post-${post.slug}`,
      date: post.metadata.publishedAt,
      title: post.metadata.title,
      href: localizePath(`/blog/${post.slug}`, locale),
    })),
    ...getTools().map((tool) => ({
      kind: "tool" as const,
      key: `tool-${tool.slug}`,
      date: tool.publishedAt,
      title: tool.text[locale].name,
      href: localizePath(`/tool/${tool.slug}`, locale),
    })),
  ].toSorted((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
      {entries.map((entry) => (
        <Fragment key={entry.key}>
          <time
            dateTime={entry.date}
            className="mb-4 text-neutral-600 dark:text-neutral-400 tabular-nums"
          >
            {formatDate(entry.date, false, locale)}
          </time>
          <Link className="group mb-4 flex flex-wrap items-baseline gap-x-2" href={entry.href}>
            <span className="text-neutral-900 dark:text-neutral-100 tracking-tight">
              {entry.title}
            </span>
            <span className="text-sm text-neutral-500 dark:text-neutral-500">
              {labels[entry.kind]}
            </span>
          </Link>
        </Fragment>
      ))}
    </div>
  );
}
