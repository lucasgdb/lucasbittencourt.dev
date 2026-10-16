import { ToolsIndexPage, toolsIndexMetadata } from "app/_views/tools";

export const metadata = toolsIndexMetadata("en");

export default function Page() {
  return <ToolsIndexPage locale="en" />;
}
