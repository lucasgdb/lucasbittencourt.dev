import { test } from "node:test";
import assert from "node:assert/strict";
import { getBlogPosts, getSortedBlogPosts, type Post } from "../app/blog/utils.ts";
import { locales } from "../app/lib/i18n.ts";
import { existsSync, readFileSync } from "node:fs";
import {
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildRobots,
  buildRss,
  buildSitemap,
  homeJsonLd,
  pageAlternates,
  postJsonLd,
  serializeJsonLd,
  servicesJsonLd,
  toolJsonLd,
  toolsIndexJsonLd,
} from "../app/lib/seo.ts";
import { baseUrl, indexNowKey, person } from "../app/lib/site.ts";
import { getTools, toolAppUrl } from "../app/tools/registry.ts";

const postsByLocale = {
  en: getSortedBlogPosts("en"),
  "pt-br": getSortedBlogPosts("pt-br"),
};
const posts = postsByLocale.en;

const fakePost: Post = {
  slug: "a-and-b",
  content: "",
  metadata: {
    title: 'A & B <script> "quotes"',
    publishedAt: "2024-01-01",
    updatedAt: "2025-02-03",
    summary: "Summary with </script> & more",
  },
};

type Node = Record<string, any>;
const graph = (data: { "@graph": unknown[] }) => data["@graph"] as Node[];

test("every post has the required frontmatter, in every language", () => {
  for (const locale of locales) {
    for (const post of getBlogPosts(locale)) {
      const id = `${locale}/${post.slug}`;
      assert.ok(post.metadata.title, `${id}: title`);
      assert.ok(post.metadata.summary, `${id}: summary`);
      assert.match(post.metadata.publishedAt, /^\d{4}-\d{2}-\d{2}$/, id);
      if (post.metadata.updatedAt) {
        assert.match(post.metadata.updatedAt, /^\d{4}-\d{2}-\d{2}$/, id);
        assert.ok(post.metadata.updatedAt >= post.metadata.publishedAt, id);
      }
      // Search results cut titles past ~60 characters and descriptions past ~160
      if (post.metadata.seoTitle) {
        assert.ok(post.metadata.seoTitle.length <= 60, `${id}: seoTitle length`);
      }
      if (post.metadata.description) {
        assert.ok(post.metadata.description.length <= 160, `${id}: description length`);
      }
      // A local cover image must exist in /public
      if (post.metadata.image?.startsWith("/")) {
        assert.ok(existsSync(`public${post.metadata.image}`), `${id}: ${post.metadata.image}`);
      }
    }
  }
});

test("posts are sorted newest first", () => {
  for (const locale of locales) {
    const dates = postsByLocale[locale].map((post) => post.metadata.publishedAt);
    assert.deepEqual(dates, dates.toSorted().toReversed());
  }
});

test("sitemap lists every page in both languages, with hreflang alternates", () => {
  const sitemap = buildSitemap(postsByLocale);
  const urls = sitemap.map((entry) => entry.url);
  const paths = [
    "",
    "/blog",
    "/services",
    "/mcp",
    "/terms",
    "/privacy",
    "/tools",
    ...getTools().flatMap((tool) => [
      `/tool/${tool.slug}`,
      `/tool/${tool.slug}/privacy`,
      ...(tool.eulaUpdatedAt ? [`/tool/${tool.slug}/eula`] : []),
    ]),
    ...posts.map((post) => `/blog/${post.slug}`),
  ];

  assert.deepEqual(urls, [
    ...paths.map((path) => `${baseUrl}${path}`),
    ...paths.map((path) => `${baseUrl}/pt-br${path}`),
  ]);
  assert.equal(new Set(urls).size, urls.length);

  for (const entry of sitemap) {
    assert.ok(entry.url.startsWith("https://lucasbittencourt.dev"));
    assert.ok(!entry.url.endsWith("/"));
    assert.match(String(entry.lastModified), /^\d{4}-\d{2}-\d{2}$/);

    const languages = entry.alternates?.languages as Record<string, string>;
    assert.deepEqual(Object.keys(languages), ["en", "pt-BR", "x-default"]);
    assert.ok(Object.values(languages).includes(entry.url), entry.url);
    assert.equal(languages["x-default"], languages.en);
  }

  const post = buildSitemap({ en: [fakePost], "pt-br": [] }).find(
    (entry) => entry.url === `${baseUrl}/blog/${fakePost.slug}`
  );
  assert.equal(post?.lastModified, "2025-02-03");
});

