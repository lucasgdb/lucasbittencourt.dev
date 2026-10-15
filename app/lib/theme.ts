export type Theme = "light" | "dark";

export const themeStorageKey = "theme";

export const themeColors: Record<Theme, string> = {
  light: "#fafafa",
  dark: "#0a0a0a",
};

// A tag outside React, first in <head> (browsers use the first theme-color):
// Next.js manages its own tags and resets them on navigation.
export const themeColorOverrideId = "theme-color-override";

export const themeScript = `(function(){try{var t=localStorage.getItem("${themeStorageKey}");if(t!=="light"&&t!=="dark")return;document.documentElement.setAttribute("data-theme",t);var m=document.createElement("meta");m.name="theme-color";m.id="${themeColorOverrideId}";m.content=${JSON.stringify(themeColors)}[t];document.head.prepend(m)}catch(e){}})()`;
