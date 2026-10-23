import "../global.css";
import type { Metadata, Viewport } from "next";
import { Fragment } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Navbar } from "app/components/nav";
import Footer from "app/components/footer";
import { getDictionary, localeConfig, locales, type Locale } from "app/lib/i18n";
import { baseOpenGraph, pageAlternates } from "app/lib/seo";
import { baseUrl, isIndexable, person, site } from "app/lib/site";
import { themeColors, themeScript } from "app/lib/theme";

export function rootMetadata(locale: Locale): Metadata {
  const dict = getDictionary(locale);
  const defaultTitle = `${person.name} – ${dict.jobTitle}`;

  return {
    metadataBase: new URL(baseUrl),
    icons: {
      icon: "/logo.png",
      shortcut: "/logo-32x32.png",
      apple: "/logo.png",
    },
    title: {
      default: defaultTitle,
      template: `%s | ${person.name}`,
    },
    description: dict.siteDescription,
    applicationName: site.name,
    authors: [{ name: person.name, url: baseUrl }],
    creator: person.name,
    alternates: pageAlternates("/", locale),
    openGraph: {
      ...baseOpenGraph(locale),
      title: defaultTitle,
      description: dict.siteDescription,
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
    },
    robots: isIndexable()
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        }
      : { index: false, follow: false },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      other: process.env.BING_SITE_VERIFICATION
        ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
        : undefined,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: themeColors.light },
    { media: "(prefers-color-scheme: dark)", color: themeColors.dark },
  ],
};

const cx = (...classes: string[]) => classes.filter(Boolean).join(" ");

// "auto": the global 404 can't know the language, so localeScript reads it from
// the URL before the first paint and CSS shows the matching nav and footer.
const localeScript = `if(/^\\/pt-br(\\/|$)/.test(location.pathname))document.documentElement.lang="pt-BR"`;

export function RootDocument({
  locale,
  children,
}: {
  locale: Locale | "auto";
  children: React.ReactNode;
}) {
  const auto = locale === "auto";
  const shown = auto ? locales : [locale];
  const only = (l: Locale, node: React.ReactNode) =>
    auto ? (
      <div key={l} data-locale={l} className="contents">
        {node}
      </div>
    ) : (
      <Fragment key={l}>{node}</Fragment>
    );

  return (
    <html
      lang={localeConfig[auto ? "en" : locale].htmlLang}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={cx(
        "bg-background text-foreground",
        GeistSans.variable,
        GeistMono.variable
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {auto && <script dangerouslySetInnerHTML={{ __html: localeScript }} />}
      </head>
      <body className="antialiased flex min-h-dvh flex-col">
        {shown.map((l) => only(l, <Navbar locale={l} notFound={auto} />))}
        <div className="flex flex-1 flex-col self-center w-[calc(100%-2rem)] max-w-2xl mt-14 min-w-0 px-2 md:px-0">
          <main className="flex-1">{children}</main>
          {shown.map((l) => only(l, <Footer locale={l} />))}
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
