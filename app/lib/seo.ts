// No Next.js runtime imports, so `node --test` can import it.

import type { MetadataRoute } from "next";
import { getLastModified as lastModified, type Post } from "../blog/utils.ts";
import { getTools, toolAppUrl, type Tool } from "../tools/registry.ts";
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
  business,
  homeUpdatedAt,
  isIndexable,
  mcpEndpoint,
  legalUpdatedAt,
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
  const { image } = post.metadata;
  return image ? new URL(image, baseUrl).href : ogImageUrl;
}

export function postTitle(post: Post) {
  return post.metadata.seoTitle ?? post.metadata.title;
}

export function postDescription(post: Post) {
  return post.metadata.description ?? post.metadata.summary;
}

/** The store listing a tool is installed from (its storeUrl may be a redirect) */
export function toolStoreListing(tool: Tool) {
  return tool.storeListingUrl ?? tool.storeUrl ?? undefined;
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
    alternateName: person.alternateName,
    url: baseUrl,
    jobTitle: getDictionary(locale).jobTitle,
    description: getDictionary(locale).home.intro,
    email: `mailto:${business.email}`,
    knowsAbout: person.expertise,
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
      inLanguage: localeConfig[locale].htmlLang,
      author: { "@id": personId },
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
        description: postDescription(post),
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
          {
            "@type": "ListItem",
            position: 3,
            name: post.metadata.title,
            item: url,
          },
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
        [locale === defaultLocale ? "workTranslation" : "translationOfWork"]: {
          "@id": `${pageUrl("/mcp", otherLocale(locale))}#article`,
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
          { "@type": "ListItem", position: 2, name: dict.mcp.title, item: url },
        ],
      },
    ],
  };
}

function toolOffers(tool: Tool, locale: Locale) {
  const offer = (name: string | undefined, price: number) => ({
    "@type": "Offer",
    ...(name && { name }),
    price: price.toFixed(2),
    priceCurrency: "BRL",
  });
  const credits = getDictionary(locale).tools.packs.credits;
  // Free to install; what's sold inside it (credits, a license) is listed too
  return [
    offer(undefined, 0),
    ...(tool.creditPacks ?? []).map((pack) =>
      offer(`${pack.credits.toLocaleString(localeConfig[locale].intl)} ${credits}`, pack.priceBRL)
    ),
    ...(tool.lifetimeLicense
      ? [offer(tool.lifetimeLicense.name, tool.lifetimeLicense.priceBRL)]
      : []),
  ];
}

export function toolJsonLd(tool: Tool, locale: Locale = defaultLocale) {
  const url = pageUrl(`/tool/${tool.slug}`, locale);
  const dict = getDictionary(locale);
  const text = tool.text[locale];
  const store = toolStoreListing(tool);
  const appUrl = toolAppUrl(tool, locale);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${url}#app`,
        name: text.name,
        description: text.summary,
        url,
        image: new URL(tool.icon, baseUrl).href,
        applicationCategory: tool.applicationCategory ?? "BrowserApplication",
        // A web app runs in any browser; an extension lists the ones it supports
        operatingSystem: tool.browsers?.join(", ") ?? "Web",
        ...(tool.manualBuild && { softwareVersion: tool.manualBuild.version }),
        datePublished: tool.publishedAt,
        dateModified: tool.updatedAt,
        inLanguage: localeConfig[locale].htmlLang,
        ...(store && { installUrl: store, sameAs: [store] }),
        // A web app's own site (which describes itself with the same author)
        ...(appUrl && { sameAs: [appUrl] }),
        offers: toolOffers(tool, locale),
        author: { "@id": personId },
        publisher: { "@id": personId },
        isPartOf: { "@id": websiteId },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: dict.breadcrumbs.home, item: pageUrl("/", locale) },
          { "@type": "ListItem", position: 2, name: dict.tools.title, item: pageUrl("/tools", locale) },
          { "@type": "ListItem", position: 3, name: text.name, item: url },
        ],
      },
    ],
  };
}

