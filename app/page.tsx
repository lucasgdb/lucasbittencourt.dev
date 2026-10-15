import Link from "next/link";
import type { Metadata } from "next";
import { BlogPosts } from "app/components/posts";
import { JsonLd } from "app/components/json-ld";
import { homeJsonLd, pageAlternates } from "app/lib/seo";
import { person } from "app/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${person.name} – ${person.jobTitle}` },
  alternates: pageAlternates("/"),
};

function formatList(items: string[]) {
  return new Intl.ListFormat("en", { type: "conjunction" }).format(items);
}

export default function Page() {
  return (
    <section>
      <JsonLd data={homeJsonLd()} />
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">
        {person.name}
      </h1>
      <p className="mb-4">
        {person.jobTitle} currently working with{" "}
        {formatList(person.technologies)}. Developing scalable and robust
        solutions.
      </p>
      <p className="mb-4">
        I write about JavaScript, React, Node.js and software engineering
        fundamentals on{" "}
        <Link href="/blog" className="underline underline-offset-2">
          my blog
        </Link>
        .
      </p>
      <div className="my-8">
        <BlogPosts />
      </div>
    </section>
  );
}
