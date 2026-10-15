import type { Metadata } from "next";
import { RootDocument, viewport } from "app/_views/root-layout";
import { NotFoundPage } from "app/_views/not-found";
import { getDictionary, locales } from "app/lib/i18n";
import { person } from "app/lib/site";

export const metadata: Metadata = {
  title: `${locales.map((l) => getDictionary(l).notFound.title).join(" · ")} | ${person.name}`,
  robots: { index: false, follow: true },
};

export { viewport };

export default function GlobalNotFound() {
  return (
    <RootDocument locale="auto">
      {locales.map((locale) => (
        <div key={locale} data-locale={locale}>
          <NotFoundPage locale={locale} />
        </div>
      ))}
    </RootDocument>
  );
}
