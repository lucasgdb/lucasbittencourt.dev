import { DownloadIcon } from "lucide-react";
import { Button } from "app/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "app/components/ui/table";
import fs from "fs";
import path from "path";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CustomMDX } from "app/components/mdx";
import { InstallNowButton, ToolTabs } from "app/components/tool-tabs";
import { formatDate } from "app/blog/utils";
import { getDictionary, localeConfig, localizePath, type Locale } from "app/lib/i18n";
import { baseOpenGraph, pageAlternates } from "app/lib/seo";
import { business } from "app/lib/site";
import { getTool, getTools, type Tool } from "app/tools/registry";

const toolPath = (slug: string) => `/tool/${slug}`;
const privacyPath = (slug: string) => `/tool/${slug}/privacy`;
const eulaPath = (slug: string) => `/tool/${slug}/eula`;

function readContent(slug: string, file: "content" | "privacy" | "eula" | "install", locale: Locale) {
  return fs.readFileSync(
    path.join(process.cwd(), "app", "tools", slug, `${file}.${locale}.mdx`),
    "utf-8"
  );
}

function findTool(slug: string) {
  const tool = getTool(slug);
  if (!tool) {
    notFound();
  }
  return tool;
}

export function toolStaticParams() {
  return getTools().map((tool) => ({ slug: tool.slug }));
}

export function toolEulaStaticParams() {
  return getTools()
    .filter((tool) => tool.eulaUpdatedAt)
    .map((tool) => ({ slug: tool.slug }));
}

// --- /tools ---------------------------------------------------------------

export function toolsIndexMetadata(locale: Locale): Metadata {
  const { title, description } = getDictionary(locale).tools;
  const alternates = pageAlternates("/tools", locale);
  return {
    title,
    description,
    alternates,
    openGraph: { ...baseOpenGraph(locale), title, description, url: alternates.canonical },
  };
}

function ToolIcon({ tool, size }: { tool: Tool; size: number }) {
  return (
    <Image
      src={tool.icon}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-lg"
    />
  );
}

