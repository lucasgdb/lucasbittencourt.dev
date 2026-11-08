import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { formatDate, getBlogPosts } from "../app/blog/utils.ts";
import {
  dictionaries,
  localizePath,
  locales,
  splitLocalePath,
  switchLocalePath,
} from "../app/lib/i18n.ts";
import { slugify } from "../app/lib/slugify.ts";

test("localized URLs: English keeps the original URLs, Portuguese uses /pt-br", () => {
  assert.equal(localizePath("/", "en"), "/");
  assert.equal(localizePath("/blog/x", "en"), "/blog/x");
  assert.equal(localizePath("/", "pt-br"), "/pt-br");
  assert.equal(localizePath("/blog/x", "pt-br"), "/pt-br/blog/x");

  assert.deepEqual(splitLocalePath("/pt-br"), { locale: "pt-br", path: "/" });
  assert.deepEqual(splitLocalePath("/pt-br/mcp"), { locale: "pt-br", path: "/mcp" });
  assert.deepEqual(splitLocalePath("/blog"), { locale: "en", path: "/blog" });
  assert.deepEqual(splitLocalePath("/pt-brazil"), { locale: "en", path: "/pt-brazil" });
});

test("the language switch links to the same page in the other language", () => {
  assert.equal(switchLocalePath("/", "pt-br"), "/pt-br");
  assert.equal(switchLocalePath("/blog/nodejs-event-loop", "pt-br"), "/pt-br/blog/nodejs-event-loop");
  assert.equal(switchLocalePath("/pt-br/blog/nodejs-event-loop", "en"), "/blog/nodejs-event-loop");
  assert.equal(switchLocalePath("/pt-br", "en"), "/");
  assert.equal(switchLocalePath("/pt-br/mcp", "en"), "/mcp");
});

test("dictionaries have the same keys in every language", () => {
  const shape = (value: unknown): unknown =>
    value && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value).map(([key, inner]) => [key, shape(inner)])
        )
      : typeof value;

  for (const locale of locales) {
    assert.deepEqual(shape(dictionaries[locale]), shape(dictionaries.en), locale);
  }
});

test("every post is translated, with the same dates and code", () => {
  const fences = (content: string) => content.match(/^```[\s\S]*?^```/gm) ?? [];
  const en = getBlogPosts("en");
  const pt = getBlogPosts("pt-br");

  assert.deepEqual(
    pt.map((post) => post.slug).toSorted(),
    en.map((post) => post.slug).toSorted()
  );
  for (const original of en) {
    const translation = pt.find((post) => post.slug === original.slug)!;
    assert.notEqual(translation.metadata.title, original.metadata.title, original.slug);
    assert.equal(translation.metadata.publishedAt, original.metadata.publishedAt);
    assert.equal(translation.metadata.updatedAt, original.metadata.updatedAt);
    assert.equal(translation.metadata.image, original.metadata.image);
    assert.deepEqual(fences(translation.content), fences(original.content), original.slug);
  }
});

test("every link to a section (#anchor) points to an existing heading", () => {
  const files = [
    ...locales.flatMap((locale) =>
      getBlogPosts(locale).map((post) => [`${locale}/${post.slug}`, post.content])
    ),
    ...["content.mdx", "content.pt-br.mdx"].map((file) => [
      `mcp/${file}`,
      fs.readFileSync(path.join("app", "mcp", file), "utf-8"),
    ]),
  ];

  for (const [name, content] of files) {
    const withoutCode = content.replace(/^```[\s\S]*?^```/gm, "");
    const headings = new Set(
      [...withoutCode.matchAll(/^#{2,6}\s+(.+)$/gm)].map((match) =>
        slugify(match[1].replace(/\\(.)/g, "$1"))
      )
    );
    const anchors = [...withoutCode.matchAll(/\]\(#([^)]+)\)/g)].map((match) => match[1]);

    assert.ok(anchors.length > 0, name);
    for (const anchor of anchors) {
      assert.ok(headings.has(anchor), `${name}: #${anchor}`);
    }
  }
});

test("slugify removes accents and keeps English anchors unchanged", () => {
  assert.equal(slugify("Introdução às funções"), "introducao-as-funcoes");
  assert.equal(slugify("Microtasks: process.nextTick and Promises"), "microtasks-processnexttick-and-promises");
});

test("dates are formatted in each language", () => {
  assert.equal(formatDate("2024-09-10", false, "en"), "September 10, 2024");
  assert.equal(formatDate("2024-09-10", false, "pt-br"), "10 de setembro de 2024");
  assert.match(formatDate("2020-01-01", true, "en"), /\(\d+ years ago\)$/);
  assert.match(formatDate("2020-01-01", true, "pt-br"), /\(há \d+ anos\)$/);
});
