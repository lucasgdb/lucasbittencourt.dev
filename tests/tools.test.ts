import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getTools } from "../app/tools/registry.ts";

test("each manual build is in /public, with the size and checksum the page shows", () => {
  for (const tool of getTools()) {
    for (const build of Object.values(tool.manualBuild?.files ?? {})) {
      const file = readFileSync(path.join("public", build.file));
      assert.equal(file.length, build.bytes, build.file);
      assert.equal(createHash("sha256").update(file).digest("hex"), build.sha256, build.file);
    }
  }
});

test("each tool with a manual build has the install guide in every language", () => {
  for (const tool of getTools().filter((tool) => tool.manualBuild)) {
    for (const locale of ["en", "pt-br"]) {
      const guide = readFileSync(path.join("app/tools", tool.slug, `install.${locale}.mdx`), "utf-8");
      for (const browser of Object.keys(tool.manualBuild!.files)) {
        assert.match(guide, new RegExp(`<DownloadBuild browser="${browser}"`), `${tool.slug} ${locale} ${browser}`);
      }
    }
  }
});
