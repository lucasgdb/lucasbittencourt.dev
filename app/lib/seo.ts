// No Next.js runtime imports, so `node --test` can import it.

import type { MetadataRoute } from "next";
import { getLastModified as lastModified, type Post } from "../blog/utils.ts";
import {
  defaultLocale,
  getDictionary,
  localeConfig,
  localizePath,
  locales,
  otherLocale,
  type Locale,
} from "./i18n.ts";
import {
  allowAiTraining,
  baseUrl,
  isIndexable,
  mcpEndpoint,
  mcpUpdatedAt,
  person,
  site,
} from "./site.ts";

const personId = `${baseUrl}/#person`;
const websiteId = `${baseUrl}/#website`;

export function pageUrl(path: string, locale: Locale = defaultLocale) {
  const localized = localizePath(path, locale);
  return localized === "/" ? baseUrl : `${baseUrl}${localized}`;
}

export function postUrl(slug: string, locale: Locale = defaultLocale) {
  return pageUrl(`/blog/${slug}`, locale);
}

export function rssUrl(locale: Locale = defaultLocale) {
  return pageUrl("/rss", locale);
}

function blogId(locale: Locale) {
  return `${pageUrl("/blog", locale)}#blog`;
}

export function languageAlternates(path: string) {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [localeConfig[locale].htmlLang, pageUrl(path, locale)])
    ),
    "x-default": pageUrl(path, defaultLocale),
  };
}

// Next.js replaces `alternates` and `openGraph` from parent layouts instead of
// merging them, so every page sets them in full.
export function pageAlternates(path: string, locale: Locale = defaultLocale) {
  return {
    canonical: localizePath(path, locale),
    languages: languageAlternates(path),
    types: { "application/rss+xml": rssUrl(locale) },
  };
}

export const ogImageUrl = `${baseUrl}/og`;

export const ogImageSize = { width: 1200, height: 630 };

export function baseOpenGraph(locale: Locale = defaultLocale) {
  return {
    siteName: site.name,
    locale: localeConfig[locale].ogLocale,
    alternateLocale: [localeConfig[otherLocale(locale)].ogLocale],
    type: "website" as const,
    images: [{ url: ogImageUrl, ...ogImageSize, alt: person.name }],
  };
}

export function postImageUrl(post: Post) {
  return post.metadata.image ?? ogImageUrl;
}

// JSON.stringify doesn't escape "<": "</script>" in a value would end the tag.
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function personJsonLd(locale: Locale = defaultLocale) {
  return {
    "@type": "Person",
    "@id": personId,
    name: person.name,
    url: baseUrl,
    jobTitle: getDictionary(locale).jobTitle,
    knowsAbout: person.technologies,
    knowsLanguage: locales.map((l) => localeConfig[l].htmlLang),
    sameAs: Object.values(person.profiles),
  };
}

export function websiteJsonLd(locale: Locale = defaultLocale) {
  return {
    "@type": "WebSite",
    "@id": websiteId,
    name: person.name,
    alternateName: site.name,
    url: baseUrl,
    description: getDictionary(locale).siteDescription,
    inLanguage: locales.map((l) => localeConfig[l].htmlLang),
    author: { "@id": personId },
  };
}

export function homeJsonLd(locale: Locale = defaultLocale) {
  const url = pageUrl("/", locale);
  const dict = getDictionary(locale);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}/#profilepage`,
        url,
        name: `${person.name} – ${dict.jobTitle}`,
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": personId },
        inLanguage: localeConfig[locale].htmlLang,
      },
      personJsonLd(locale),
      websiteJsonLd(locale),
    ],
  };
}

export function blogJsonLd(posts: Post[], locale: Locale = defaultLocale) {
  const dict = getDictionary(locale);

  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": blogId(locale),
    url: pageUrl("/blog", locale),
    name: dict.blog.name(person.name),
    description: dict.blogDescription,
    inLanguage: localeConfig[locale].htmlLang,
    author: { "@id": personId },
    isPartOf: { "@id": websiteId },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      "@id": `${postUrl(post.slug, locale)}#article`,
      headline: post.metadata.title,
      url: postUrl(post.slug, locale),
      datePublished: post.metadata.publishedAt,
      dateModified: lastModified(post),
    })),
  };
}

export function postJsonLd(
  post: Post,
  locale: Locale = defaultLocale,
  translated = false
) {
  const url = postUrl(post.slug, locale);
  const dict = getDictionary(locale);
  const translation = {
    "@id": `${postUrl(post.slug, otherLocale(locale))}#article`,
  };

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
        inLanguage: localeConfig[locale].htmlLang,
        author: {
          "@type": "Person",
          "@id": personId,
          name: person.name,
          url: baseUrl,
        },
        publisher: { "@id": personId },
        isPartOf: { "@id": blogId(locale) },
        ...(translated &&
          (locale === defaultLocale
            ? { workTranslation: translation }
            : { translationOfWork: translation })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: dict.breadcrumbs.home,
            item: pageUrl("/", locale),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: dict.breadcrumbs.blog,
            item: pageUrl("/blog", locale),
          },
          { "@type": "ListItem", position: 3, name: post.metadata.title },
        ],
      },
    ],
  };
}

