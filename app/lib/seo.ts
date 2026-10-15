// Pure builders for structured data, sitemap, robots.txt, RSS and llms.txt.
// Kept free of Next.js runtime imports so they can be tested with `node --test`.

import type { MetadataRoute } from "next";
import { getLastModified as lastModified, type Post } from "../blog/utils.ts";
import { allowAiTraining, baseUrl, isIndexable, person, site } from "./site.ts";

const personId = `${baseUrl}/#person`;
const websiteId = `${baseUrl}/#website`;
const blogId = `${baseUrl}/blog#blog`;

export function postUrl(slug: string) {
  return `${baseUrl}/blog/${slug}`;
}

export function ogImageUrl(title: string) {
  return `${baseUrl}/og?title=${encodeURIComponent(title)}`;
}

// Next.js replaces (doesn't merge) `alternates` from parent layouts, so every
// page sets its canonical URL together with the RSS feed link.
export function pageAlternates(path: string) {
  return {
    canonical: path,
    types: { "application/rss+xml": `${baseUrl}/rss` },
  };
}

export const ogImageSize = { width: 1200, height: 630 };

// Next.js replaces `openGraph` from parent layouts too, so pages spread this.
export function baseOpenGraph() {
  return {
    siteName: site.name,
    locale: site.locale,
    type: "website" as const,
    images: [{ url: ogImageUrl(person.name), ...ogImageSize, alt: person.name }],
  };
}

export function postImageUrl(post: Post) {
  return post.metadata.image ?? ogImageUrl(post.metadata.title);
}

// JSON.stringify doesn't escape "<", so a value containing "</script>" could
// close the script tag. Escaping it keeps the JSON valid and the HTML safe.
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function personJsonLd() {
  return {
    "@type": "Person",
    "@id": personId,
    name: person.name,
    url: baseUrl,
    jobTitle: person.jobTitle,
    knowsAbout: person.technologies,
    sameAs: Object.values(person.profiles),
  };
}

export function websiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": websiteId,
    name: person.name,
    alternateName: site.name,
    url: baseUrl,
    description: site.description,
    inLanguage: site.language,
    author: { "@id": personId },
  };
}

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${baseUrl}/#profilepage`,
        url: baseUrl,
        name: `${person.name} – ${person.jobTitle}`,
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": personId },
        inLanguage: site.language,
      },
      personJsonLd(),
      websiteJsonLd(),
    ],
  };
}

export function blogJsonLd(posts: Post[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": blogId,
    url: `${baseUrl}/blog`,
    name: `${person.name}'s blog`,
    description: site.blogDescription,
    inLanguage: site.language,
    author: { "@id": personId },
    isPartOf: { "@id": websiteId },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      "@id": `${postUrl(post.slug)}#article`,
      headline: post.metadata.title,
      url: postUrl(post.slug),
      datePublished: post.metadata.publishedAt,
      dateModified: lastModified(post),
    })),
  };
}

export function postJsonLd(post: Post) {
  const url = postUrl(post.slug);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: post.metadata.title,
        description: post.metadata.summary,
        datePublished: post.metadata.publishedAt,
        dateModified: lastModified(post),
        url,
        mainEntityOfPage: url,
        image: postImageUrl(post),
        inLanguage: site.language,
        author: {
          "@type": "Person",
          "@id": personId,
          name: person.name,
          url: baseUrl,
        },
        publisher: { "@id": personId },
        isPartOf: { "@id": blogId },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: `${baseUrl}/blog`,
          },
          { "@type": "ListItem", position: 3, name: post.metadata.title },
        ],
      },
    ],
  };
}

export function buildSitemap(posts: Post[]): MetadataRoute.Sitemap {
  const latest = posts.map(lastModified).sort().at(-1);

  return [
    { url: baseUrl, lastModified: latest },
    { url: `${baseUrl}/blog`, lastModified: latest },
    ...posts.map((post) => ({
      url: postUrl(post.slug),
      lastModified: lastModified(post),
    })),
  ];
}

// Crawlers used to collect training data for AI models. Search and
// user-triggered fetchers (Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User,
// PerplexityBot, Claude-SearchBot, ...) are covered by the "*" group.
export const aiTrainingCrawlers = [
  "GPTBot",
  "Google-Extended",
  "ClaudeBot",
  "CCBot",
  "Applebot-Extended",
];

export function buildRobots(
  vercelEnv?: string,
  allowTraining = allowAiTraining
): MetadataRoute.Robots {
  if (!isIndexable(vercelEnv)) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      { userAgent: "*", allow: "/" },
      allowTraining
        ? { userAgent: aiTrainingCrawlers, allow: "/" }
        : { userAgent: aiTrainingCrawlers, disallow: "/" },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildRss(posts: Post[]) {
  const lastBuildDate = posts.map(lastModified).sort().at(-1);

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.metadata.title)}</title>
      <link>${postUrl(post.slug)}</link>
      <guid isPermaLink="true">${postUrl(post.slug)}</guid>
      <description>${escapeXml(post.metadata.summary ?? "")}</description>
      <dc:creator>${escapeXml(person.name)}</dc:creator>
      <pubDate>${new Date(post.metadata.publishedAt).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(`${person.name}'s blog`)}</title>
    <link>${baseUrl}/blog</link>
    <description>${escapeXml(site.blogDescription)}</description>
    <language>${site.language}</language>
    <atom:link href="${baseUrl}/rss" rel="self" type="application/rss+xml" />${
      lastBuildDate
        ? `\n    <lastBuildDate>${new Date(lastBuildDate).toUTCString()}</lastBuildDate>`
        : ""
    }
${items}
  </channel>
</rss>
`;
}

// https://llmstxt.org — an experimental proposal, not a search ranking signal.
export function buildLlmsTxt(posts: Post[]) {
  const postLinks = posts
    .map(
      (post) =>
        `- [${post.metadata.title}](${postUrl(post.slug)}): ${post.metadata.summary}`
    )
    .join("\n");

  return `# ${person.name}

> ${person.name} is a ${person.jobTitle.toLowerCase()} working with ${person.technologies.join(", ")}. This website is the portfolio and technical blog of ${person.name}.

## About

- [Home](${baseUrl}): who ${person.name} is and the latest blog posts
- [GitHub](${person.profiles.github}): open source repositories
- [LinkedIn](${person.profiles.linkedin}): professional profile and experience

## Blog posts

${postLinks}

## Optional

- [Blog index](${baseUrl}/blog): all posts
- [RSS feed](${baseUrl}/rss)
- [Website source code](${person.sourceCode})
`;
}