export function ToolsIndexPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">
        {dict.tools.heading}
      </h1>
      <ul className="flex flex-col gap-6">
        {getTools().map((tool) => {
          const text = tool.text[locale];
          return (
            <li key={tool.slug}>
              <Link
                href={localizePath(toolPath(tool.slug), locale)}
                className="group flex items-start gap-4"
              >
                <ToolIcon tool={tool} size={40} />
                <div className="flex flex-col space-y-1">
                  <p className="text-neutral-900 dark:text-neutral-100 tracking-tight">
                    {text.name}
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {text.summary}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {text.platform}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// --- /tool/<slug> ---------------------------------------------------------

export function toolMetadata(slug: string, locale: Locale): Metadata | undefined {
  const tool = getTool(slug);
  if (!tool) {
    return;
  }
  const { name: title, summary: description } = tool.text[locale];
  const alternates = pageAlternates(toolPath(slug), locale);
  return {
    title,
    description,
    alternates,
    openGraph: { ...baseOpenGraph(locale), title, description, url: alternates.canonical },
  };
}

const linkClass =
  "underline underline-offset-2 decoration-neutral-500 transition-colors hover:text-neutral-800 dark:hover:text-neutral-100";

function CreditPacks({ tool, locale }: { tool: Tool; locale: Locale }) {
  const dict = getDictionary(locale).tools.packs;
  const intl = localeConfig[locale].intl;
  const number = (value: number) => value.toLocaleString(intl);
  const price = (value: number) =>
    value.toLocaleString(intl, { style: "currency", currency: "BRL" });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{dict.pack}</TableHead>
          <TableHead className="text-right">{dict.price}</TableHead>
          <TableHead className="text-right">{dict.bonus}</TableHead>
          <TableHead className="text-right">{dict.total}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tool.creditPacks?.map((pack) => (
          <TableRow key={pack.credits}>
            <TableCell>
              {number(pack.credits)} {dict.credits}
            </TableCell>
            <TableCell className="text-right tabular-nums">{price(pack.priceBRL)}</TableCell>
            <TableCell className="text-right tabular-nums">{pack.bonus ? `+${number(pack.bonus)}` : "—"}</TableCell>
            <TableCell className="text-right font-medium tabular-nums">{number(pack.credits + pack.bonus)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** "R$ 24,90": the lifetime license's price, from the registry */
function LifetimePrice({ tool, locale }: { tool: Tool; locale: Locale }) {
  const price = tool.lifetimeLicense?.priceBRL ?? 0;
  return (
    <>{price.toLocaleString(localeConfig[locale].intl, { style: "currency", currency: "BRL" })}</>
  );
}

/** A manual build's download, for one browser family: the button, then its
 * date and checksum (<DownloadBuild browser="chromium" /> in install.*.mdx) */
function DownloadBuild({ tool, locale, browser }: { tool: Tool; locale: Locale; browser: "chromium" | "firefox" }) {
  const build = tool.manualBuild!;
  const file = build.files[browser]!;
  const dict = getDictionary(locale).tools.manual;
  const size = `${(file.bytes / 1e6).toLocaleString(localeConfig[locale].intl, { maximumFractionDigits: 1 })} MB`;
  return (
    <div className="my-5 flex flex-col items-start gap-2">
      <Button asChild>
        {/* Inline: .prose a's underline would beat a utility class */}
        <a href={file.file} download style={{ textDecoration: "none" }}>
          <DownloadIcon />
          {dict.download(build.version, size)}
        </a>
      </Button>
      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
        {dict.released} <time dateTime={build.releasedAt}>{formatDate(build.releasedAt, false, locale)}</time>
        {" · "}
        {dict.checksum}: <code className="break-all">{file.sha256}</code>
      </p>
    </div>
  );
}

export function ToolPage({ slug, locale }: { slug: string; locale: Locale }) {
  const tool = findTool(slug);
  const dict = getDictionary(locale).tools;
  const text = tool.text[locale];
  const about = (
    <article className="prose">
      <CustomMDX
        source={readContent(slug, "content", locale)}
        components={{
          CreditPacks: () => <CreditPacks tool={tool} locale={locale} />,
          LifetimePrice: () => <LifetimePrice tool={tool} locale={locale} />,
        }}
      />
    </article>
  );

  return (
    <section>
      <div className="flex items-center gap-4">
        <ToolIcon tool={tool} size={56} />
        <div>
          <h1 className="title font-semibold text-2xl tracking-tighter">
            {text.name}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {text.platform}
          </p>
        </div>
      </div>
      {/* The summary is the page's description; the content opens with its
          own, fuller version */}
      {/* The page's main action: installing (until it's published, disabled) */}
      <div className="mt-6 flex flex-wrap gap-2">
        {/* Not in the store yet, but installable by hand: that comes first */}
        {!tool.storeUrl && tool.manualBuild && <InstallNowButton>{dict.installNow}</InstallNowButton>}
        {tool.storeUrl ? (
          <Button asChild size="lg">
            <a href={tool.storeUrl} rel="noopener noreferrer" target="_blank">
              <DownloadIcon />
              {dict.install}
            </a>
          </Button>
        ) : (
          // Outline and muted text instead of the default half opacity, which
          // nearly vanished on the light background
          <Button size="lg" variant="outline" disabled className="text-muted-foreground disabled:opacity-100">
            <DownloadIcon />
            {dict.comingSoon}
          </Button>
        )}
      </div>
      <h2 className="mt-8 mb-2 font-medium tracking-tight">{dict.links}</h2>
      <ul className="flex flex-col gap-1.5 text-neutral-800 dark:text-neutral-300">
        <li>
          <Link className={linkClass} href={localizePath(privacyPath(slug), locale)}>
            {dict.privacy}
          </Link>
        </li>
        {tool.eulaUpdatedAt && (
          <li>
            <Link className={linkClass} href={localizePath(eulaPath(slug), locale)}>
              {dict.eula}
            </Link>
          </li>
        )}
        <li>
          <Link className={linkClass} href={localizePath("/terms", locale)}>
            {dict.terms}
          </Link>
        </li>
        <li>
          {dict.support}:{" "}
          <a className={linkClass} href={`mailto:${business.email}`}>
            {business.email}
          </a>
        </li>
      </ul>

      {!tool.storeUrl && tool.manualBuild ? (
        <ToolTabs
          labels={dict.tabs}
          about={about}
          install={
            <article className="prose">
              <h2>{dict.manual.title}</h2>
              <CustomMDX
                source={readContent(slug, "install", locale)}
                components={{
                  DownloadBuild: ({ browser }: { browser: "chromium" | "firefox" }) => (
                    <DownloadBuild tool={tool} locale={locale} browser={browser} />
                  ),
                }}
              />
            </article>
          }
        />
      ) : (
        about
      )}
    </section>
  );
}

// --- /tool/<slug>/privacy ---------------------------------------------------

export function toolPrivacyMetadata(slug: string, locale: Locale): Metadata | undefined {
  const tool = getTool(slug);
  if (!tool) {
    return;
  }
  const dict = getDictionary(locale).tools;
  const name = tool.text[locale].name;
  const title = dict.privacyTitle(name);
  const description = dict.privacyDescription(name);
  const alternates = pageAlternates(privacyPath(slug), locale);
  return {
    title,
    description,
    alternates,
    openGraph: { ...baseOpenGraph(locale), title, description, url: alternates.canonical },
  };
}

export function ToolPrivacyPage({ slug, locale }: { slug: string; locale: Locale }) {
  const tool = findTool(slug);
  const dict = getDictionary(locale);
  const name = tool.text[locale].name;

  return (
    <section>
      <h1 className="title font-semibold text-2xl tracking-tighter">
        {dict.tools.privacyTitle(name)}
      </h1>
      <p className="mt-2 mb-8 text-sm text-neutral-600 dark:text-neutral-400">
        <Link className={linkClass} href={localizePath(toolPath(slug), locale)}>
          {name}
        </Link>{" "}
        · {dict.legal.updated}:{" "}
        <time dateTime={tool.privacyUpdatedAt}>
          {formatDate(tool.privacyUpdatedAt, false, locale)}
        </time>
      </p>
      <article className="prose">
        <CustomMDX source={readContent(slug, "privacy", locale)} />
      </article>
    </section>
  );
}

// --- /tool/<slug>/eula ------------------------------------------------------

export function toolEulaMetadata(slug: string, locale: Locale): Metadata | undefined {
  const tool = getTool(slug);
  if (!tool?.eulaUpdatedAt) {
    return;
  }
  const dict = getDictionary(locale).tools;
  const name = tool.text[locale].name;
  const title = dict.eulaTitle(name);
  const description = dict.eulaDescription(name);
  const alternates = pageAlternates(eulaPath(slug), locale);
  return {
    title,
    description,
    alternates,
    openGraph: { ...baseOpenGraph(locale), title, description, url: alternates.canonical },
  };
}

export function ToolEulaPage({ slug, locale }: { slug: string; locale: Locale }) {
  const tool = findTool(slug);
  if (!tool.eulaUpdatedAt) {
    notFound();
  }
  const dict = getDictionary(locale);
  const name = tool.text[locale].name;

  return (
    <section>
      <h1 className="title font-semibold text-2xl tracking-tighter">
        {dict.tools.eulaTitle(name)}
      </h1>
      <p className="mt-2 mb-8 text-sm text-neutral-600 dark:text-neutral-400">
        <Link className={linkClass} href={localizePath(toolPath(slug), locale)}>
          {name}
        </Link>{" "}
        · {dict.legal.updated}:{" "}
        <time dateTime={tool.eulaUpdatedAt}>
          {formatDate(tool.eulaUpdatedAt, false, locale)}
        </time>
      </p>
      <article className="prose">
        <CustomMDX source={readContent(slug, "eula", locale)} />
      </article>
    </section>
  );
}
