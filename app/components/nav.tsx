import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitch } from "./language-switch";
import { getDictionary, localizePath, type Locale } from "app/lib/i18n";

const navItems = ["home", "blog", "services", "mcp"] as const;
const navPaths = { home: "/", blog: "/blog", services: "/services", mcp: "/mcp" };

export function Navbar({
  locale,
  notFound = false,
}: {
  locale: Locale;
  notFound?: boolean;
}) {
  const dict = getDictionary(locale);

  return (
    <header className="site-header sticky top-0 z-40 mt-6 py-2 tracking-tight bg-background/80 backdrop-blur-md">
      <div className="max-w-xl mx-4 min-[38rem]:mx-auto px-2 md:px-0">
        <nav
          className="-ml-2 flex flex-row items-start relative"
          id="nav"
          aria-label={dict.nav.label}
        >
          <div className="flex flex-row space-x-0">
            {navItems.map((item) => {
              return (
                <Link
                  key={item}
                  href={localizePath(navPaths[item], locale)}
                  className="transition-colors hover:text-neutral-500 dark:hover:text-neutral-400 flex align-middle relative py-1 px-2 max-[400px]:px-1 m-1"
                >
                  {dict.nav[item]}
                </Link>
              );
            })}
          </div>
          <div className="ml-auto flex items-center">
            <LanguageSwitch locale={locale} notFound={notFound} />
            <ThemeToggle label={dict.themeToggle} />
          </div>
        </nav>
      </div>
    </header>
  );
}
