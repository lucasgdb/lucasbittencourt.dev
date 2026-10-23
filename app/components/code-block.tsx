"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactElement } from "react";

const labels = {
  en: { copy: "Copy code", copied: "Copied" },
  pt: { copy: "Copiar código", copied: "Copiado" },
};

function language(children: ComponentProps<"pre">["children"]) {
  const className = (children as ReactElement<{ className?: string }>)?.props?.className ?? "";
  return /language-(\S+)/.exec(className)?.[1];
}

export function CodeBlock({ children, style, ...props }: ComponentProps<"pre">) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const [dict, setDict] = useState(labels.en);
  useEffect(() => {
    if (document.documentElement.lang.startsWith("pt")) {
      setDict(labels.pt);
    }
  }, []);
  // Diagrams and folder trees aren't meant to be run
  const copyable = language(children) !== "text";

  async function copy() {
    const text = ref.current?.innerText.replace(/\n$/, "") ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const label = copied ? dict.copied : dict.copy;

  return (
    <div className="code-block group relative">
      {/* Inline padding: .prose pre's px-3 would beat a utility class */}
      <pre ref={ref} style={copyable ? { ...style, paddingRight: "2.75rem" } : style} {...props}>
        {children}
      </pre>
      {copyable && (
        <button
          type="button"
          onClick={copy}
          aria-label={label}
          title={label}
          className="absolute top-[7.5px] right-2 cursor-pointer rounded-md border border-neutral-200 bg-neutral-50 p-1 text-neutral-600 opacity-100 transition-opacity hover:text-neutral-900 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          {copied ? (
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
