import { UninstallPage, uninstallMetadata, uninstallStaticParams } from "app/_views/uninstall";

export const dynamicParams = false;

export function generateStaticParams() {
  return uninstallStaticParams();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return uninstallMetadata((await params).slug, "pt-br");
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <UninstallPage slug={(await params).slug} locale="pt-br" />;
}
