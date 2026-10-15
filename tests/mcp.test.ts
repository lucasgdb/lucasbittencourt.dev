import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { getSortedBlogPosts } from "../app/blog/utils.ts";
import {
  chunkPost,
  getPost,
  handleMcpRequest,
  listPosts,
  mcpTools,
  searchBlog,
  tokenize,
} from "../app/lib/mcp.ts";
import { slugify } from "../app/lib/slugify.ts";
import { baseUrl, mcpEndpoint, person } from "../app/lib/site.ts";

const posts = getSortedBlogPosts();

const client = new Client({ name: "test", version: "1.0.0" });

before(async () => {
  const transport = new StreamableHTTPClientTransport(new URL(mcpEndpoint), {
    fetch: (input, init) => handleMcpRequest(new Request(input, init)),
  });
  await client.connect(transport);
});

after(() => client.close());

function structured<T>(result: { structuredContent?: unknown }) {
  return result.structuredContent as T;
}

test("lists exactly the documented, read-only tools", async () => {
  const { tools } = await client.listTools();

  assert.deepEqual(
    tools.map((tool) => tool.name).toSorted(),
    mcpTools.map((tool) => tool.name).toSorted()
  );
  for (const tool of tools) {
    assert.equal(tool.annotations?.readOnlyHint, true, tool.name);
    assert.ok(tool.description, tool.name);
    assert.ok(tool.outputSchema, tool.name);
  }
});

test("get_profile returns the same identity as the site", async () => {
  const profile = structured<{ name: string; profiles: object; mcpEndpoint: string }>(
    await client.callTool({ name: "get_profile", arguments: {} })
  );

  assert.equal(profile.name, person.name);
  assert.deepEqual(profile.profiles, person.profiles);
  assert.equal(profile.mcpEndpoint, `${baseUrl}/api/mcp`);
});

test("list_posts returns every post with canonical URLs", async () => {
  const { posts: listed } = structured<{ posts: { slug: string; url: string }[] }>(
    await client.callTool({ name: "list_posts", arguments: {} })
  );

  assert.deepEqual(
    listed.map((post) => post.slug),
    posts.map((post) => post.slug)
  );
  for (const post of listed) {
    assert.equal(post.url, `${baseUrl}/blog/${post.slug}`);
  }
});

test("get_post returns the content, or an error the model can recover from", async () => {
  const slug = posts[0].slug;
  const post = structured<{ content: string }>(
    await client.callTool({ name: "get_post", arguments: { slug } })
  );
  assert.equal(post.content, posts[0].content);

  const missing = await client.callTool({
    name: "get_post",
    arguments: { slug: "does-not-exist" },
  });
  assert.equal(missing.isError, true);
  assert.match(JSON.stringify(missing.content), new RegExp(slug));
});

test("search_blog validates its arguments", async () => {
  const result = await client.callTool({
    name: "search_blog",
    arguments: { query: "react", limit: 50 },
  });
  assert.equal(result.isError, true);
});

test("search_blog finds the right section and links to its anchor", async () => {
  const { results } = structured<{ results: { section: string; url: string }[] }>(
    await client.callTool({
      name: "search_blog",
      arguments: { query: "How does process.nextTick differ from promises?" },
    })
  );

  assert.equal(results[0].section, "Microtasks: process.nextTick and Promises");
  assert.equal(
    results[0].url,
    `${baseUrl}/blog/nodejs-event-loop#microtasks-processnexttick-and-promises`
  );
});

test("search ranks relevant sections first for typical questions", () => {
  const cases: [string, string][] = [
    ["when should I use useMemo", "React Hook: useMemo"],
    ["binary search complexity", "O(log n): Logarithmic time"],
    ["deep copy an object", "structuredClone"],
    ["React Compiler", "React Compiler"],
  ];

  for (const [query, section] of cases) {
    const sections = searchBlog(query, 2).map((result) => result.section);
    assert.ok(sections.includes(section), `${query}: got ${sections.join(", ")}`);
  }
  assert.ok(
    searchBlog("how to avoid blocking the event loop", 3).some(
      (result) => result.section === "Don't block the event loop"
    )
  );
  assert.deepEqual(searchBlog("xyzzy"), []);
  assert.deepEqual(searchBlog("the of and"), []);
});

test("every search result links to an anchor that exists on the page", () => {
  for (const post of posts) {
    const headings = new Set(
      [...post.content.matchAll(/^#{2,3}\s+(.+)$/gm)].map((match) =>
        slugify(match[1].replace(/\\(.)/g, "$1"))
      )
    );
    for (const chunk of chunkPost(post)) {
      if (chunk.heading) {
        assert.ok(headings.has(slugify(chunk.heading)), chunk.heading);
      }
    }
  }
});

test("chunks skip the table of contents, in every language", () => {
  for (const locale of ["en", "pt-br"] as const) {
    for (const post of getSortedBlogPosts(locale)) {
      assert.ok(
        chunkPost(post).every((chunk) => !/table of contents|sumário/i.test(chunk.heading)),
        `${locale}/${post.slug}`
      );
    }
  }
});

test("tokenize removes stop words and stems simple suffixes", () => {
  assert.deepEqual(tokenize("How to avoid Blocking the event loops?"), [
    "avoid",
    "block",
    "event",
    "loop",
  ]);
});

test("data helpers match the tools", () => {
  assert.equal(listPosts().length, posts.length);
  assert.equal(getPost("does-not-exist"), undefined);
});

test("HTTP: CORS preflight, method handling and headers", async () => {
  const preflight = await handleMcpRequest(
    new Request(mcpEndpoint, { method: "OPTIONS", headers: { Origin: "http://localhost:6274" } })
  );
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "*");
  assert.match(preflight.headers.get("access-control-allow-headers") ?? "", /Mcp-Protocol-Version/);

  const get = await handleMcpRequest(new Request(mcpEndpoint, { method: "GET" }));
  assert.equal(get.status, 405);
  assert.equal(get.headers.get("x-robots-tag"), "noindex");
  assert.equal(get.headers.get("cache-control"), "no-store");

  const invalid = await handleMcpRequest(
    new Request(mcpEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: "{not json",
    })
  );
  assert.ok(invalid.status >= 400 && invalid.status < 500);
});

test("tools answer in Portuguese with language: pt-BR", async () => {
  const { posts: ptPosts } = structured<{ posts: { url: string; title: string }[] }>(
    await client.callTool({ name: "list_posts", arguments: { language: "pt-BR" } })
  );
  assert.ok(ptPosts.every((post) => post.url.startsWith(`${baseUrl}/pt-br/blog/`)));

  const profile = structured<{ jobTitle: string; website: string }>(
    await client.callTool({ name: "get_profile", arguments: { language: "pt-BR" } })
  );
  assert.equal(profile.jobTitle, "Engenheiro de Software Full-stack");
  assert.equal(profile.website, `${baseUrl}/pt-br`);

  const { results } = structured<{ results: { url: string }[] }>(
    await client.callTool({
      name: "search_blog",
      arguments: { query: "Qual a diferença entre process.nextTick e promises?", language: "pt-BR" },
    })
  );
  assert.match(results[0].url, /^https:\/\/lucasbittencourt\.dev\/pt-br\/blog\/nodejs-event-loop#microtasks-/);

  const invalid = await client.callTool({ name: "list_posts", arguments: { language: "fr" } });
  assert.equal(invalid.isError, true);
});
