"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { Tabs as TabsRoot, TabsContent, TabsList, TabsTrigger } from "app/components/ui/tabs";

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

// The browser reading the page, for install guides (Opera, Edge and Vivaldi
// say so in the user agent; Brave only through navigator.brave)
function detectBrowser() {
  const agent = navigator.userAgent;
  if (/Firefox\//.test(agent)) return "firefox";
  if (/OPR\//.test(agent)) return "opera";
  if (/Edg\//.test(agent)) return "edge";
  if (/Vivaldi\//.test(agent)) return "vivaldi";
  if ("brave" in navigator) return "brave";
  if (/Chrome\//.test(agent)) return "chrome";
  return null;
}

function savedValue(group: string) {
  try {
    const value = localStorage.getItem(storageKey(group));
    if (value) return value;
  } catch {}
  if (group === "os") return detectOs();
  if (group === "browser") return detectBrowser();
  return null;
}

/**
 * Tabs that stay in sync across the page (and visits) by `group`, like
 * the npm / pnpm / yarn switchers in documentation sites.
 */
export function Tabs({ group = "os", children }: { group?: string; children: ReactNode }) {
  const tabs = Children.toArray(children).filter(isValidElement) as ReactElement<TabProps>[];
  const values = tabs.map((tab) => tab.props.value.split(" "));
  const [selected, setSelected] = useState(values[0][0]);
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

  return (
    <TabsRoot
      value={String(active)}
      onValueChange={(value) => select(Number(value))}
      className="tabs my-4"
    >
      <TabsList>
        {tabs.map((tab, index) => (
          <TabsTrigger
            key={tab.props.value}
            value={String(index)}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
          >
            {tab.props.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab, index) => (
        // Inactive panels stay in the page (search engines, reader modes),
        // just hidden; the read-aloud skips them
        <TabsContent
          key={tab.props.value}
          value={String(index)}
          forceMount
          // Inherits the text size (shadcn sets text-sm; posts have a reading size)
          className="tab-panel text-[length:inherit] data-[state=inactive]:hidden"
        >
          {tab}
        </TabsContent>
      ))}
    </TabsRoot>
  );
}
