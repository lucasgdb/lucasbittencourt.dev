"use client";

import { useEffect } from "react";

const gap = 16;

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
    return Math.max(top(element) - stuckAt - heading.offsetHeight - gap, sectionStart);
  }
  const header = document.querySelector(".site-header")?.getBoundingClientRect().height ?? 0;
  return top(element) - header - gap;
}

/**
 * Scrolls a post's element to the top of the reading area (see anchorTop):
 * used by anchors and by "follow the reading"
 */
export function scrollToElement(element: Element) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: anchorTop(element), behavior: reduced ? "instant" : "smooth" });

  // The stuck title can change height on the way (its subtitle changes, and
  // a long title may wrap): once there, correct the landing, unless the
  // reader has scrolled in the meantime
  let done = false;
  const cancel = () => finish(false);
  const correct = () => finish(true);
  const events = ["wheel", "touchstart", "keydown"] as const;
  function finish(apply: boolean) {
    if (done) {
      return;
    }
    done = true;
    window.removeEventListener("scrollend", correct);
    events.forEach((name) => window.removeEventListener(name, cancel));
    const top = anchorTop(element);
    if (apply && Math.abs(top - window.scrollY) > 1) {
      window.scrollTo({ top, behavior: "instant" });
    }
  }
  window.addEventListener("scrollend", correct, { once: true });
  events.forEach((name) => window.addEventListener(name, cancel, { passive: true, once: true }));
  // Browsers without scrollend
  setTimeout(correct, 1200);
}

/** Scrolls to an anchor in a post, and puts it in the URL */
export function goToAnchor(element: Element) {
  if (element.id && location.hash !== `#${element.id}`) {
    history.pushState(null, "", `#${element.id}`);
  }
  scrollToElement(element);
}

/**
 * Anchors in a post: links to sections (#...) land where they should (see
 * anchorTop), and a post opened or reloaded with a #anchor goes to it (on
 * reload, browsers restore the previous scroll position instead).
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
      if (!target || !target.closest("article.post")) {
        return;
      }
      event.preventDefault();
      goToAnchor(target);
    };
    document.addEventListener("click", onClick);

    const id = decodeURIComponent(location.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (!target) {
      return () => document.removeEventListener("click", onClick);
    }
    history.scrollRestoration = "manual";
    const jump = () => window.scrollTo({ top: anchorTop(target), behavior: "instant" });
    let frame = requestAnimationFrame(jump);

    // Again once fonts and late layout settle, unless the reader has moved on
    // (a later jump would cut short their own scrolling)
    let moved = false;
    const onMove = () => {
      moved = true;
      cancelAnimationFrame(frame);
    };
    const events = ["wheel", "touchstart", "keydown", "pointerdown", "hashchange"] as const;
    events.forEach((name) => window.addEventListener(name, onMove, { passive: true, once: true }));
    const settle = () => {
      if (!moved) {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(jump);
      }
    };
    if (document.readyState === "complete") {
      document.fonts.ready.then(settle);
    } else {
      window.addEventListener("load", settle, { once: true });
    }
    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(frame);
      window.removeEventListener("load", settle);
      events.forEach((name) => window.removeEventListener(name, onMove));
    };
  }, []);

  return null;
}
