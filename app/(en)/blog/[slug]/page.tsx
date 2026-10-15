import { PostPage, postMetadata, postStaticParams } from "app/_views/post";

export const dynamicParams = false;

export function generateStaticParams() {
  return postStaticParams("en");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return postMetadata((await params).slug, "en");
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <PostPage slug={(await params).slug} locale="en" />;
}
