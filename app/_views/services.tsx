import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import { MailIcon, MessageCircleIcon } from "lucide-react";
import { Button } from "app/components/ui/button";
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

/** The page's main action, above the fold: talk about a project */
function ContactButtons({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale).services;
  return (
    <div className="mt-6 mb-8">
      <p className="mb-3 font-medium tracking-tight">{dict.contact}</p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="lg" className="h-11 px-4">
          <a href={`mailto:${business.email}`}>
            <MailIcon />
            {dict.email}
          </a>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-11 px-4">
          <a href={business.whatsappUrl} rel="noopener noreferrer" target="_blank">
            <MessageCircleIcon />
            WhatsApp
          </a>
        </Button>
      </div>
    </div>
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
      <ContactButtons locale={locale} />
      <article className="prose">
        <CustomMDX source={content} components={{ Contact }} />
      </article>
    </section>
  );
}
