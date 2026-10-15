import { handleMcpRequest } from "app/lib/mcp";

// MCP server (Streamable HTTP). See app/lib/mcp.ts and the /mcp page.
export const dynamic = "force-dynamic";

export {
  handleMcpRequest as GET,
  handleMcpRequest as POST,
  handleMcpRequest as DELETE,
  handleMcpRequest as OPTIONS,
};