test("pages declare their canonical URL, translations and feed", () => {
  assert.deepEqual(pageAlternates("/blog/x", "pt-br"), {
    canonical: "/pt-br/blog/x",
    languages: {
      en: `${baseUrl}/blog/x`,
      "pt-BR": `${baseUrl}/pt-br/blog/x`,
      "x-default": `${baseUrl}/blog/x`,
    },
    types: { "application/rss+xml": `${baseUrl}/pt-br/rss` },
  });
  assert.equal(pageAlternates("/", "en").canonical, "/");
  assert.equal(pageAlternates("/", "pt-br").canonical, "/pt-br");
  assert.equal(pageAlternates("/", "pt-br").languages["pt-BR"], `${baseUrl}/pt-br`);
});

test("robots.txt allows search crawlers and references the sitemap", () => {
  const robots = buildRobots("production", true);
  const rules = [robots.rules].flat();

  assert.deepEqual(rules[0], { userAgent: "*", allow: "/", disallow: "/api/" });
  assert.equal(robots.sitemap, `${baseUrl}/sitemap.xml`);
  // A crawler follows only its most specific group: every group that allows
  // the site must keep /api/ out too
  for (const rule of rules) {
    assert.equal(rule.allow, "/");
    assert.equal(rule.disallow, "/api/");
  }
});

test("robots.txt can block AI training crawlers without blocking search", () => {
  const rules = [buildRobots(undefined, false).rules].flat();

  assert.deepEqual(rules[0], { userAgent: "*", allow: "/", disallow: "/api/" });
  assert.ok([rules[1].userAgent].flat().includes("GPTBot"));
  assert.ok([rules[1].userAgent].flat().includes("Google-Extended"));
  assert.ok(![rules[1].userAgent].flat().includes("OAI-SearchBot"));
  assert.equal(rules[1].disallow, "/");
});

test("preview deployments are not crawlable", () => {
  for (const env of ["preview", "development"]) {
    const robots = buildRobots(env, true);
    assert.deepEqual(robots.rules, [{ userAgent: "*", disallow: "/" }]);
    assert.equal(robots.sitemap, undefined);
  }
});

test("JSON-LD is escaped so it cannot close the script tag", () => {
  const json = serializeJsonLd(postJsonLd(fakePost));

  assert.ok(!json.includes("</script>"));
  assert.ok(!json.includes("<"));
  assert.deepEqual(JSON.parse(json), postJsonLd(fakePost));
});

test("post JSON-LD describes the article, its language and its translation", () => {
  for (const locale of locales) {
    for (const post of postsByLocale[locale]) {
      const [article, breadcrumbs] = graph(postJsonLd(post, locale, true));
      const prefix = locale === "en" ? "" : "/pt-br";
      const url = `${baseUrl}${prefix}/blog/${post.slug}`;

      assert.equal(article["@type"], "BlogPosting");
      assert.equal(article.headline, post.metadata.title);
      assert.equal(article.url, url);
      assert.equal(article.inLanguage, locale === "en" ? "en" : "pt-BR");
      assert.equal(article.author.name, person.name);
      assert.equal(article.datePublished, post.metadata.publishedAt);
      assert.equal(
        article.dateModified,
        post.metadata.updatedAt ?? post.metadata.publishedAt
      );
      assert.ok(new URL(article.image).protocol === "https:");
      assert.equal(breadcrumbs["@type"], "BreadcrumbList");
      assert.equal(breadcrumbs.itemListElement.length, 3);

      const other = `${baseUrl}${locale === "en" ? "/pt-br" : ""}/blog/${post.slug}#article`;
      if (locale === "en") {
        assert.equal(article.workTranslation["@id"], other);
      } else {
        assert.equal(article.translationOfWork["@id"], other);
      }
    }
  }
});

test("home JSON-LD connects the profile page, person and website", () => {
  for (const locale of locales) {
    const nodes = graph(homeJsonLd(locale));
    const ids = new Set(nodes.map((node) => node["@id"]));
    const personNode = nodes.find((node) => node["@type"] === "Person")!;

    assert.equal(ids.size, nodes.length);
    assert.deepEqual(personNode.sameAs, Object.values(person.profiles));
    assert.equal(personNode.alternateName, person.alternateName);
    assert.ok(personNode.description);
    assert.ok(!("image" in personNode));
    assert.ok(ids.has(`${baseUrl}/#person`));
    assert.ok(ids.has(`${baseUrl}/#website`));
  }
});

test("RSS feeds are valid, escaped and list every post", () => {
  for (const locale of locales) {
    const rss = buildRss(postsByLocale[locale], locale);
    const self = locale === "en" ? `${baseUrl}/rss` : `${baseUrl}/pt-br/rss`;

    assert.ok(rss.startsWith('<?xml version="1.0" encoding="UTF-8" ?>'));
    assert.equal(rss.match(/<item>/g)?.length, postsByLocale[locale].length);
    assert.ok(rss.includes(`<atom:link href="${self}" rel="self"`));
    assert.ok(rss.includes(`<language>${locale === "en" ? "en" : "pt-BR"}</language>`));
  }

  const escaped = buildRss([fakePost]);
  assert.ok(escaped.includes("A &amp; B &lt;script&gt; &quot;quotes&quot;"));
  assert.ok(!escaped.includes("</script>"));
});

