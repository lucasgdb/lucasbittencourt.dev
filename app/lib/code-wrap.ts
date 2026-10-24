// Line wrapping for code blocks, like VS Code's: wrapped lines keep their
// line's indentation and break after or before characters that make sense
// in code, cutting a token in the middle only when it's wider than the line.
// Nothing changes while lines don't wrap (the default).

// The characters VS Code breaks after (editor.wordWrapBreakAfterCharacters,
// besides spaces, which already break) and before
const breakAfter = new Set([",", ".", ";", "/", "|", "&", "?", ")", "]", "}"]);
const breakBefore = new Set(["(", "[", "{", "+"]);

const entities: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

/** Break opportunities (<wbr>, which adds no text) in the text of highlighted HTML */
function addBreaks(text: string) {
  return text.replace(/&[#\w]+;|[^&]/g, (unit) => {
    const char = entities[unit] ?? unit;
    return (breakBefore.has(char) ? "<wbr>" : "") + unit + (breakAfter.has(char) ? "<wbr>" : "");
  });
}

/** Indentation width of a line, in characters (a tab counts as 2) */
function indent(line: string) {
  const leading = /^[ \t]*/.exec(line)?.[0] ?? "";
  return [...leading].reduce((width, char) => width + (char === "\t" ? 2 : 1), 0);
}

/**
 * Prepares sugar-high's HTML for wrapping: each line gets its indentation as
 * `--indent` (the hanging indent of its wrapped lines) and its text gets the
 * break opportunities
 */
export function wrappable(html: string, source: string) {
  const lines = source.split("\n");
  let index = 0;
  return html
    .replace(/<span class="sh__line">/g, () => {
      const width = indent(lines[index++] ?? "");
      return width ? `<span class="sh__line" style="--indent:${width}ch">` : '<span class="sh__line">';
    })
    .replace(/>([^<]+)</g, (_, text: string) => `>${addBreaks(text)}<`);
}
