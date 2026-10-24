"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import {
  HeadphonesIcon,
  LocateFixedIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SkipBackIcon,
  SkipForwardIcon,
  XIcon,
} from "lucide-react";
import type { Dictionary } from "app/lib/i18n";
import { Button } from "app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "app/components/ui/select";
import { Progress } from "app/components/ui/progress";
import { Toggle } from "app/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "app/components/ui/tooltip";
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
    // Hidden content, such as the tabs not chosen (OS-specific commands)
    const hidden = element.closest('[hidden], [role="tabpanel"][data-state="inactive"]');
    if (hidden || taken.some((parent) => parent.contains(element))) {
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
  // "checking" until the browser lists its voices (they load asynchronously)
  const [support, setSupport] = useState<"checking" | "unsupported" | "noVoices" | "ready">("checking");
  const supported = support === "ready";
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
      setSupport("unsupported");
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
      if (all.length > 0) {
        setSupport("ready");
      }
      const base = lang.current.split("-")[0].toLowerCase();
      setVoices(all.filter((v) => v.lang.toLowerCase().startsWith(base)));
      setVoice((current) => current ?? pickVoice(all, lang.current));
    };
    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    // Still no voices after a while: say so (a late "voiceschanged" still enables it)
    const noVoices = setTimeout(() => setSupport((current) => (current === "checking" ? "noVoices" : current)), 2000);

    const stop = () => speechSynthesis.cancel();
    window.addEventListener("pagehide", stop);
    return () => {
      clearTimeout(noVoices);
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

  const progress = total > 0 ? ((index + 1) / total) * 100 : 0;
  const unavailable = support === "checking" ? labels.checking : support === "unsupported" ? labels.unsupported : labels.noVoices;

  const mainButton = (
    <Button variant="outline" onClick={mainAction} disabled={!supported}>
      {open && playing ? <PauseIcon fill="currentColor" /> : <HeadphonesIcon />}
      {mainLabel}
    </Button>
  );

  return (
    <MotionConfig reducedMotion="user">
      {supported ? (
        mainButton
      ) : (
        // Disabled buttons get no pointer or focus events: the wrapper carries
        // the tooltip saying why (and is focusable, for keyboard users)
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-flex rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              {mainButton}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-64">{unavailable}</TooltipContent>
        </Tooltip>
      )}

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
            className="fixed inset-x-0 bottom-3 z-50 mx-auto w-[calc(100%-1.5rem)] max-w-(--column-width) sm:bottom-5"
          >
            {/* A glow when it first appears, so it isn't missed */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-1 rounded-[1.1rem] bg-yellow-400/40 blur-md dark:bg-yellow-300/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0, 0.8, 0] }}
              transition={{ duration: 2, delay: 0.25, ease: "easeInOut" }}
            />
            <div className="relative rounded-2xl border bg-popover/90 text-popover-foreground shadow-lg backdrop-blur-md">
              {/* Inset from the rounded corners: the card can't clip (its menus open outside it) */}
              <Progress
                value={progress}
                aria-label={labels.nowReading}
                className="absolute inset-x-4 top-0 h-0.5 w-auto"
              />

              <div className="flex items-center gap-1 px-2 pt-2 pb-1.5 sm:gap-1.5 sm:px-3">
                <IconButton label={labels.restart} onClick={() => speak(0)} className="max-[420px]:hidden">
                  <RotateCcwIcon />
                </IconButton>
                <IconButton label={labels.previous} onClick={() => speak(Math.max(index - 1, 0))} disabled={index === 0}>
                  <SkipBackIcon />
                </IconButton>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-lg"
                      className="rounded-full"
                      onClick={playing ? pause : () => play(index)}
                      aria-label={playing ? labels.pause : labels.play}
                    >
                      {playing ? <PauseIcon fill="currentColor" /> : <PlayIcon fill="currentColor" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{playing ? labels.pause : labels.play}</TooltipContent>
                </Tooltip>
                <IconButton label={labels.next} onClick={() => speak(index + 1)} disabled={index >= total - 1}>
                  <SkipForwardIcon />
                </IconButton>

                <div className="mx-1 flex min-w-0 flex-1 flex-col overflow-hidden leading-tight sm:mx-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide whitespace-nowrap text-muted-foreground uppercase max-sm:hidden">
                    <span className={`size-1.5 shrink-0 rounded-full ${playing ? "animate-pulse bg-red-500" : "bg-muted-foreground/50"}`} />
                    <span>{labels.nowReading} ·</span>
                    <span className="font-normal tabular-nums normal-case">
                      {Math.min(index + 1, total)}/{total}
                    </span>
                  </span>
                  <span className="truncate text-sm max-sm:hidden">{readingTitle}</span>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Toggle pressed={following} onPressedChange={toggleFollow} aria-label={labels.follow} className="max-sm:hidden">
                      <LocateFixedIcon />
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent>{labels.follow}</TooltipContent>
                </Tooltip>
                <Select
                  value={String(rate)}
                  onValueChange={(value) => {
                    save(storage.rate, value);
                    restartWith.current = true;
                    setRate(Number(value));
                  }}
                >
                  <SelectTrigger size="sm" aria-label={labels.speed} className="shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" side="top" align="end">
                    <SelectGroup>
                      <SelectLabel>{labels.speed}</SelectLabel>
                      {rates.map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          {value}×
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {voices.length > 1 && (
                  <Select
                    value={voice?.name ?? ""}
                    onValueChange={(name) => {
                      const chosen = voices.find((v) => v.name === name) ?? null;
                      save(storage.voice(lang.current), chosen?.name ?? null);
                      restartWith.current = true;
                      setVoice(chosen);
                    }}
                  >
                    <SelectTrigger size="sm" aria-label={labels.voice} className="shrink-0 md:max-w-44 [&>[data-slot=select-value]]:max-md:hidden">
                      <MicIcon />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" side="top" align="end" className="max-w-[min(20rem,calc(100vw-2rem))]">
                      <SelectGroup>
                        <SelectLabel>{labels.voice}</SelectLabel>
                        {voices.map((v) => (
                          <SelectItem key={v.name} value={v.name}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
                <IconButton label={labels.close} onClick={close}>
                  <XIcon />
                </IconButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

/** A ghost icon button with its name as a tooltip */
function IconButton({
  label,
  className,
  children,
  ...props
}: { label: string } & ComponentProps<typeof Button>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} className={className} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
