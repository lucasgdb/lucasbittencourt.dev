"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps, type ReactElement } from "react";
import { Button } from "app/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "app/components/ui/tooltip";

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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={copy}
              aria-label={label}
              className="absolute top-[7.5px] right-2 opacity-100 transition-opacity focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
