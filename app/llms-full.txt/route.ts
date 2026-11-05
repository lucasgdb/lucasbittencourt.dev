import { getSortedBlogPosts } from "app/blog/utils";
import { buildLlmsFullTxt } from "app/lib/seo";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsFullTxt(getSortedBlogPosts("en")), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