test("llms.txt follows the proposal structure and links every post", () => {
  const llms = buildLlmsTxt(postsByLocale);

  assert.match(llms, /^# Lucas Bittencourt\n\n> /);
  assert.ok(llms.includes("\n## Blog posts\n"));
  assert.ok(llms.includes(`${baseUrl}/api/mcp`));
  for (const tool of getTools().filter((tool) => tool.eulaUpdatedAt)) {
    assert.ok(llms.includes(`(${baseUrl}/tool/${tool.slug}/eula)`), tool.slug);
  }
  for (const post of posts) {
    assert.ok(llms.includes(`(${baseUrl}/blog/${post.slug})`), post.slug);
    assert.ok(llms.includes(`(${baseUrl}/pt-br/blog/${post.slug})`), post.slug);
  }
});

test("tool JSON-LD describes each extension or web app, where to get it and prices", () => {
  for (const locale of locales) {
    for (const tool of getTools()) {
      const [app, breadcrumbs] = graph(toolJsonLd(tool, locale));
      const prefix = locale === "en" ? "" : "/pt-br";

      assert.equal(app["@type"], "SoftwareApplication");
      assert.equal(app.url, `${baseUrl}${prefix}/tool/${tool.slug}`);
      assert.equal(app.author["@id"], `${baseUrl}/#person`);
      if (tool.appUrl) {
        // A web app: its own category, runs in any browser, linked to its site
        assert.equal(app.applicationCategory, tool.applicationCategory);
        assert.equal(app.operatingSystem, "Web");
        assert.deepEqual(app.sameAs, [toolAppUrl(tool, locale)]);
      } else {
        assert.equal(app.applicationCategory, "BrowserApplication");
        assert.ok(app.operatingSystem.includes("Chrome"));
      }
      assert.equal(app.offers[0].price, "0.00");
      for (const offer of app.offers) {
        assert.match(offer.price, /^\d+\.\d{2}$/);
        assert.equal(offer.priceCurrency, "BRL");
      }
      // The store listing, not the redirect in storeUrl
      if (tool.storeListingUrl) {
        assert.equal(app.installUrl, tool.storeListingUrl);
        assert.ok(app.installUrl.startsWith("https://chromewebstore.google.com/"));
      }
      assert.equal(breadcrumbs.itemListElement.length, 3);
    }

    const index = toolsIndexJsonLd(locale);
    assert.equal(index.mainEntity.itemListElement.length, getTools().length);
  }

  // Deckr is listed as a web app, at its own address in the page's language
  const deckr = getTools().find((tool) => tool.slug === "deckr");
  assert.ok(deckr);
  assert.equal(toolAppUrl(deckr, "en"), "https://deckr.lucasbittencourt.dev/en");
  assert.equal(toolAppUrl(deckr, "pt-br"), "https://deckr.lucasbittencourt.dev/");
});

test("services JSON-LD has the provider, contact channel and breadcrumbs", () => {
  for (const locale of locales) {
    const [service, breadcrumbs] = graph(servicesJsonLd(locale));
    assert.equal(service["@type"], "Service");
    assert.equal(service.provider["@id"], `${baseUrl}/#person`);
    assert.match(service.availableChannel.servicePhone.telephone, /^\+\d+$/);
    assert.ok(breadcrumbs.itemListElement.every((item: Node) => item.item));
  }
});

test("llms-full.txt has every English post in full", () => {
  const full = buildLlmsFullTxt(posts);
  assert.match(full, /^# Lucas Bittencourt: full text of the blog\n/);
  for (const post of posts) {
    assert.ok(full.includes(`URL: ${baseUrl}/blog/${post.slug}`), post.slug);
    assert.ok(full.includes(post.content.slice(0, 200)), post.slug);
  }
  assert.ok(buildLlmsTxt(postsByLocale).includes(`${baseUrl}/llms-full.txt`));
});

test("the IndexNow key file and security.txt are published", () => {
  assert.equal(readFileSync(`public/${indexNowKey}.txt`, "utf-8"), indexNowKey);
  const security = readFileSync("public/.well-known/security.txt", "utf-8");
  assert.match(security, /^Contact: mailto:/m);
  const expires = /^Expires: (.+)$/m.exec(security)?.[1];
  assert.ok(expires && new Date(expires) > new Date(), "security.txt has expired");
});
