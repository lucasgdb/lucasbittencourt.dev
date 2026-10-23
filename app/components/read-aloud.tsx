"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Dictionary } from "app/lib/i18n";
import { Dropdown } from "app/components/dropdown";
import { scrollToElement } from "app/components/hash-anchor";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { setReadAloudCommands, setReadAloudState } from "app/components/read-aloud-store";

type Labels = Dictionary["post"]["readAloud"];

/** A passage read as one unit: highlighted and scrolled to while it's spoken */
type Segment = { element: Element; chunks: string[] };

const rates = [0.75, 1, 1.25, 1.5, 1.75, 2];
const storage = {
  rate: "read-aloud:rate",
  voice: (lang: string) => `read-aloud:voice:${lang}`,
};
// The post's own table of contents isn't worth hearing
const tocIds = new Set(["table-of-contents", "sumario"]);

function load(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function save(key: string, value: string | null) {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {}
}

function visibleText(element: Element) {
  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll('[aria-hidden="true"], .anchor, button').forEach((node) => node.remove());
  return (clone.textContent ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Splits a passage into sentences of a reasonable size: some voices (Chrome's
 * online ones) stop speaking long utterances partway.
 */
function toChunks(text: string, lang: string) {
  const sentences =
    typeof Intl.Segmenter === "function"
      ? [...new Intl.Segmenter(lang, { granularity: "sentence" }).segment(text)].map((s) => s.segment)
      : text.split(/(?<=[.!?:;])\s+/);
  const chunks: string[] = [];
  for (const sentence of sentences) {
    const last = chunks.at(-1);
    if (last && last.length + sentence.length < 160) {
      chunks[chunks.length - 1] = `${last} ${sentence.trim()}`;
    } else if (sentence.trim()) {
      chunks.push(sentence.trim());
    }
  }
  return chunks;
}

function collectSegments(title: string, article: Element, lang: string, codeBlock: string) {
  const segments: Segment[] = [];
  const heading = document.querySelector("h1");
  if (heading) {
    segments.push({ element: heading, chunks: [title] });
  }
  const readable = "h2, h3, h4, p, li, .code-block";
  const taken: Element[] = [];
  for (const element of article.querySelectorAll(readable)) {
    if (element.closest("[hidden]") || taken.some((parent) => parent.contains(element))) {
      continue;
    }
    // The post's own sections (one per h2), not the page's wrapper
    const section = element.closest("article.post > section");
    if (section && tocIds.has(section.querySelector("h2")?.id ?? "")) {
      continue;
    }
    const text = element.matches(".code-block") ? codeBlock : visibleText(element);
    if (!text) {
      continue;
    }
    taken.push(element);
    segments.push({ element, chunks: toChunks(text, lang) });
  }
  return segments;
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: string) {
  const saved = load(storage.voice(lang));
  const base = lang.split("-")[0].toLowerCase();
  const matching = voices.filter((voice) => voice.lang.toLowerCase().replace("_", "-").startsWith(base));
  const exact = matching.filter((voice) => voice.lang.toLowerCase().replace("_", "-") === lang.toLowerCase());
  const pool = exact.length > 0 ? exact : matching;
  return (
    pool.find((voice) => voice.name === saved) ??
    pool.find((voice) => /natural|neural|premium|enhanced|google/i.test(voice.name)) ??
    pool.find((voice) => voice.default) ??
    pool[0] ??
    null
  );
}

/**
 * "Listen" button for a post: reads it aloud with the browser's own speech
 * synthesis, passage by passage, highlighting and scrolling to each one.
 * Hidden where the browser can't speak.
 */
export function ReadAloud({ title, labels }: { title: string; labels: Labels }) {
  const [supported, setSupported] = useState(false);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [following, setFollowing] = useState(false);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  // Where the reading stopped, while on the page (a reload starts over)
  const [savedPosition, setSavedPosition] = useState(0);
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  const segments = useRef<Segment[]>([]);
  const run = useRef(0);
  // Chrome may garbage-collect an utterance mid-speech (and never fire onend)
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const followingRef = useRef(false);
  const lang = useRef("en");

  useEffect(() => {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      return;
    }
    lang.current = document.documentElement.lang || "en";
    const savedRate = Number(load(storage.rate));
    if (rates.includes(savedRate)) {
      setRate(savedRate);
    }

    const loadVoices = () => {
      const all = speechSynthesis.getVoices();
      // Some browsers have the API but no voice installed: nothing would play
      setSupported(all.length > 0);
      const base = lang.current.split("-")[0].toLowerCase();
      setVoices(all.filter((v) => v.lang.toLowerCase().startsWith(base)));
      setVoice((current) => current ?? pickVoice(all, lang.current));
    };
    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);

    const stop = () => speechSynthesis.cancel();
    window.addEventListener("pagehide", stop);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.removeEventListener("pagehide", stop);
      run.current++;
      speechSynthesis.cancel();
      document.querySelector(".read-aloud-current")?.classList.remove("read-aloud-current");
      document.documentElement.classList.remove("read-aloud-open");
    };
  }, []);

  const highlight = useCallback((element: Element | null) => {
    document.querySelector(".read-aloud-current")?.classList.remove("read-aloud-current");
    if (!element) {
      return;
    }
    element.classList.add("read-aloud-current");
    // Only when following (turned on by starting or resuming playback)
    if (followingRef.current) {
      scrollToElement(element);
    }
  }, []);

  const speak = useCallback(
    (segmentIndex: number, chunkIndex = 0) => {
      const current = ++run.current;
      speechSynthesis.cancel();
      const segment = segments.current[segmentIndex];
      if (!segment) {
        // Finished: next time, start from the top
        setPlaying(false);
        setIndex(0);
        setSavedPosition(0);
        highlight(null);
        return;
      }
      setIndex(segmentIndex);
      setPlaying(true);
      if (chunkIndex === 0) {
        highlight(segment.element);
      }

      const next = new SpeechSynthesisUtterance(segment.chunks[chunkIndex]);
      next.lang = voice?.lang ?? lang.current;
      next.rate = rate;
      if (voice) {
        next.voice = voice;
      }
      next.onend = () => {
        if (run.current !== current) {
          return;
        }
        if (chunkIndex + 1 < segment.chunks.length) {
          speak(segmentIndex, chunkIndex + 1);
        } else {
          speak(segmentIndex + 1);
        }
      };
      next.onerror = (event) => {
        // "interrupted"/"canceled" come from our own cancel()
        if (run.current !== current || event.error === "interrupted" || event.error === "canceled") {
          return;
        }
        speak(segmentIndex + 1);
      };
      utterance.current = next;
      speechSynthesis.speak(next);
    },
    [highlight, rate, voice]
  );

  // Pause = stop and remember the passage: native pause()/resume() is broken
  // in Chrome (long pauses) and on Android
  const pause = useCallback(() => {
    run.current++;
    speechSynthesis.cancel();
    setPlaying(false);
  }, []);

  /** Opens the player (reading the post's passages) if it isn't open yet */
  function ensureOpen() {
    if (open && segments.current.length > 0) {
      return true;
    }
    const article = document.querySelector("article.post");
    if (!article) {
      return false;
    }
    segments.current = collectSegments(title, article, lang.current, labels.codeBlock);
    setTotal(segments.current.length);
    setOpen(true);
    document.documentElement.classList.add("read-aloud-open");
    return segments.current.length > 0;
  }

  /** Starting or resuming always follows the reading (scrolling to it) */
  function play(segmentIndex: number) {
    followingRef.current = true;
    setFollowing(true);
    speak(segmentIndex);
  }

  function start() {
    if (ensureOpen()) {
      play(Math.min(savedPosition, segments.current.length - 1));
    }
  }

  /** From a section's title on, whatever was playing */
  function playFrom(heading: Element) {
    if (!ensureOpen()) {
      return;
    }
    // The title itself, or else the first passage after it
    const from = segments.current.findIndex(
      (segment) =>
        segment.element === heading ||
        Boolean(heading.compareDocumentPosition(segment.element) & Node.DOCUMENT_POSITION_FOLLOWING)
    );
    play(from === -1 ? 0 : from);
  }

  function close() {
    pause();
    highlight(null);
    setOpen(false);
    document.documentElement.classList.remove("read-aloud-open");
    setSavedPosition(index);
  }

  // Scrolling by hand stops following the reading
  useEffect(() => {
    if (!open) {
      return;
    }
    const stopFollowing = () => {
      if (followingRef.current) {
        followingRef.current = false;
        setFollowing(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) {
        // Keys used inside the player (or any control) aren't page scrolling
        const target = event.target as Element | null;
        if (!target?.closest?.('input, select, textarea, button, [role="listbox"], [role="region"]')) {
          stopFollowing();
        }
      }
    };
    window.addEventListener("wheel", stopFollowing, { passive: true });
    window.addEventListener("touchmove", stopFollowing, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", stopFollowing);
      window.removeEventListener("touchmove", stopFollowing);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggleFollow() {
    const next = !followingRef.current;
    followingRef.current = next;
    setFollowing(next);
    const current = segments.current[index]?.element;
    if (next && current) {
      scrollToElement(current);
    }
  }

  // A new speed or voice applies from the current passage
  const restartWith = useRef(false);
  useEffect(() => {
    if (restartWith.current && playing) {
      speak(index);
    }
    restartWith.current = false;
  }, [rate, voice]);

  // The section being read: named in the player, and its title's button
  // shows "pause"
  const readingElement = open ? segments.current[index]?.element : undefined;
  const readingSection = readingElement?.closest("article.post > section") ?? null;
  const readingTitle = readingSection?.querySelector("h2")
    ? visibleText(readingSection.querySelector("h2")!)
    : title;

  const mainAction = open ? (playing ? pause : () => play(index)) : start;
  const mainLabel = open
    ? playing
      ? labels.pause
      : index > 0
        ? labels.resume
        : labels.listen
    : savedPosition > 0
      ? labels.resume
      : labels.listen;

  const commands = useRef({ pause, playFrom });
  useEffect(() => {
    commands.current = { pause, playFrom };
    setReadAloudState({
      available: supported,
      open,
      playing: open && playing,
      section: readingSection,
      labels: { fromHere: labels.fromHere, pause: labels.pause },
    });
  });
  useEffect(() => {
    setReadAloudCommands({
      pause: () => commands.current.pause(),
      playFrom: (heading) => commands.current.playFrom(heading),
    });
    return () => {
      setReadAloudCommands(null);
      setReadAloudState({
        available: false,
        open: false,
        playing: false,
        section: null,
        labels: { fromHere: "", pause: "" },
      });
    };
  }, []);

  if (!supported) {
    return null;
  }

  const button =
    "inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";
  const progress = total > 0 ? ((index + 1) / total) * 100 : 0;

  return (
    <MotionConfig reducedMotion="user">
      <button
        type="button"
        onClick={mainAction}
        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1 text-sm text-neutral-700 shadow-xs transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
      >
        <Icon name={open && playing ? "pause" : "headphones"} />
        {mainLabel}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="player"
            role="region"
            aria-label={labels.player}
            initial={{ y: "140%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "140%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="fixed inset-x-0 bottom-3 z-50 mx-auto w-[calc(100%-1.5rem)] max-w-2xl sm:bottom-5"
          >
            {/* A glow when it first appears, so it isn't missed */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-1 rounded-[1.1rem] bg-yellow-400/40 blur-md dark:bg-yellow-300/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0, 0.8, 0] }}
              transition={{ duration: 2, delay: 0.25, ease: "easeInOut" }}
            />
            <div className="relative rounded-2xl border border-neutral-200 bg-background/90 shadow-[0_8px_30px_rgb(0_0_0/0.12)] backdrop-blur-md dark:border-neutral-800 dark:shadow-[0_8px_30px_rgb(0_0_0/0.6)]">
              {/* Inset from the rounded corners: the card can't clip (its menus open outside it) */}
              <div className="absolute inset-x-4 top-0 h-0.5 overflow-hidden rounded-full bg-neutral-200/70 dark:bg-neutral-800">
                <motion.div
                  className="h-full rounded-full bg-neutral-900 dark:bg-neutral-100"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>

              <div className="flex items-center gap-1 px-2 pt-2 pb-1.5 sm:gap-1.5 sm:px-3">
                <button type="button" className={`${button} max-[420px]:hidden`} onClick={() => speak(0)} aria-label={labels.restart} title={labels.restart}>
                  <Icon name="restart" />
                </button>
                <button
                  type="button"
                  className={button}
                  onClick={() => speak(Math.max(index - 1, 0))}
                  disabled={index === 0}
                  aria-label={labels.previous}
                  title={labels.previous}
                >
                  <Icon name="previous" />
                </button>
                <button
                  type="button"
                  className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-neutral-900 text-neutral-50 shadow-sm transition-[background-color,transform] hover:bg-neutral-700 active:scale-95 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
                  onClick={playing ? pause : () => play(index)}
                  aria-label={playing ? labels.pause : labels.play}
                  title={playing ? labels.pause : labels.play}
                >
                  <Icon name={playing ? "pause" : "play"} />
                </button>
                <button
                  type="button"
                  className={button}
                  onClick={() => speak(index + 1)}
                  disabled={index >= total - 1}
                  aria-label={labels.next}
                  title={labels.next}
                >
                  <Icon name="next" />
                </button>

                <div className="mx-1 flex min-w-0 flex-1 flex-col overflow-hidden leading-tight sm:mx-2">
                  <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] max-sm:hidden font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                    <span className={`size-1.5 shrink-0 rounded-full ${playing ? "animate-pulse bg-red-500" : "bg-neutral-400 dark:bg-neutral-600"}`} />
                    <span className="max-sm:hidden">{labels.nowReading} ·</span>
                    <span className="font-normal tabular-nums normal-case">
                      {Math.min(index + 1, total)}/{total}
                    </span>
                  </span>
                  <span className="truncate text-sm text-neutral-900 max-sm:hidden dark:text-neutral-100">{readingTitle}</span>
                </div>

                <button
                  type="button"
                  className={`${button} max-sm:hidden ${following ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100" : ""}`}
                  onClick={toggleFollow}
                  aria-pressed={following}
                  aria-label={labels.follow}
                  title={labels.follow}
                >
                  <Icon name="follow" />
                </button>
                <Dropdown
                  label={labels.speed}
                  value={rate}
                  className="shrink-0"
                  options={rates.map((value) => ({ value, label: `${value}×` }))}
                  onChange={(value) => {
                    save(storage.rate, String(value));
                    restartWith.current = true;
                    setRate(value);
                  }}
                />
                {voices.length > 1 && (
                  <Dropdown
                    label={labels.voice}
                    value={voice?.name ?? ""}
                    icon={<Icon name="voice" size={14} />}
                    className="shrink-0 md:max-w-44"
                    labelClassName="max-md:hidden"
                    options={voices.map((v) => ({ value: v.name, label: v.name }))}
                    onChange={(name) => {
                      const chosen = voices.find((v) => v.name === name) ?? null;
                      save(storage.voice(lang.current), chosen?.name ?? null);
                      restartWith.current = true;
                      setVoice(chosen);
                    }}
                  />
                )}
                <button type="button" className={button} onClick={close} aria-label={labels.close} title={labels.close}>
                  <Icon name="close" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

const paths: Record<string, ReactNode> = {
  headphones: <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />,
  play: <path d="M6 4l14 8-14 8z" />,
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </>
  ),
  previous: <path d="M19 20 9 12l10-8zM5 19V5" />,
  next: <path d="m5 4 10 8-10 8zM19 5v14" />,
  restart: (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  follow: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  close: <path d="M18 6 6 18M6 6l12 12" />,
  voice: (
    <>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
    </>
  ),
};

const filled = new Set(["play", "pause"]);

function Icon({ name, size = 16 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled.has(name) ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
