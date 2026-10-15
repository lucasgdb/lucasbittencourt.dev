import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import { highlight } from "sugar-high";
import { CustomMDX } from "app/components/mdx";
import { JsonLd } from "app/components/json-ld";
import { mcpTools, searchBlog } from "app/lib/mcp";
import {
  baseOpenGraph,
  mcpPageJsonLd,
  ogImage,
  pageAlternates,
} from "app/lib/seo";
import { mcpEndpoint, mcpPage } from "app/lib/site";

export const metadata: Metadata = {
  title: mcpPage.title,
  description: mcpPage.description,
  alternates: pageAlternates("/mcp"),
  openGraph: {
    ...baseOpenGraph(),
    title: mcpPage.title,
    description: mcpPage.description,
    url: "/mcp",
    images: [ogImage(mcpPage.title, "Connect your AI assistant to this website")],
  },
};

// Name of the server in the client config. Letters, digits, "-" and "_" only:
// some clients reject other characters.
const clientName = "lucasbittencourt";

function CodeBlock({ code }: { code: string }) {
  return (
    <pre>
      <code dangerouslySetInnerHTML={{ __html: highlight(code) }} />
    </pre>
  );
}

function McpEndpoint() {
  return <CodeBlock code={mcpEndpoint} />;
}

function McpCommand() {
  return (
    <CodeBlock
      code={`claude mcp add --transport http ${clientName} ${mcpEndpoint}`}
    />
  );
}

function McpConfig({ format }: { format: "cursor" | "vscode" }) {
  const config =
    format === "vscode"
      ? { servers: { [clientName]: { type: "http", url: mcpEndpoint } } }
      : { mcpServers: { [clientName]: { url: mcpEndpoint } } };

  return <CodeBlock code={JSON.stringify(config, null, 2)} />;
}

function McpTools() {
  return (
    <table>
      <thead>
        <tr>
          <th>Tool</th>
          <th>What it returns</th>
        </tr>
      </thead>
      <tbody>
        {mcpTools.map((tool) => (
          <tr key={tool.name}>
            <td>
              <code>{tool.name}</code>
            </td>
            <td className="whitespace-normal">{tool.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Real output of the search, generated at build time.
function McpExampleResult() {
  const results = searchBlog(
    "How does process.nextTick differ from promises?",
    1
  ).map((result) => ({
    ...result,
    excerpt: `${result.excerpt.slice(0, 160)}…`,
  }));

  return (
    <CodeBlock
      code={JSON.stringify(
        {
          jsonrpc: "2.0",
          id: 3,
          result: { structuredContent: { results } },
        },
        null,
        2
      )}
    />
  );
}

export default function Page() {
  const content = fs.readFileSync(
    path.join(process.cwd(), "app", "mcp", "content.mdx"),
    "utf-8"
  );

  return (
    <section>
      <JsonLd data={mcpPageJsonLd()} />
      <h1 className="title font-semibold text-2xl tracking-tighter">
        {mcpPage.title}
      </h1>
      <article className="prose">
        <CustomMDX
          source={content}
          components={{
            McpEndpoint,
            McpCommand,
            McpConfig,
            McpTools,
            McpExampleResult,
          }}
        />
      </article>
    </section>
  );
}
