import { ToolPrivacyPage, toolPrivacyMetadata, toolStaticParams } from "app/_views/tools";

export const dynamicParams = false;

export function generateStaticParams() {
  return toolStaticParams();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return toolPrivacyMetadata((await params).slug, "pt-br");
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ToolPrivacyPage slug={(await params).slug} locale="pt-br" />;
}
