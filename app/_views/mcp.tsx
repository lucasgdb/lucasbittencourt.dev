import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "app/components/ui/table";
import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import { highlight } from "sugar-high";
import { CustomMDX } from "app/components/mdx";
import { JsonLd } from "app/components/json-ld";
import { getDictionary, type Locale } from "app/lib/i18n";
import { mcpTools, searchBlog } from "app/lib/mcp";
import { baseOpenGraph, mcpPageJsonLd, pageAlternates } from "app/lib/seo";
import { mcpEndpoint } from "app/lib/site";

export function mcpMetadata(locale: Locale): Metadata {
  const { title, description } = getDictionary(locale).mcp;
  return {
    title,
    description,
    alternates: pageAlternates("/mcp", locale),
    openGraph: {
      ...baseOpenGraph(locale),
      title,
      description,
      url: pageAlternates("/mcp", locale).canonical,
    },
  };
}

// Some clients only accept letters, digits, "-" and "_"
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

function mcpComponents(locale: Locale) {
  const dict = getDictionary(locale).mcp;

  function McpTools() {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{dict.toolsTable.tool}</TableHead>
            <TableHead>{dict.toolsTable.returns}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mcpTools.map((tool) => (
            <TableRow key={tool.name}>
              <TableCell>
                <code>{tool.name}</code>
              </TableCell>
              <TableCell className="whitespace-normal">{dict.tools[tool.name]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  function McpExampleResult() {
    const results = searchBlog(dict.exampleQuery, 1, locale).map((result) => ({
      ...result,
      excerpt: `${result.excerpt.slice(0, 160)}…`,
    }));

    return (
      <CodeBlock
        code={JSON.stringify(
          { jsonrpc: "2.0", id: 3, result: { structuredContent: { results } } },
          null,
          2
        )}
      />
    );
  }

  return { McpEndpoint, McpCommand, McpConfig, McpTools, McpExampleResult };
}

function readContent(locale: Locale) {
  const file = locale === "en" ? "content.mdx" : `content.${locale}.mdx`;
  return fs.readFileSync(path.join(process.cwd(), "app", "mcp", file), "utf-8");
}

export function McpPage({ locale }: { locale: Locale }) {
  return (
    <section>
      <JsonLd data={mcpPageJsonLd(locale)} />
      <h1 className="title font-semibold text-2xl tracking-tighter">
        {getDictionary(locale).mcp.title}
      </h1>
      <article className="prose">
        <CustomMDX source={readContent(locale)} components={mcpComponents(locale)} />
      </article>
    </section>
  );
}
