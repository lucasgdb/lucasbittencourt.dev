import type { Metadata } from "next";
import { BlogPosts } from "app/components/posts";
import { JsonLd } from "app/components/json-ld";
import { getSortedBlogPosts } from "app/blog/utils";
import { baseOpenGraph, blogJsonLd, pageAlternates } from "app/lib/seo";
import { site } from "app/lib/site";

export const metadata: Metadata = {
  title: "Blog",
  description: site.blogDescription,
  alternates: pageAlternates("/blog"),
  openGraph: {
    ...baseOpenGraph(),
    title: "Blog",
    description: site.blogDescription,
    url: "/blog",
  },
};

export default function Page() {
  return (
    <section>
      <JsonLd data={blogJsonLd(getSortedBlogPosts())} />
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">My Blog</h1>
      <BlogPosts />
    </section>
  );
}
