import "./global.css";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Navbar } from "./components/nav";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Footer from "./components/footer";
import { baseUrl, isIndexable, person, site } from "./lib/site";
import { baseOpenGraph } from "./lib/seo";

const defaultTitle = `${person.name} – ${person.jobTitle}`;

export const metadata: Metadata = {
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
  description: site.description,
  applicationName: site.name,
  authors: [{ name: person.name, url: baseUrl }],
  creator: person.name,
  openGraph: {
    ...baseOpenGraph(),
    title: defaultTitle,
    description: site.description,
    url: baseUrl,
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
  // Optional: HTML-tag verification for Google Search Console and Bing
  // Webmaster Tools (DNS verification needs no code). See docs/SEO.md.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang={site.language}
      data-scroll-behavior="smooth"
      className={cx(
        "text-black bg-white dark:text-white dark:bg-black",
        GeistSans.variable,
        GeistMono.variable
      )}
    >
      <body className="antialiased max-w-xl mx-4 mt-8 lg:mx-auto">
        <div className="flex-auto min-w-0 mt-6 flex flex-col px-2 md:px-0">
          <Navbar />
          <main>{children}</main>
          <Footer />
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
