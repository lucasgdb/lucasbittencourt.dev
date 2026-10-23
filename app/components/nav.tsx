import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitch } from "./language-switch";
import { getDictionary, localizePath, type Locale } from "app/lib/i18n";

const navItems = ["home", "blog", "tools", "services", "mcp"] as const;
const navPaths = {
  home: "/",
  blog: "/blog",
  tools: "/tools",
  services: "/services",
  mcp: "/mcp",
};

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
      <div className="max-w-2xl mx-4 min-[44rem]:mx-auto px-2 md:px-0">
        <nav
          className="-ml-2 flex flex-row items-start relative"
          id="nav"
          aria-label={dict.nav.label}
        >
          {/* Five links don't fit beside the language and theme buttons on
              narrow phones (especially in Portuguese): the links scroll
              sideways, fading at the edge to show there's more, the buttons
              stay put, and the page never scrolls */}
          <div className="flex min-w-0 flex-row space-x-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[440px]:[mask-image:linear-gradient(to_right,black_85%,transparent)]">
            {navItems.map((item) => {
              return (
                <Link
                  key={item}
                  href={localizePath(navPaths[item], locale)}
                  className="transition-colors hover:text-neutral-500 dark:hover:text-neutral-400 flex shrink-0 align-middle relative py-1 px-2 max-[400px]:px-1 m-1 max-[400px]:mx-0.5"
                >
                  {dict.nav[item]}
                </Link>
              );
            })}
          </div>
          <div className="ml-auto flex shrink-0 items-center">
            <LanguageSwitch locale={locale} notFound={notFound} />
            <ThemeToggle label={dict.themeToggle} />
          </div>
        </nav>
      </div>
    </header>
  );
}
