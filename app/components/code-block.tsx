"use client";

import { CheckIcon, CopyIcon, WrapTextIcon } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps, type ReactElement } from "react";
import { Button } from "app/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "app/components/ui/tooltip";

const labels = {
  en: { copy: "Copy code", copied: "Copied", wrap: "Wrap lines" },
  pt: { copy: "Copiar código", copied: "Copiado", wrap: "Quebrar linhas" },
};

const buttonClass =
  "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800";

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
  // Lines wrap only if the reader asks (off by default: code keeps its shape)
  const [wrap, setWrap] = useState(false);
  // The wrap button only shows on blocks with lines wider than the block
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const pre = ref.current;
    if (!pre || !copyable) {
      return;
    }
    const measure = () => {
      if (!wrap) {
        setOverflows(pre.scrollWidth > pre.clientWidth + 1);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pre);
    return () => observer.disconnect();
  }, [copyable, wrap]);
  const showWrap = copyable && (overflows || wrap);

  async function copy() {
    // The source text: while wrapping, the lines are stacked blocks and
    // innerText would drop the blank ones
    const text = ref.current?.textContent?.replace(/\n$/, "") ?? "";
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
      {/* Inline styles: .prose pre's px-3 would beat a utility class */}
      <pre
        ref={ref}
        style={{
          ...style,
          // While wrapping, only the first line makes room for the buttons
          // (global.css): the others can use the whole width
          ...(copyable && !wrap && { paddingRight: showWrap ? "4.5rem" : "2.75rem" }),
          ...(wrap && { whiteSpace: "pre-wrap", overflowWrap: "anywhere" }),
        }}
        data-wrap={wrap || undefined}
        {...props}
      >
        {children}
      </pre>
      {copyable && (
        // Opaque, in the block's color, with a fade on the left: code that
        // scrolls under the buttons fades out instead of showing through them
        // Also visible while one of their tooltips is open: the tooltip lives
        // outside the block, and the pointer may move onto it
        <div className="absolute top-[7.5px] right-2 flex gap-1 rounded-r-md bg-linear-to-r from-transparent to-neutral-100 to-[1.25rem] pl-6 opacity-100 dark:to-neutral-900 transition-opacity has-[:focus-visible]:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:has-[[data-state$=-open]]:opacity-100">
          {showWrap && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  onClick={() => setWrap((value) => !value)}
                  aria-label={dict.wrap}
                  aria-pressed={wrap}
                  className={`${buttonClass} aria-pressed:bg-neutral-200 aria-pressed:text-foreground dark:aria-pressed:bg-neutral-700`}
                >
                  <WrapTextIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{dict.wrap}</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={copy}
                aria-label={label}
                className={buttonClass}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
