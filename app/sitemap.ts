import { getSortedBlogPosts } from "app/blog/utils";
import { buildSitemap } from "app/lib/seo";

export default function sitemap() {
  return buildSitemap({
    en: getSortedBlogPosts("en"),
    "pt-br": getSortedBlogPosts("pt-br"),
  });
}
