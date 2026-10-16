import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { locales } from "../app/lib/i18n.ts";
import { business } from "../app/lib/site.ts";

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
