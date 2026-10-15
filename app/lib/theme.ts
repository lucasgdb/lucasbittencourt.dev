// Theme preference shared by the inline script (applies it before the first
// paint, see app/layout.tsx) and the toggle button (changes it).
// Without a stored choice, the theme follows the operating system (CSS).

export type Theme = "light" | "dark";

export const themeStorageKey = "theme";

// Browser UI color (address bar on mobile), same as --background.
export const themeColors: Record<Theme, string> = {
  light: "#fafafa",
  dark: "#0a0a0a",
};

// The theme-color meta tags rendered by Next.js follow the system. An explicit
// choice goes in a separate tag, outside React, placed first in <head>:
// browsers use the first matching theme-color.
export const themeColorOverrideId = "theme-color-override";

// Runs synchronously while the HTML is parsed, so the page never paints with
// the wrong theme. Keep it tiny and dependency-free.
export const themeScript = `(function(){try{var t=localStorage.getItem("${themeStorageKey}");if(t!=="light"&&t!=="dark")return;document.documentElement.setAttribute("data-theme",t);var m=document.createElement("meta");m.name="theme-color";m.id="${themeColorOverrideId}";m.content=${JSON.stringify(themeColors)}[t];document.head.prepend(m)}catch(e){}})()`;
