import { BlogIndexPage, blogIndexMetadata } from "app/_views/blog-index";

export const metadata = blogIndexMetadata("en");

export default function Page() {
  return <BlogIndexPage locale="en" />;
}
