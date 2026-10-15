import Link from "next/link";
import { formatDate, getSortedBlogPosts } from "app/blog/utils";
import { Fragment } from "react";

export function BlogPosts() {
  const allBlogs = getSortedBlogPosts();

  return (
    <div className="grid grid-cols-[auto_1fr] gap-3">
      {allBlogs.map((post) => (
        <Fragment key={post.slug}>
          <div className="flex flex-col space-y-1 mb-4">
            <time
              dateTime={post.metadata.publishedAt}
              className="text-neutral-600 dark:text-neutral-400 tabular-nums"
            >
              {formatDate(post.metadata.publishedAt, false)}
            </time>
          </div>

          <Link
            className="flex flex-col space-y-1 mb-4"
            href={`/blog/${post.slug}`}
          >
            <p className="text-neutral-900 dark:text-neutral-100 tracking-tight">
              {post.metadata.title}
            </p>
          </Link>
        </Fragment>
      ))}
    </div>
  );
}
