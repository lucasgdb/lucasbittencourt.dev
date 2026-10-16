import { ToolPage, toolMetadata, toolStaticParams } from "app/_views/tools";

export const dynamicParams = false;

export function generateStaticParams() {
  return toolStaticParams();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return toolMetadata((await params).slug, "en");
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ToolPage slug={(await params).slug} locale="en" />;
}
