import { McpPage, mcpMetadata } from "app/_views/mcp";

export const metadata = mcpMetadata("en");

export default function Page() {
  return <McpPage locale="en" />;
}
