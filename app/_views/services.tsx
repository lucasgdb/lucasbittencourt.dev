import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import { CustomMDX } from "app/components/mdx";
import { JsonLd } from "app/components/json-ld";
import { getDictionary, type Locale } from "app/lib/i18n";
import { baseOpenGraph, pageAlternates, servicesJsonLd } from "app/lib/seo";
import { business } from "app/lib/site";

export function servicesMetadata(locale: Locale): Metadata {
  const { title, description } = getDictionary(locale).services;
  const alternates = pageAlternates("/services", locale);
  return {
    title,
    description,
    alternates,
    openGraph: { ...baseOpenGraph(locale), title, description, url: alternates.canonical },
  };
}

function Contact() {
  return (
    <ul>
      <li>
        E-mail: <a href={`mailto:${business.email}`}>{business.email}</a>
      </li>
      <li>
        WhatsApp: <a href={business.whatsappUrl}>{business.whatsapp}</a>
      </li>
    </ul>
  );
}

export function ServicesPage({ locale }: { locale: Locale }) {
  const content = fs.readFileSync(
    path.join(process.cwd(), "app", "services", `content.${locale}.mdx`),
    "utf-8"
  );

  return (
    <section>
      <JsonLd data={servicesJsonLd(locale)} />
      <h1 className="title font-semibold text-2xl tracking-tighter">
        {getDictionary(locale).services.title}
      </h1>
      <article className="prose">
        <CustomMDX source={content} components={{ Contact }} />
      </article>
    </section>
  );
}
