import { test } from "node:test";
import assert from "node:assert/strict";
import { getBlogPosts, getSortedBlogPosts, type Post } from "../app/blog/utils.ts";
import {
  buildLlmsTxt,
  buildRobots,
  buildRss,
  buildSitemap,
  homeJsonLd,
  postJsonLd,
  serializeJsonLd,
} from "../app/lib/seo.ts";
import { baseUrl, person } from "../app/lib/site.ts";

const posts = getSortedBlogPosts();

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

test("every post has the required frontmatter", () => {
  for (const post of getBlogPosts()) {
    assert.ok(post.metadata.title, `${post.slug}: title`);
    assert.ok(post.metadata.summary, `${post.slug}: summary`);
    assert.match(post.metadata.publishedAt, /^\d{4}-\d{2}-\d{2}$/, post.slug);
    if (post.metadata.updatedAt) {
      assert.match(post.metadata.updatedAt, /^\d{4}-\d{2}-\d{2}$/, post.slug);
      assert.ok(post.metadata.updatedAt >= post.metadata.publishedAt, post.slug);
    }
  }
});

test("posts are sorted newest first", () => {
  const dates = posts.map((post) => post.metadata.publishedAt);
  assert.deepEqual(dates, dates.toSorted().toReversed());
});

test("sitemap lists only canonical URLs with real modification dates", () => {
  const sitemap = buildSitemap(posts);
  const urls = sitemap.map((entry) => entry.url);

  assert.deepEqual(urls, [
    baseUrl,
    `${baseUrl}/blog`,
    `${baseUrl}/mcp`,
    ...posts.map((post) => `${baseUrl}/blog/${post.slug}`),
  ]);
  assert.equal(new Set(urls).size, urls.length);

  for (const entry of sitemap) {
    assert.ok(entry.url.startsWith("https://lucasbittencourt.dev"));
    assert.ok(!entry.url.endsWith("/"));
    assert.match(String(entry.lastModified), /^\d{4}-\d{2}-\d{2}$/);
  }

  const post = buildSitemap([fakePost]).at(-1);
  assert.equal(post?.lastModified, "2025-02-03");
});

test("robots.txt allows search crawlers and references the sitemap", () => {
  const robots = buildRobots("production", true);
  const rules = [robots.rules].flat();

  // Everything is crawlable except the MCP endpoint (not a page)
  assert.deepEqual(rules[0], { userAgent: "*", allow: "/", disallow: "/api/" });
  assert.equal(robots.sitemap, `${baseUrl}/sitemap.xml`);
  assert.ok(rules.slice(1).every((rule) => !("disallow" in rule)));
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

test("post JSON-LD describes the article, author and breadcrumbs", () => {
  for (const post of posts) {
    const [article, breadcrumbs] = postJsonLd(post)["@graph"];
    const url = `${baseUrl}/blog/${post.slug}`;

    assert.equal(article["@type"], "BlogPosting");
    assert.equal(article.headline, post.metadata.title);
    assert.equal(article.url, url);
    assert.equal(article.author.name, person.name);
    assert.equal(article.datePublished, post.metadata.publishedAt);
    assert.equal(
      article.dateModified,
      post.metadata.updatedAt ?? post.metadata.publishedAt
    );
    assert.ok(new URL(article.image).protocol === "https:");
    assert.equal(breadcrumbs["@type"], "BreadcrumbList");
    assert.equal(breadcrumbs.itemListElement?.length, 3);
  }
});

test("home JSON-LD connects the profile page, person and website", () => {
  const graph = homeJsonLd()["@graph"];
  const ids = new Set(graph.map((node) => node["@id"]));
  const personNode = graph.find((node) => node["@type"] === "Person");

  assert.equal(ids.size, graph.length);
  assert.ok(personNode && "sameAs" in personNode);
  assert.deepEqual(personNode.sameAs, Object.values(person.profiles));
  assert.ok(!("image" in personNode));
});

test("RSS feed is valid, escaped and lists every post", () => {
  const rss = buildRss(posts);

  assert.ok(rss.startsWith('<?xml version="1.0" encoding="UTF-8" ?>'));
  assert.equal(rss.match(/<item>/g)?.length, posts.length);
  assert.ok(rss.includes(`<atom:link href="${baseUrl}/rss" rel="self"`));

  const escaped = buildRss([fakePost]);
  assert.ok(escaped.includes("A &amp; B &lt;script&gt; &quot;quotes&quot;"));
  assert.ok(!escaped.includes("</script>"));
});

test("llms.txt follows the proposal structure and links every post", () => {
  const llms = buildLlmsTxt(posts);

  assert.match(llms, /^# Lucas Bittencourt\n\n> /);
  assert.ok(llms.includes("\n## Blog posts\n"));
  assert.ok(llms.includes(`${baseUrl}/api/mcp`));
  for (const post of posts) {
    assert.ok(llms.includes(`(${baseUrl}/blog/${post.slug})`), post.slug);
  }
});
