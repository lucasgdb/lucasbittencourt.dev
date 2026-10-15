import { McpPage, mcpMetadata } from "app/_views/mcp";

export const metadata = mcpMetadata("pt-br");

export default function Page() {
  return <McpPage locale="pt-br" />;
}
