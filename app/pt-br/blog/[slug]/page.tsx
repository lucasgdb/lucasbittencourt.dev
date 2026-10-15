import { PostPage, postMetadata, postStaticParams } from "app/_views/post";

export const dynamicParams = false;

export function generateStaticParams() {
  return postStaticParams("pt-br");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return postMetadata((await params).slug, "pt-br");
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <PostPage slug={(await params).slug} locale="pt-br" />;
}
