"use client";

import { useLayoutEffect } from "react";
import {
  themeColorOverrideId,
  themeColors,
  themeStorageKey,
  type Theme,
} from "app/lib/theme";

function storedTheme(): Theme | null {
  try {
    const theme = localStorage.getItem(themeStorageKey);
    return theme === "light" || theme === "dark" ? theme : null;
  } catch {
    return null;
  }
}

function currentTheme(): Theme {
  const attribute = document.documentElement.getAttribute("data-theme");
  if (attribute === "light" || attribute === "dark") {
    return attribute;
  }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Switching themes changes the colors of the whole page at once. Elements with
// a color transition (e.g. links, for hover) would animate while the rest
// changes instantly, so transitions are disabled during the switch.
function withoutTransitions(change: () => void) {
  const style = document.createElement("style");
  style.textContent =
    "*,*::before,*::after{transition:none!important;animation-duration:0s!important}";
  document.head.appendChild(style);

  change();

  // Force the browser to apply the new colors before transitions come back
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

  // Browser UI color for an explicit choice (see app/lib/theme.ts)
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

function SunIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
    </svg>
  );
}

export function ThemeToggle() {
  useLayoutEffect(() => {
    // The inline script already applied the stored theme. This re-applies it
    // after React's development remount clears <html> attributes (no-op in
    // production).
    applyTheme(storedTheme());

    // Same choice in every open tab
    function onStorage(event: StorageEvent) {
      if (event.key === themeStorageKey) {
        withoutTransitions(() => applyTheme(storedTheme()));
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function toggle() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(themeStorageKey, next);
    } catch {
      // Private mode or blocked storage: the change still applies to this page
    }
    withoutTransitions(() => applyTheme(next));
  }

  // Both icons are rendered and CSS shows the right one, so the server HTML
  // matches the client (no hydration mismatch, no flash).
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="flex items-center justify-center size-8 m-1 rounded-md cursor-pointer text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800/60 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500"
    >
      <MoonIcon className="block dark:hidden" />
      <SunIcon className="hidden dark:block" />
    </button>
  );
}
