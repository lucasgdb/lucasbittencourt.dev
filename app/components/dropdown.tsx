"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type Option<T> = { value: T; label: ReactNode; text?: string };

/**
 * A select styled like the rest of the site, in the spirit of shadcn/ui's
 * (the native popup ignores the theme). Follows the ARIA listbox pattern:
 * arrows, Home/End, Enter, Escape and typing the first letter.
 */
export function Dropdown<T extends string | number>({
  label,
  value,
  options,
  onChange,
  icon,
  className = "",
  labelClassName = "",
  placement = "top",
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  icon?: ReactNode;
  className?: string;
  /** e.g. hide the selected label on small screens, keeping the icon */
  labelClassName?: string;
  placement?: "top" | "bottom";
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0
  );
  const selected = options[selectedIndex];
  const text = (option: Option<T>) => String(option.text ?? option.label).toLowerCase();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    list.current?.focus();
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  useEffect(() => {
    if (open) {
      list.current
        ?.querySelector(`[data-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [active, open]);

  function show() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function choose(index: number) {
    onChange(options[index].value);
    setOpen(false);
    trigger.current?.focus();
  }

  function onTriggerKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      show();
    }
  }

  function onListKey(event: KeyboardEvent<HTMLUListElement>) {
    const last = options.length - 1;
    if (event.key === "ArrowDown") {
      setActive((index) => Math.min(index + 1, last));
    } else if (event.key === "ArrowUp") {
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Home") {
      setActive(0);
    } else if (event.key === "End") {
      setActive(last);
    } else if (event.key === "Enter" || event.key === " ") {
      choose(active);
    } else if (event.key === "Escape" || event.key === "Tab") {
      setOpen(false);
      if (event.key === "Escape") {
        trigger.current?.focus();
      }
      return;
    } else if (event.key.length === 1) {
      const letter = event.key.toLowerCase();
      const after = options.findIndex((option, index) => index > active && text(option).startsWith(letter));
      const found = after !== -1 ? after : options.findIndex((option) => text(option).startsWith(letter));
      if (found !== -1) {
        setActive(found);
      }
    } else {
      return;
    }
    event.preventDefault();
  }

  const fromTop = placement === "top";

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={label}
        title={label}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onTriggerKey}
        className="flex h-8 w-full min-w-8 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-neutral-200 bg-background px-2 text-xs text-neutral-800 shadow-xs sm:gap-2 sm:px-2.5 outline-none transition-[color,box-shadow,background-color] hover:bg-neutral-100 focus-visible:border-neutral-400 focus-visible:ring-[3px] focus-visible:ring-neutral-400/30 aria-expanded:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-900 dark:focus-visible:border-neutral-600 dark:focus-visible:ring-neutral-500/30 dark:aria-expanded:bg-neutral-900"
      >
        {icon && <span className="shrink-0 text-neutral-500 dark:text-neutral-400">{icon}</span>}
        <span className={`min-w-0 flex-1 truncate text-center sm:text-left ${labelClassName}`}>{selected?.label}</span>
        {/* Up-down chevrons, as in shadcn/ui's select */}
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 opacity-50 max-sm:hidden"
        >
          <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={list}
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            aria-activedescendant={`${id}-option-${active}`}
            tabIndex={-1}
            onKeyDown={onListKey}
            initial={{ opacity: 0, scale: 0.96, y: fromTop ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: fromTop ? 6 : -6 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            style={{ transformOrigin: fromTop ? "bottom right" : "top right" }}
            className={`absolute right-0 z-10 max-h-72 w-max min-w-[max(100%,8rem)] max-w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-md border border-neutral-200 bg-background p-1 text-neutral-800 shadow-md outline-none dark:border-neutral-800 dark:text-neutral-200 ${
              fromTop ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            <li role="presentation" className="px-2 py-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              {label}
            </li>
            {options.map((option, index) => (
              <li
                key={String(option.value)}
                id={`${id}-option-${index}`}
                data-index={index}
                role="option"
                aria-selected={index === selectedIndex}
                onPointerMove={() => setActive(index)}
                onClick={() => choose(index)}
                className={`relative flex cursor-pointer items-center rounded-sm py-1.5 pr-8 pl-2 text-sm select-none ${
                  index === active ? "bg-neutral-100 text-neutral-950 dark:bg-neutral-800 dark:text-neutral-50" : ""
                }`}
              >
                <span className="truncate">{option.label}</span>
                {index === selectedIndex && (
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="absolute right-2"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
