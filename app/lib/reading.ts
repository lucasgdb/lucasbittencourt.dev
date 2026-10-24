// Reading preferences for posts (font, size, width, line spacing; the theme is
// the whole site's, see app/lib/theme.ts),
// applied as data-reading-* attributes on <html> and read by global.css.
// No Next.js imports, so `node --test` can import it.

export const readingOptions = {
  font: ["sans", "serif", "legible"],
  size: ["1", "2", "3", "4", "5"],
  width: ["narrow", "medium", "wide"],
  spacing: ["compact", "normal", "relaxed"],
  /** The reading progress bar at the top of the page */
  progress: ["on", "off"],
} as const;

export type ReadingSettings = {
  [Key in keyof typeof readingOptions]: (typeof readingOptions)[Key][number];
};

export const defaultReading: ReadingSettings = {
  font: "sans",
  size: "3",
  width: "medium",
  spacing: "normal",
  progress: "on",
};

export const readingStorageKey = "reading";

export function parseReading(raw: string | null): ReadingSettings {
  let stored: Record<string, unknown> = {};
  try {
    stored = raw ? JSON.parse(raw) : {};
  } catch {}
  const settings = { ...defaultReading };
  for (const key of Object.keys(readingOptions) as (keyof ReadingSettings)[]) {
    const value = stored[key];
    if ((readingOptions[key] as readonly unknown[]).includes(value)) {
      (settings as Record<string, unknown>)[key] = value;
    }
  }
  return settings;
}

/** Sets (or, with null, removes) the attributes on <html> */
export function applyReading(settings: ReadingSettings | null, root = document.documentElement) {
  for (const key of Object.keys(readingOptions) as (keyof ReadingSettings)[]) {
    const name = `data-reading-${key}`;
    // Defaults are the site's own look: no attribute needed
    if (settings && settings[key] !== defaultReading[key]) {
      root.setAttribute(name, settings[key]);
    } else {
      root.removeAttribute(name);
    }
  }
}

/** A post's path: /blog/<slug> or /<locale>/blog/<slug> */
export const postPathPattern = /^\/(?:[a-z-]+\/)?blog\/[^/]+\/?$/;

/**
 * Runs in <head> (root layout) before the first paint, on posts only, so a
 * reader's font or size doesn't flash in after the default. Plain JS
 * (the same logic as parseReading + applyReading): minified functions can't
 * be inlined.
 */
export const readingScript = `(() => {
  try {
    if (!${postPathPattern.toString()}.test(location.pathname)) return;
    const options = ${JSON.stringify(readingOptions)};
    const defaults = ${JSON.stringify(defaultReading)};
    const stored = JSON.parse(localStorage.getItem(${JSON.stringify(readingStorageKey)}) || "{}");
    for (const key in options) {
      const value = stored[key];
      if (options[key].includes(value) && value !== defaults[key]) {
        document.documentElement.setAttribute("data-reading-" + key, value);
      }
    }
  } catch {}
})();`;
