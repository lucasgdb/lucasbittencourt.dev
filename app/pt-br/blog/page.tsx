import { BlogIndexPage, blogIndexMetadata } from "app/_views/blog-index";

export const metadata = blogIndexMetadata("pt-br");

export default function Page() {
  return <BlogIndexPage locale="pt-br" />;
}
