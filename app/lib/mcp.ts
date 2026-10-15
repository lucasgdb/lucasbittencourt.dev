// MCP server for the site: exposes the profile and the blog posts to any MCP
// client (Claude, Cursor, VS Code, ...). Uses the same data as the pages,
// JSON-LD and llms.txt. Served by app/api/mcp/route.ts, documented at /mcp.
//
// Kept free of Next.js imports so it can be tested with `node --test`.

import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { getLastModified, getSortedBlogPosts, type Post } from "../blog/utils.ts";
import { slugify } from "./slugify.ts";
import { postUrl } from "./seo.ts";
import { baseUrl, mcpEndpoint, person, site } from "./site.ts";

export const serverInfo = { name: "lucasbittencourt.dev", version: "1.0.0" };

export const serverInstructions = `Read-only access to the portfolio and technical blog of ${person.name}, a ${person.jobTitle.toLowerCase()}.
Use get_profile for who ${person.name} is, list_posts and get_post for the articles, and search_blog to find the passages that answer a question.
Every result includes canonical URLs: cite them when you use the content.`;

// Tools metadata, shared with the /mcp page so the docs never drift from the server.
export const mcpTools = [
  {
    name: "get_profile",
    title: "Get profile",
    description: `Who ${person.name} is: role, technologies, profiles and links.`,
  },
  {
    name: "list_posts",
    title: "List blog posts",
    description: "All blog posts, newest first, with summary, dates and URL.",
  },
  {
    name: "get_post",
    title: "Get blog post",
    description: "The full content (Markdown/MDX) of a blog post by its slug.",
  },
  {
    name: "search_blog",
    title: "Search the blog",
    description:
      "Ranked passages (post sections) that best match a question, with links to the exact section.",
  },
] as const;

type ToolName = (typeof mcpTools)[number]["name"];

function tool(name: ToolName) {
  const { title, description } = mcpTools.find((t) => t.name === name)!;
  return {
    title,
    description,
    annotations: { readOnlyHint: true, openWorldHint: false },
  };
}

// ---------------------------------------------------------------------------
// Data

export function getProfile() {
  return {
    name: person.name,
    jobTitle: person.jobTitle,
    summary: site.description,
    technologies: [...person.technologies],
    website: baseUrl,
    blog: `${baseUrl}/blog`,
    profiles: { ...person.profiles },
    sourceCode: person.sourceCode,
    mcpEndpoint,
  };
}

function postSummary(post: Post) {
  return {
    slug: post.slug,
    title: post.metadata.title,
    summary: post.metadata.summary,
    publishedAt: post.metadata.publishedAt,
    updatedAt: getLastModified(post),
    url: postUrl(post.slug),
  };
}

export function listPosts(posts = getSortedBlogPosts()) {
  return posts.map(postSummary);
}

export function getPost(slug: string, posts = getSortedBlogPosts()) {
  const post = posts.find((post) => post.slug === slug);
  return post ? { ...postSummary(post), content: post.content } : undefined;
}

// ---------------------------------------------------------------------------
// Search: a tiny retrieval step (the "R" of RAG). Posts are split into
// sections (chunking) and ranked with BM25, a classic keyword relevance
// function. No embeddings or external services: it runs in-process.

type Chunk = {
  post: Post;
  heading: string;
  text: string;
  tokens: string[];
};

const stopWords = new Set(
  "a about all an and any are as at be but by can could do does for from how i if in into is it its me my not of on or our should so than that the then there this to use used using was we what when where which who why will with you your".split(
    " "
  )
);

// Light stemming so "blocking", "blocks" and "block" match each other.
function stem(token: string) {
  if (token.length > 5 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }
  return token;
}

export function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1 && !stopWords.has(token))
    .map(stem);
}

// Markdown escapes (e.g. "O(n \* m)") render without the backslash.
function cleanHeading(heading: string) {
  return heading.replace(/\\(.)/g, "$1").trim();
}

export function chunkPost(post: Post): Chunk[] {
  const chunks: Chunk[] = [];
  let heading = "";
  let lines: string[] = [];

  const flush = () => {
    const text = lines.join("\n").trim();
    if (text && !/^table of contents/i.test(heading)) {
      // Title and heading count 3x: a match there is a strong signal.
      const boosted = `${post.metadata.title} ${heading} `.repeat(3);
      chunks.push({ post, heading, text, tokens: tokenize(boosted + text) });
    }
    lines = [];
  };

  for (const line of post.content.split("\n")) {
    const match = /^#{2,3}\s+(.+)$/.exec(line);
    if (match) {
      flush();
      heading = cleanHeading(match[1]);
    } else {
      lines.push(line);
    }
  }
  flush();

  return chunks;
}

