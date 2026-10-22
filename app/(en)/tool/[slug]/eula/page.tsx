import { ToolEulaPage, toolEulaMetadata, toolEulaStaticParams } from "app/_views/tools";

export const dynamicParams = false;

export function generateStaticParams() {
  return toolEulaStaticParams();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return toolEulaMetadata((await params).slug, "en");
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ToolEulaPage slug={(await params).slug} locale="en" />;
}
