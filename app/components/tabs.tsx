"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";

type TabProps = {
  label: string;
  /** One or more space-separated values, e.g. "linux macos" for a tab shared by both */
  value: string;
  children: ReactNode;
};

// Rendered by <Tabs>, which reads its props
export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

const changeEvent = "tabs:change";
const storageKey = (group: string) => `tabs:${group}`;

function detectOs() {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = (nav.userAgentData?.platform || nav.platform || nav.userAgent).toLowerCase();
  if (platform.includes("win")) return "windows";
  if (platform.includes("mac")) return "macos";
  if (platform.includes("linux") || platform.includes("x11")) return "linux";
  return null;
}

function savedValue(group: string) {
  try {
    const value = localStorage.getItem(storageKey(group));
    if (value) return value;
  } catch {}
  return group === "os" ? detectOs() : null;
}

/**
 * Tabs that stay in sync across the page (and visits) by `group`, like
 * the npm / pnpm / yarn switchers in documentation sites.
 */
export function Tabs({ group = "os", children }: { group?: string; children: ReactNode }) {
  const tabs = Children.toArray(children).filter(isValidElement) as ReactElement<TabProps>[];
  const values = tabs.map((tab) => tab.props.value.split(" "));
  const [selected, setSelected] = useState(values[0][0]);
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const value = savedValue(group);
    if (value) {
      setSelected(value);
    }
    const onChange = (event: Event) => {
      const { detail } = event as CustomEvent<{ group: string; value: string }>;
      if (detail.group === group) {
        setSelected(detail.value);
      }
    };
    window.addEventListener(changeEvent, onChange);
    return () => window.removeEventListener(changeEvent, onChange);
  }, [group]);

  const found = values.findIndex((tabValues) => tabValues.includes(selected));
  const active = found === -1 ? 0 : found;

  function select(index: number) {
    const value = values[index][0];
    const button = tabRefs.current[index];
    // Other groups above may change height: keep the clicked tab where it is
    const top = button?.getBoundingClientRect().top;
    try {
      localStorage.setItem(storageKey(group), value);
    } catch {}
    window.dispatchEvent(new CustomEvent(changeEvent, { detail: { group, value } }));
    requestAnimationFrame(() => {
      if (button && top !== undefined) {
        window.scrollBy({ top: button.getBoundingClientRect().top - top, behavior: "instant" });
      }
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) {
      return;
    }
    event.preventDefault();
    select(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="tabs my-4">
      <div
        role="tablist"
        className="flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--header-border)]"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.props.value}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-selected={index === active}
            aria-controls={`${id}-panel-${index}`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => select(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`cursor-pointer whitespace-nowrap border-b-2 px-3 py-1.5 text-sm font-medium transition-colors ${
              index === active
                ? "border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.props.value}
          role="tabpanel"
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          hidden={index !== active}
          className="tab-panel"
        >
          {tab}
        </div>
      ))}
    </div>
  );
}
