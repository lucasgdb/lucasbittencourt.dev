import fs from "fs";
import path from "path";
import { defaultLocale, localeConfig, type Locale } from "../lib/i18n.ts";

type Metadata = {
  title: string;
  publishedAt: string;
  updatedAt?: string;
  summary: string;
  image?: string;
};

export type Post = {
  metadata: Metadata;
  slug: string;
  content: string;
};

function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  const frontMatterBlock = match![1];
  const content = fileContent.replace(frontmatterRegex, "").trim();
  const frontMatterLines = frontMatterBlock.trim().split("\n");
  const metadata: Partial<Metadata> = {};

  frontMatterLines.forEach((line) => {
    const [key, ...valueArr] = line.split(": ");
    const value = valueArr
      .join(": ")
      .trim()
      .replace(/^['"](.*)['"]$/, "$1");
    metadata[key.trim() as keyof Metadata] = value;
  });

  return { metadata: metadata as Metadata, content };
}

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

function readMDXFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  return parseFrontmatter(rawContent);
}

function getMDXData(dir: string): Post[] {
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles.map((file) => {
    const { metadata, content } = readMDXFile(path.join(dir, file));
    const slug = path.basename(file, path.extname(file));

    return {
      metadata,
      slug,
      content,
    };
  });
}

function postsDir(locale: Locale) {
  const dir = path.join(process.cwd(), "app", "blog", "posts");
  return locale === defaultLocale ? dir : path.join(dir, locale);
}

export function getBlogPosts(locale: Locale = defaultLocale) {
  return getMDXData(postsDir(locale));
}

export function getSortedBlogPosts(locale: Locale = defaultLocale) {
  return getBlogPosts(locale).sort((a, b) =>
    b.metadata.publishedAt.localeCompare(a.metadata.publishedAt)
  );
}

export function getLastModified(post: Post) {
  return post.metadata.updatedAt ?? post.metadata.publishedAt;
}

const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
  ["second", 1],
];

function getTimeAgo(date: Date, locale: Locale) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const format = new Intl.RelativeTimeFormat(localeConfig[locale].intl, {
    numeric: "auto",
  });

  for (const [unit, value] of relativeUnits) {
    const interval = Math.floor(seconds / value);
    if (interval >= 1) {
      return format.format(-interval, unit);
    }
  }

  return format.format(0, "second");
}

export function formatDate(
  date: string,
  includeRelative = false,
  locale: Locale = defaultLocale
) {
  if (!date.includes("T")) {
    date = `${date}T00:00:00`;
  }

  const targetDate = new Date(date);

  const fullDate = targetDate.toLocaleString(localeConfig[locale].intl, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (!includeRelative) {
    return fullDate;
  }

  return `${fullDate} (${getTimeAgo(targetDate, locale)})`;
}