function excerpt(text: string, maxLength = 600) {
  const compact = text.replace(/\n{3,}/g, "\n\n");
  if (compact.length <= maxLength) {
    return compact;
  }
  const cut = compact.slice(0, maxLength);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export function searchBlog(query: string, limit = 5, posts = getSortedBlogPosts()) {
  const chunks = posts.flatMap(chunkPost);
  const queryTokens = [...new Set(tokenize(query))];
  if (queryTokens.length === 0 || chunks.length === 0) {
    return [];
  }

  const k1 = 1.2;
  const b = 0.75;
  const averageLength =
    chunks.reduce((sum, chunk) => sum + chunk.tokens.length, 0) / chunks.length;
  const documentFrequency = new Map(
    queryTokens.map((token) => [
      token,
      chunks.filter((chunk) => chunk.tokens.includes(token)).length,
    ])
  );

  return chunks
    .map((chunk) => {
      const score = queryTokens.reduce((total, token) => {
        const frequency = chunk.tokens.filter((t) => t === token).length;
        if (frequency === 0) {
          return total;
        }
        const df = documentFrequency.get(token)!;
        const idf = Math.log(1 + (chunks.length - df + 0.5) / (df + 0.5));
        const norm = k1 * (1 - b + (b * chunk.tokens.length) / averageLength);
        return total + (idf * frequency * (k1 + 1)) / (frequency + norm);
      }, 0);
      return { chunk, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ chunk, score }) => ({
      post: chunk.post.metadata.title,
      section: chunk.heading || chunk.post.metadata.title,
      url: chunk.heading
        ? `${postUrl(chunk.post.slug)}#${slugify(chunk.heading)}`
        : postUrl(chunk.post.slug),
      score: Number(score.toFixed(3)),
      excerpt: excerpt(chunk.text),
    }));
}

// ---------------------------------------------------------------------------
// Server

const postSummarySchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  publishedAt: z.string(),
  updatedAt: z.string(),
  url: z.string(),
});

function json<T extends Record<string, unknown>>(structuredContent: T) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(structuredContent, null, 2) },
    ],
    structuredContent,
  };
}

export function createMcpServer() {
  const server = new McpServer(serverInfo, {
    instructions: serverInstructions,
  });

  server.registerTool(
    "get_profile",
    {
      ...tool("get_profile"),
      outputSchema: z.object({
        name: z.string(),
        jobTitle: z.string(),
        summary: z.string(),
        technologies: z.array(z.string()),
        website: z.string(),
        blog: z.string(),
        profiles: z.record(z.string(), z.string()),
        sourceCode: z.string(),
        mcpEndpoint: z.string(),
      }),
    },
    async () => json(getProfile())
  );

  server.registerTool(
    "list_posts",
    {
      ...tool("list_posts"),
      outputSchema: z.object({ posts: z.array(postSummarySchema) }),
    },
    async () => json({ posts: listPosts() })
  );

  server.registerTool(
    "get_post",
    {
      ...tool("get_post"),
      inputSchema: z.object({
        slug: z
          .string()
          .describe('The post slug, as returned by list_posts (e.g. "nodejs-event-loop")'),
      }),
      outputSchema: postSummarySchema.extend({ content: z.string() }),
    },
    async ({ slug }) => {
      const post = getPost(slug);
      if (!post) {
        const slugs = listPosts().map((post) => post.slug).join(", ");
        return {
          content: [
            { type: "text" as const, text: `No post with slug "${slug}". Available: ${slugs}` },
          ],
          isError: true,
        };
      }
      return json(post);
    }
  );

  server.registerTool(
    "search_blog",
    {
      ...tool("search_blog"),
      inputSchema: z.object({
        query: z.string().min(1).max(500).describe("A question or keywords"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(10)
          .default(5)
          .describe("Maximum number of passages (1-10)"),
      }),
      outputSchema: z.object({
        results: z.array(
          z.object({
            post: z.string(),
            section: z.string(),
            url: z.string(),
            score: z.number(),
            excerpt: z.string(),
          })
        ),
      }),
    },
    async ({ query, limit }) => json({ results: searchBlog(query, limit) })
  );

  return server;
}

// ---------------------------------------------------------------------------
// HTTP (Streamable HTTP transport, stateless: one server per request)

const handler = createMcpHandler(createMcpServer);

// Public, read-only data without cookies or credentials, so any origin may call
// it (e.g. browser-based clients such as the MCP Inspector). Host/Origin
// allow-lists protect *localhost* servers from DNS rebinding and aren't needed
// for a public endpoint.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

export async function handleMcpRequest(request: Request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const response = await handler.fetch(request);
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
