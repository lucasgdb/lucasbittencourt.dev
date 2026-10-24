"use client";

import { useLayoutEffect, useState } from "react";
import { themeColorOverrideId, themeColors, themes, themeStorageKey, type Theme } from "app/lib/theme";

/** A theme, or "system": light or dark, as the OS */
export type ThemeChoice = Theme | "system";

export const themeChoices: ThemeChoice[] = ["system", ...themes];

const changeEvent = "site-theme";

function storedTheme(): Theme | null {
  try {
    const theme = localStorage.getItem(themeStorageKey);
    return (themes as readonly string[]).includes(theme ?? "") ? (theme as Theme) : null;
  } catch {
    return null;
  }
}

// Hover transitions would animate some colors while the rest of the page
// switches instantly.
function withoutTransitions(change: () => void) {
  const style = document.createElement("style");
  style.textContent =
    "*,*::before,*::after{transition:none!important;animation-duration:0s!important}";
  document.head.appendChild(style);

  change();

  // Apply the new colors before transitions come back
  void getComputedStyle(document.body).color;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => style.remove());
  });
}

function applyTheme(theme: Theme | null) {
  const root = document.documentElement;
  if (theme) {
    root.setAttribute("data-theme", theme);
  } else {
    root.removeAttribute("data-theme");
  }

  let meta = document.getElementById(themeColorOverrideId) as HTMLMetaElement | null;
  if (!theme) {
    meta?.remove();
    return;
  }
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.id = themeColorOverrideId;
    document.head.prepend(meta);
  }
  meta.content = themeColors[theme];
}

/** Saves and applies the site's theme; every useSiteTheme() follows */
export function setSiteTheme(choice: ThemeChoice) {
  const theme = choice === "system" ? null : choice;
  try {
    if (theme) {
      localStorage.setItem(themeStorageKey, theme);
    } else {
      localStorage.removeItem(themeStorageKey);
    }
  } catch {}
  const change = () => {
    withoutTransitions(() => applyTheme(theme));
    window.dispatchEvent(new CustomEvent(changeEvent));
  };

  // A cross-fade between the old and new theme (.theme-fade in global.css):
  // the browser fades two snapshots of the page, so it's smooth however long
  // the page is. At once with reduced motion, or without view transitions
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduced) {
    change();
    return;
  }
  const root = document.documentElement;
  root.classList.add("theme-fade");
  document.startViewTransition(change).finished.finally(() => root.classList.remove("theme-fade"));
}

/**
 * The site's theme, kept in sync between the header's select, a post's
 * reading settings and other tabs
 */
export function useSiteTheme(): [ThemeChoice, (choice: ThemeChoice) => void] {
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useLayoutEffect(() => {
    // Re-applies the theme after React's dev remount clears <html> attributes
    const stored = storedTheme();
    applyTheme(stored);
    setChoice(stored ?? "system");

    const sync = () => setChoice(storedTheme() ?? "system");
    function onStorage(event: StorageEvent) {
      if (event.key === themeStorageKey) {
        const next = storedTheme();
        setChoice(next ?? "system");
        withoutTransitions(() => applyTheme(next));
      }
    }
    window.addEventListener(changeEvent, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(changeEvent, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return [choice, setSiteTheme];
}