export function toolsIndexJsonLd(locale: Locale = defaultLocale) {
  const url = pageUrl("/tools", locale);
  const dict = getDictionary(locale);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#page`,
    url,
    name: dict.tools.title,
    description: dict.tools.description,
    inLanguage: localeConfig[locale].htmlLang,
    isPartOf: { "@id": websiteId },
    author: { "@id": personId },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: getTools().map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: pageUrl(`/tool/${tool.slug}`, locale),
        name: tool.text[locale].name,
      })),
    },
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

    const newestTool = getTools().map((tool) => tool.publishedAt).sort().at(-1);
    // The home page lists posts and tools under its own text: the newest wins
    const home = [latest, newestTool, homeUpdatedAt].filter(Boolean).sort().at(-1);

    entries.push(
      page("/", home),
      page("/blog", latest),
      page("/mcp", mcpUpdatedAt),
      page("/terms", legalUpdatedAt.terms),
      page("/privacy", legalUpdatedAt.privacy),
      page("/tools", getTools().map((tool) => tool.updatedAt).sort().at(-1)),
      ...getTools().flatMap((tool) => [
        page(`/tool/${tool.slug}`, tool.updatedAt),
        page(`/tool/${tool.slug}/privacy`, tool.privacyUpdatedAt),
        ...(tool.eulaUpdatedAt ? [page(`/tool/${tool.slug}/eula`, tool.eulaUpdatedAt)] : []),
      ]),
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
      // A crawler follows only its most specific group, so this one repeats
      // the /api/ rule instead of inheriting it from "*"
      allowTraining
        ? { userAgent: aiTrainingCrawlers, allow: "/", disallow: "/api/" }
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

> ${person.name} is a software engineer focused on AI who builds AI and agent systems for production, works as an AI Forward Deployed Engineer and builds tools such as AI Summarizer. This website is the portfolio and technical blog of ${person.name}, in English and Brazilian Portuguese.

## About

- [Home](${baseUrl}): who ${person.name} is and the latest blog posts
- [GitHub](${person.profiles.github}): open source repositories
- [LinkedIn](${person.profiles.linkedin}): professional profile and experience

## Blog posts

${postLinks("en")}

## Tools

${getTools()
  .map(
    (tool) =>
      `- [${tool.text.en.name}](${pageUrl(`/tool/${tool.slug}`)}): ${tool.text.en.summary}${tool.appUrl ? ` [Open the app](${toolAppUrl(tool, "en")}) ·` : ""}${toolStoreListing(tool) ? ` [Chrome Web Store](${toolStoreListing(tool)}) ·` : ""} [Privacy policy](${pageUrl(`/tool/${tool.slug}/privacy`)})${tool.eulaUpdatedAt ? ` · [EULA](${pageUrl(`/tool/${tool.slug}/eula`)})` : ""}`
  )
  .join("\n")}

## MCP server

- [MCP server](${pageUrl("/mcp")}): how to connect an AI assistant to this website with the Model Context Protocol, and the AI concepts behind it
- MCP endpoint (Streamable HTTP, read-only, no authentication): ${mcpEndpoint}. Tools accept a \`language\` argument ("en" or "pt-BR").

## Português (Brasil)

The same content translated to Brazilian Portuguese:

- [Início](${pageUrl("/", "pt-br")}): quem é ${person.name}
- [Servidor MCP](${pageUrl("/mcp", "pt-br")})
- [Ferramentas](${pageUrl("/tools", "pt-br")})
${postLinks("pt-br")}

## Optional

- [Blog index](${pageUrl("/blog")}): all posts ([em português](${pageUrl("/blog", "pt-br")}))
- [RSS feed](${rssUrl()}) ([em português](${rssUrl("pt-br")}))
- [Full text of every post](${baseUrl}/llms-full.txt): all English posts in Markdown, in one file
- [Website source code](${person.sourceCode})
`;
}

/** Every post's full Markdown in one file, for tools that read a whole site */
export function buildLlmsFullTxt(posts: Post[]) {
  const body = posts
    .map(
      (post) => `# ${post.metadata.title}

URL: ${postUrl(post.slug)}
Published: ${post.metadata.publishedAt}${post.metadata.updatedAt ? `\nUpdated: ${post.metadata.updatedAt}` : ""}
Author: ${person.name}

> ${post.metadata.summary}

${post.content}`
    )
    .join("\n\n---\n\n");

  return `# ${person.name}: full text of the blog

> Every post of ${pageUrl("/blog")} in Markdown (MDX), newest first. The index is at ${baseUrl}/llms.txt.

${body}
`;
}
