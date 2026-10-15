import { RootDocument, rootMetadata, viewport } from "app/_views/root-layout";

const locale = "pt-br";

export const metadata = rootMetadata(locale);
export { viewport };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument locale={locale}>{children}</RootDocument>;
}
