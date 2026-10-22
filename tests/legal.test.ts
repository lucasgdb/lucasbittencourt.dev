import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { locales } from "../app/lib/i18n.ts";
import { business } from "../app/lib/site.ts";
import { getTools } from "../app/tools/registry.ts";

const documents = ["terms", "privacy"] as const;
const read = (doc: string, locale: string) =>
  fs.readFileSync(path.join("app", "legal", `${doc}.${locale}.mdx`), "utf-8");

test("legal documents exist in every language with the business details", () => {
  for (const doc of documents) {
    for (const locale of locales) {
      const content = read(doc, locale);
      assert.ok(content.includes(business.cnpj), `${doc}.${locale}: CNPJ`);
      assert.ok(content.includes(business.legalName), `${doc}.${locale}: legal name`);
      assert.ok(content.includes(business.address), `${doc}.${locale}: address`);
      assert.ok(content.includes(`mailto:${business.email}`), `${doc}.${locale}: email`);
      assert.ok(content.includes(business.whatsappUrl), `${doc}.${locale}: WhatsApp`);
      assert.ok(content.includes(business.whatsapp), `${doc}.${locale}: WhatsApp number`);
    }
  }
});

test("translations have the same sections and link to each other", () => {
  const sections = (content: string) => content.match(/^#{2,3} /gm)?.length;
  for (const doc of documents) {
    assert.equal(sections(read(doc, "en")), sections(read(doc, "pt-br")), doc);
    assert.ok(read(doc, "en").includes(`(/pt-br/${doc})`), `${doc}: English points to the Portuguese version`);
  }
  assert.ok(read("terms", "pt-br").includes("(/pt-br/privacy)"));
  assert.ok(read("privacy", "pt-br").includes("(/pt-br/terms)"));
});

test("the WhatsApp link matches the displayed number", () => {
  assert.equal(
    business.whatsappUrl,
    `https://wa.me/${business.whatsapp.replace(/\D/g, "")}`
  );
});

const readTool = (slug: string, file: string, locale: string) =>
  fs.readFileSync(path.join("app", "tools", slug, `${file}.${locale}.mdx`), "utf-8");

test("every tool has a page and its own privacy policy in every language", () => {
  const sections = (content: string) => content.match(/^#{2,3} /gm)?.length;
  for (const { slug } of getTools()) {
    for (const locale of locales) {
      assert.ok(readTool(slug, "content", locale), `${slug}.${locale}: page`);
      const policy = readTool(slug, "privacy", locale);
      assert.ok(policy.includes(business.cnpj), `${slug}.${locale}: CNPJ`);
      assert.ok(policy.includes(business.legalName), `${slug}.${locale}: legal name`);
      assert.ok(policy.includes(`mailto:${business.email}`), `${slug}.${locale}: email`);
    }
    assert.equal(
      sections(readTool(slug, "privacy", "en")),
      sections(readTool(slug, "privacy", "pt-br")),
      `${slug}: same sections`
    );
    assert.ok(
      readTool(slug, "privacy", "en").includes(`(/pt-br/tool/${slug}/privacy)`),
      `${slug}: English points to the Portuguese version`
    );
  }
});

test("every tool with an EULA has it in every language, with the same sections", () => {
  const sections = (content: string) => content.match(/^## .*/gm)?.length;
  const withEula = getTools().filter((tool) => tool.eulaUpdatedAt);
  assert.ok(withEula.some((tool) => tool.slug === "video-downloader"));
  for (const { slug } of withEula) {
    for (const locale of locales) {
      const eula = readTool(slug, "eula", locale);
      assert.ok(eula.includes(business.cnpj), `${slug}.${locale}: CNPJ`);
      assert.ok(eula.includes(business.legalName), `${slug}.${locale}: legal name`);
    }
    assert.equal(
      sections(readTool(slug, "eula", "en")),
      sections(readTool(slug, "eula", "pt-br")),
      `${slug}: same sections`
    );
    assert.ok(
      readTool(slug, "eula", "en").includes(`(/pt-br/tool/${slug}/eula)`),
      `${slug}: English points to the Portuguese version`
    );
  }
});

test("the site's privacy policy points to each tool's own policy", () => {
  for (const { slug } of getTools()) {
    assert.ok(read("privacy", "en").includes(`(/tool/${slug}/privacy)`), slug);
    assert.ok(read("privacy", "pt-br").includes(`(/pt-br/tool/${slug}/privacy)`), slug);
  }
});

test("AI Summarizer credit packs: R$5 to R$100, bonus of 10%, 15% and 20% (as in ai-summarizer-api)", async () => {
  const { getTool } = await import("../app/tools/registry.ts");
  const packs = getTool("ai-summarizer")!.creditPacks!;

  assert.deepEqual(packs.map((pack) => pack.priceBRL), [5, 10, 50, 100]);
  assert.deepEqual(packs.map((pack) => pack.bonus / pack.credits), [0, 0.1, 0.15, 0.2]);
  for (const pack of packs) {
    assert.equal(pack.credits, pack.priceBRL * 100, "R$ 0.01 per credit");
  }
  for (const locale of locales) {
    const page = fs.readFileSync(path.join("app", "tools", "ai-summarizer", `content.${locale}.mdx`), "utf-8");
    assert.ok(page.includes("<CreditPacks />"), locale);
  }
});

test("Video Downloader: lifetime license priced in the registry, shown by the page and covered by the terms", async () => {
  const { getTool } = await import("../app/tools/registry.ts");
  const tool = getTool("video-downloader")!;

  assert.ok(tool.lifetimeLicense && tool.lifetimeLicense.priceBRL > 0);
  assert.equal(tool.creditPacks, undefined, "a license, not credits");
  for (const locale of locales) {
    const page = fs.readFileSync(path.join("app", "tools", "video-downloader", `content.${locale}.mdx`), "utf-8");
    assert.ok(page.includes("<LifetimePrice />"), `${locale}: price comes from the registry`);
    assert.ok(read("terms", locale).includes("Video Downloader Premium"), `${locale}: terms`);
  }
});
