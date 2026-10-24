"use client";

import Link from "next/link";
import { cn } from "cn";
import { buttonVariants } from "app/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "app/components/ui/tooltip";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getDictionary,
  localeConfig,
  localizePath,
  otherLocale,
  switchLocalePath,
  type Locale,
} from "app/lib/i18n";

// On the global 404 the server only sees /_not-found: render the other home page
// first (matching the server HTML) and switch to the real URL after mounting.
function useCurrentPath(notFound: boolean) {
  const routerPath = usePathname();
  const [browserPath, setBrowserPath] = useState<string | null>(null);

  useEffect(() => {
    if (notFound) {
      setBrowserPath(location.pathname);
    }
  }, [notFound]);

  return notFound ? browserPath : routerPath;
}

export function LanguageSwitch({
  locale,
  notFound = false,
}: {
  locale: Locale;
  notFound?: boolean;
}) {
  const pathname = useCurrentPath(notFound);
  const target = otherLocale(locale);
  const { htmlLang, label } = localeConfig[target];
  const description = getDictionary(target).languageSwitch;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={pathname ? switchLocalePath(pathname, target) : localizePath("/", target)}
          hrefLang={htmlLang}
          lang={htmlLang}
          aria-label={description}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "m-1 h-8 min-w-8 px-1.5 text-sm tracking-normal text-muted-foreground"
          )}
        >
          {label}
        </Link>
      </TooltipTrigger>
      <TooltipContent>{description}</TooltipContent>
    </Tooltip>
  );
}