export function mcpPageJsonLd(locale: Locale = defaultLocale) {
  const url = pageUrl("/mcp", locale);
  const dict = getDictionary(locale);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${url}#article`,
        headline: dict.mcp.title,
        description: dict.mcp.description,
        url,
        mainEntityOfPage: url,
        dateModified: mcpUpdatedAt,
        inLanguage: localeConfig[locale].htmlLang,
        author: { "@id": personId },
        publisher: { "@id": personId },
        isPartOf: { "@id": websiteId },
        about: [
          "Model Context Protocol",
          "Large language models",
          "Tool calling",
          "Retrieval-augmented generation",
        ],
        ...{
          [locale === defaultLocale ? "workTranslation" : "translationOfWork"]: {
            "@id": `${pageUrl("/mcp", otherLocale(locale))}#article`,
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: dict.breadcrumbs.home,
            item: pageUrl("/", locale),
          },
          { "@type": "ListItem", position: 2, name: dict.mcp.title },
        ],
      },
    ],
  };
}

export function buildSitemap(
  postsByLocale: Record<Locale, Post[]>
): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const posts = postsByLocale[locale];
    const latest = posts.map(lastModified).sort().at(-1);
    const page = (path: string, lastModified?: string) => ({
      url: pageUrl(path, locale),
      lastModified,
      alternates: { languages: languageAlternates(path) },
    });

    entries.push(
      page("/", latest),
      page("/blog", latest),
      page("/mcp", mcpUpdatedAt),
      ...posts.map((post) => page(`/blog/${post.slug}`, lastModified(post)))
    );
  }

  return entries;
}

// Training crawlers. Search crawlers (Googlebot, OAI-SearchBot, ...) use "*".
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
      { userAgent: "*", allow: "/", disallow: "/api/" },
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

export function buildRss(posts: Post[], locale: Locale = defaultLocale) {
  const dict = getDictionary(locale);
  const lastBuildDate = posts.map(lastModified).sort().at(-1);

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.metadata.title)}</title>
      <link>${postUrl(post.slug, locale)}</link>
      <guid isPermaLink="true">${postUrl(post.slug, locale)}</guid>
      <description>${escapeXml(post.metadata.summary ?? "")}</description>
      <dc:creator>${escapeXml(person.name)}</dc:creator>
      <pubDate>${new Date(post.metadata.publishedAt).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(dict.blog.name(person.name))}</title>
    <link>${pageUrl("/blog", locale)}</link>
    <description>${escapeXml(dict.blogDescription)}</description>
    <language>${localeConfig[locale].htmlLang}</language>
    <atom:link href="${rssUrl(locale)}" rel="self" type="application/rss+xml" />${
      lastBuildDate
        ? `\n    <lastBuildDate>${new Date(lastBuildDate).toUTCString()}</lastBuildDate>`
        : ""
    }
${items}
  </channel>
</rss>
`;
}

export function buildLlmsTxt(postsByLocale: Record<Locale, Post[]>) {
  const postLinks = (locale: Locale) =>
    postsByLocale[locale]
      .map(
        (post) =>
          `- [${post.metadata.title}](${postUrl(post.slug, locale)}): ${post.metadata.summary}`
      )
      .join("\n");

  return `# ${person.name}

> ${person.name} is a ${person.jobTitle.toLowerCase()} working with ${person.technologies.join(", ")}. This website is the portfolio and technical blog of ${person.name}, in English and Brazilian Portuguese.

## About

- [Home](${baseUrl}): who ${person.name} is and the latest blog posts
- [GitHub](${person.profiles.github}): open source repositories
- [LinkedIn](${person.profiles.linkedin}): professional profile and experience

## Blog posts

${postLinks("en")}

## MCP server

- [MCP server](${pageUrl("/mcp")}): how to connect an AI assistant to this website with the Model Context Protocol, and the AI concepts behind it
- MCP endpoint (Streamable HTTP, read-only, no authentication): ${mcpEndpoint}. Tools accept a \`language\` argument ("en" or "pt-BR").

## Português (Brasil)

The same content translated to Brazilian Portuguese:

- [Início](${pageUrl("/", "pt-br")}): quem é ${person.name}
- [Servidor MCP](${pageUrl("/mcp", "pt-br")})
${postLinks("pt-br")}

## Optional

- [Blog index](${pageUrl("/blog")}): all posts ([em português](${pageUrl("/blog", "pt-br")}))
- [RSS feed](${rssUrl()}) ([em português](${rssUrl("pt-br")}))
- [Website source code](${person.sourceCode})
`;
}
