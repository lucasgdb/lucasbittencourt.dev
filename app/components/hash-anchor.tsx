"use client";

import { useEffect } from "react";

const gap = 16;
// The subtitle's slide animation (see .section-subheading), plus a margin
const subtitleSettle = 260;

// The last navigation's correction still waiting to run (see scrollToElement)
let cancelPending: (() => void) | null = null;

/**
 * Where an anchor in a post should land, given the sticky header and section
 * titles: a section title (h2) where its section starts, anything else right
 * below its stuck section title, but never above where that section starts
 * (the title would unstick, taking its subtitle with it)
 */
function anchorTop(element: Element) {
  const top = (node: Element) => node.getBoundingClientRect().top + window.scrollY;
  const section = element.closest("article.post > section");
  const heading = section?.querySelector("h2");
  if (section && heading && getComputedStyle(heading).position === "sticky") {
    const stuckAt = parseFloat(getComputedStyle(heading).top) || 0;
    const sectionStart = top(section) - stuckAt;
    if (element === heading) {
      return sectionStart;
    }
    // Its own top margin below the title (24px for a subsection): the room it
    // naturally has, so the first subsection lands exactly where it sits when
    // going to its section, and switching between the two doesn't scroll
    const room = Math.max(parseFloat(getComputedStyle(element).marginTop) || 0, gap);
    return Math.max(top(element) - stuckAt - heading.offsetHeight - room, sectionStart);
  }
  const header = document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;
  return top(element) - header - gap;
}

/**
 * Scrolls a post's element to the top of the reading area (see anchorTop):
 * used by anchors and by "follow the reading"
 */
export function scrollToElement(element: Element) {
  // A newer navigation replaces the previous one's pending correction
  cancelPending?.();
  cancelPending = null;

  const target = anchorTop(element);
  if (Math.abs(target - window.scrollY) < 1) {
    // Already there: no scroll (and so no scrollend to wait for)
    return;
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: target, behavior: reduced ? "instant" : "smooth" });

  // Stuck titles change height on the way (a long title wraps while its
  // subtitle shows), moving what's below: once the scroll ends and the
  // subtitles settle, correct the landing, unless the reader has scrolled
  let done = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => finish(false);
  const settled = () => {
    timer = setTimeout(() => finish(true), subtitleSettle);
  };
  const events = ["wheel", "touchstart", "keydown"] as const;
  function finish(apply: boolean) {
    if (done) {
      return;
    }
    done = true;
    clearTimeout(timer);
    window.removeEventListener("scrollend", settled);
    events.forEach((name) => window.removeEventListener(name, cancel));
    if (cancelPending === cancel) {
      cancelPending = null;
    }
    const top = anchorTop(element);
    if (apply && Math.abs(top - window.scrollY) > 1) {
      window.scrollTo({ top, behavior: "instant" });
    }
  }
  cancelPending = cancel;
  events.forEach((name) => window.addEventListener(name, cancel, { passive: true, once: true }));
  if ("onscrollend" in window) {
    window.addEventListener("scrollend", settled, { once: true });
  } else {
    // Without scrollend, a generous guess of when a long smooth scroll ends
    timer = setTimeout(() => finish(true), 2000);
  }
}


/** Scrolls to an anchor in a post, and puts it in the URL */
export function goToAnchor(element: Element) {
  if (element.id && location.hash !== `#${element.id}`) {
    history.pushState(null, "", `#${element.id}`);
  }
  scrollToElement(element);
}

/**
 * In-page links (#...), on any page: a smooth scroll that lands where it
 * should (see anchorTop), with the #anchor in the URL. Reloading is left to
 * the browser, which goes straight back to where the reader was (the page
 * has no CSS smooth scrolling, which would animate that too).
 */
export function HashAnchor() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const link = (event.target as Element).closest?.('a[href^="#"]');
      const id = link ? decodeURIComponent(link.getAttribute("href")!.slice(1)) : "";
      const target = id ? document.getElementById(id) : null;
      if (!target) {
        return;
      }
      event.preventDefault();
      goToAnchor(target);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
