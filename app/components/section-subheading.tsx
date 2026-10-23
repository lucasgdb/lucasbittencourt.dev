"use client";

import { useEffect, useRef, useState } from "react";
import { goToAnchor } from "app/components/hash-anchor";
import { pauseReadAloud, playReadAloudFrom, useReadAloudState } from "app/components/read-aloud-store";

type Shown = { text: string; direction: "down" | "up"; id: number };

/**
 * A subsection counts as current once its title is this close below the
 * stuck title: where a link to it lands (scroll-margin of .post h3) and where
 * reading it starts, not only after it slides under the title
 */
const currentBand = 48;

/**
 * Extras of a post's section title (h2): a toggle to read the post aloud
 * from this section, and, while the title is stuck, the subsection (h3)
 * being read, which slides out and in as it changes.
 */
export function SectionSubheading() {
  const ref = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState<Shown | null>(null);
  const [previous, setPrevious] = useState<Shown | null>(null);
  // The subsection shown, where "listen from here" starts (else the title)
  const currentSubheading = useRef<Element | null>(null);

  useEffect(() => {
    const heading = ref.current?.closest("h2");
    const section = heading?.parentElement;
    if (!heading || !section || getComputedStyle(heading).position !== "sticky") {
      return;
    }
    const subheadings = [...section.querySelectorAll("h3")];

    let frame = 0;
    let shownIndex = -1;
    let shown: Shown | null = null;
    let id = 0;

    const update = () => {
      frame = 0;
      const box = heading.getBoundingClientRect();
      const stuckAt = parseFloat(getComputedStyle(heading).top);
      // Exactly at its sticky offset: above it, it's being pushed out by the
      // next section (or already gone)
      const isStuck =
        Math.abs(box.top - stuckAt) < 1 && section.getBoundingClientRect().bottom - box.bottom > 1;

      let index = -1;
      if (isStuck) {
        subheadings.forEach((subheading, i) => {
          if (subheading.getBoundingClientRect().top <= box.bottom + currentBand) {
            index = i;
          }
        });
      }
      currentSubheading.current = index === -1 ? null : subheadings[index];
      if (index === shownIndex) {
        return;
      }
      const direction: Shown["direction"] = index > shownIndex ? "down" : "up";
      const next =
        index === -1 ? null : { text: subheadings[index].textContent ?? "", direction, id: ++id };
      setPrevious(shown && { ...shown, direction, id: ++id });
      setCurrent(next);
      shown = next;
      shownIndex = index;
    };
    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };

    // Clicking the title goes to its section; clicking the subtitle, to that
    // subsection (the URL gets its #anchor, as with the table of contents)
    const goTo = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest("button")) {
        return;
      }
      const subheading = target.closest(".section-subheading") ? currentSubheading.current : null;
      goToAnchor(subheading ?? heading);
    };
    heading.addEventListener("click", goTo);

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      heading.removeEventListener("click", goTo);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <span ref={ref} className="section-extras">
      {/* Hidden from assistive tech: the heading's name stays the section's title */}
      <span aria-hidden="true" className="section-subheading">
        {previous && (
          <span
            key={previous.id}
            className={`out-${previous.direction}`}
            onAnimationEnd={() => setPrevious(null)}
          >
            {previous.text}
          </span>
        )}
        {current && (
          <span key={current.id} className={`in-${current.direction}`}>
            {current.text}
          </span>
        )}
      </span>
      <ReadAloudToggle startAt={() => currentSubheading.current} />
    </span>
  );
}

/**
 * A section title's read-aloud button:
 * - headphones while nothing has been started;
 * - ▶ "listen from here" once the player is active;
 * - ⏸ on the section being read, which pauses it.
 */
function ReadAloudToggle({ startAt }: { startAt: () => Element | null }) {
  const { available, open, playing, section, labels } = useReadAloudState();
  const ref = useRef<HTMLButtonElement>(null);
  const [ownSection, setOwnSection] = useState<Element | null>(null);
  useEffect(() => {
    setOwnSection(ref.current?.closest("section") ?? null);
  }, [available]);
  // The table of contents isn't read aloud
  const isToc = ["table-of-contents", "sumario"].includes(ownSection?.querySelector("h2")?.id ?? "");
  if (!available || isToc) {
    return null;
  }
  const reading = playing && section !== null && section === ownSection;
  const icon = reading ? "pause" : open ? "play" : "headphones";
  const label = reading ? labels.pause : labels.fromHere;
  return (
    <button
      ref={ref}
      type="button"
      onClick={(event) => {
        const heading = event.currentTarget.closest("h2");
        if (reading) {
          pauseReadAloud();
        } else if (heading) {
          playReadAloudFrom(startAt() ?? heading);
        }
      }}
      aria-label={label}
      className="group/toggle relative inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-200/70 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/70 dark:hover:text-neutral-100"
    >
      <svg
        aria-hidden="true"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill={icon === "headphones" ? "none" : "currentColor"}
        stroke={icon === "headphones" ? "currentColor" : "none"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon === "pause" ? (
          <>
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </>
        ) : icon === "play" ? (
          <path d="M7 4.5v15l12-7.5z" />
        ) : (
          <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
        )}
      </svg>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-full right-0 mt-2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs font-normal tracking-normal text-neutral-50 opacity-0 shadow-md transition-opacity group-hover/toggle:opacity-100 group-focus-visible/toggle:opacity-100 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {label}
      </span>
    </button>
  );
}
