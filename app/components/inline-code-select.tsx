"use client";

import { useEffect } from "react";

/**
 * Triple-clicking inline code (`like this`) selects just that code, not the
 * whole paragraph, so it's easy to copy. Code blocks keep the native
 * behavior (a triple-click selects the line).
 */
export function InlineCodeSelect() {
  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (event.detail !== 3 || event.button !== 0) {
        return;
      }
      const code = (event.target as Element).closest?.("code");
      if (!code || code.closest("pre")) {
        return;
      }
      // Instead of the paragraph the browser would select
      event.preventDefault();
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return null;
}
