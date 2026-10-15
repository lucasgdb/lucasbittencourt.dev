import { getSortedBlogPosts } from "app/blog/utils";
import { buildLlmsTxt } from "app/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const text = buildLlmsTxt({
    en: getSortedBlogPosts("en"),
    "pt-br": getSortedBlogPosts("pt-br"),
  });
  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
