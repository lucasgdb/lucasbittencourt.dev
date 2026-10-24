import { test } from "node:test";
import assert from "node:assert/strict";
import { highlight } from "sugar-high";
import { wrappable } from "../app/lib/code-wrap.ts";

const source = '{\n    "a": "x,y",\n\n  b(1) && c\n}';
const html = wrappable(highlight(source), source);
const text = (markup: string) =>
  markup.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

test("wrapping keeps the code's text", () => {
  assert.equal(text(html), source);
});

test("each line carries its indentation", () => {
  const lines = html.match(/<span class="sh__line"[^>]*>/g) ?? [];
  assert.deepEqual(
    lines.map((line) => /--indent:(\d+)ch/.exec(line)?.[1] ?? "0"),
    ["0", "4", "0", "2", "0"]
  );
});

test("lines break after commas and before parentheses, not inside entities", () => {
  assert.match(html, /,<wbr>/);
  assert.match(html, /<wbr>\(/);
  assert.match(html, /&amp;<wbr>/);
  assert.doesNotMatch(html, /&<wbr>amp;/);
});
