/** The site's themes; none (no data-theme) follows the system's light/dark */
export const themes = ["light", "sepia", "dark", "black"] as const;

export type Theme = (typeof themes)[number];

export const themeStorageKey = "theme";

export const themeColors: Record<Theme, string> = {
  light: "#fafafa",
  sepia: "#f9f5e9",
  dark: "#0a0a0a",
  black: "#000000",
};

// A tag outside React, first in <head> (browsers use the first theme-color):
// Next.js manages its own tags and resets them on navigation.
export const themeColorOverrideId = "theme-color-override";

export const themeScript = `(function(){try{var t=localStorage.getItem("${themeStorageKey}");var c=${JSON.stringify(themeColors)};if(!c.hasOwnProperty(t))return;document.documentElement.setAttribute("data-theme",t);var m=document.createElement("meta");m.name="theme-color";m.id="${themeColorOverrideId}";m.content=c[t];document.head.prepend(m)}catch(e){}})()`;
