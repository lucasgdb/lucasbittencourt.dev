"use client";

import Link from "next/link";
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
    <Link
      href={pathname ? switchLocalePath(pathname, target) : localizePath("/", target)}
      hrefLang={htmlLang}
      lang={htmlLang}
      aria-label={description}
      title={description}
      className="flex items-center justify-center h-8 min-w-8 px-1.5 m-1 rounded-md text-sm font-medium tracking-normal text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800/60 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500"
    >
      {label}
    </Link>
  );
}
