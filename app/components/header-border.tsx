"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * The header's bottom line follows the scroll (a scroll-driven animation, in
 * global.css). On a page that doesn't scroll, Chrome keeps the line as it was
 * on the previous page, so it's restarted on every navigation.
 */
export function HeaderBorder() {
  const pathname = usePathname();
  useEffect(() => {
    for (const header of document.querySelectorAll<HTMLElement>(".site-header")) {
      header.style.animation = "none";
      void header.offsetHeight;
      header.style.animation = "";
    }
  }, [pathname]);
  return null;
}
