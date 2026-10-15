import { handleMcpRequest } from "app/lib/mcp";

export const dynamic = "force-dynamic";

export {
  handleMcpRequest as GET,
  handleMcpRequest as POST,
  handleMcpRequest as DELETE,
  handleMcpRequest as OPTIONS,
};
