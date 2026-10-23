"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared between the post's reader (ReadAloud) and the buttons in the section
 * titles, so both show the same state and control one player.
 */
export type ReadAloudState = {
  available: boolean;
  /** The player is active (started, playing or paused) */
  open: boolean;
  playing: boolean;
  /** The post section (h2 and its content) being read, if any */
  section: Element | null;
  labels: { fromHere: string; pause: string };
};

type Commands = { pause: () => void; playFrom: (heading: Element) => void };

const initial: ReadAloudState = {
  available: false,
  open: false,
  playing: false,
  section: null,
  labels: { fromHere: "", pause: "" },
};
let state = initial;
let commands: Commands | null = null;
const listeners = new Set<() => void>();

export function setReadAloudState(next: ReadAloudState) {
  if (
    next.available === state.available &&
    next.open === state.open &&
    next.playing === state.playing &&
    next.section === state.section &&
    next.labels.fromHere === state.labels.fromHere &&
    next.labels.pause === state.labels.pause
  ) {
    return;
  }
  state = next;
  listeners.forEach((listener) => listener());
}

export function setReadAloudCommands(next: Commands | null) {
  commands = next;
}

export function pauseReadAloud() {
  commands?.pause();
}

/** Reads from a section's title (or a subsection's) on, whatever is playing */
export function playReadAloudFrom(heading: Element) {
  commands?.playFrom(heading);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useReadAloudState() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => initial
  );
}
