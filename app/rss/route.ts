import { getSortedBlogPosts } from "app/blog/utils";
import { buildRss } from "app/lib/seo";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildRss(getSortedBlogPosts("en"), "en"), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
