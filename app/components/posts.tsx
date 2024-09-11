import Link from "next/link";
import { formatDate, getBlogPosts } from "app/blog/utils";
import { Fragment } from "react";

export function BlogPosts() {
  let allBlogs = getBlogPosts();

  return (
    <div className="grid grid-cols-[auto_1fr] gap-3">
      {allBlogs
        .sort((a, b) => {
          if (
            new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)
          ) {
            return -1;
          }
          return 1;
        })
        .map((post) => (
          <Fragment key={post.slug}>
            <Link
              className="flex flex-col space-y-1 mb-4"
              href={`/blog/${post.slug}`}
            >
              <p className="text-neutral-600 dark:text-neutral-400 tabular-nums">
                {formatDate(post.metadata.publishedAt, false)}
              </p>
            </Link>

            <Link
              key={post.slug}
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
