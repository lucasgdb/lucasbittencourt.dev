"use client";

import { useRef } from "react";
import { BookOpenIcon, MonitorIcon, MoonIcon, SunIcon, type LucideIcon } from "lucide-react";
import { Button } from "app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "app/components/ui/dropdown-menu";
import type { Dictionary } from "app/lib/i18n";
import { themeChoices, useSiteTheme, type ThemeChoice as Choice } from "app/components/use-site-theme";

const icons: Record<Choice, LucideIcon> = {
  system: MonitorIcon,
  light: SunIcon,
  sepia: BookOpenIcon,
  dark: MoonIcon,
  black: MoonIcon,
};

function Icon({ choice, size = 18, className = "" }: { choice: Choice; size?: number; className?: string }) {
  const Glyph = icons[choice];
  // Black: the dark theme's moon, filled
  return <Glyph aria-hidden="true" size={size} className={className} fill={choice === "black" ? "currentColor" : "none"} />;
}

// Which icon the button shows comes from <html>'s data-theme in CSS, so it's
// right from the first paint (React only knows the stored theme after mount)
const shownWhen: Record<Choice, string> = {
  system: "[:root:not([data-theme])_&]:block",
  light: "[[data-theme=light]_&]:block",
  sepia: "[[data-theme=sepia]_&]:block",
  dark: "[[data-theme=dark]_&]:block",
  black: "[[data-theme=black]_&]:block",
};

/** The site's theme: system (light or dark, as the OS), light, sepia, dark or black */
export function ThemeSelect({ labels }: { labels: Dictionary["theme"] }) {
  const [choice, choose] = useSiteTheme();
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    // Not modal: a modal menu locks the page's scroll (hiding the scrollbar)
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button ref={trigger} variant="ghost" size="icon" aria-label={labels.label} className="m-1 text-muted-foreground">
          {themeChoices.map((option) => (
            <Icon key={option} choice={option} className={`hidden ${shownWhen[option]}`} />
          ))}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-40"
        // Focus goes back to the button, without scrolling: it's in the sticky
        // header, which the browser would otherwise scroll up to "show"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          trigger.current?.focus({ preventScroll: true });
        }}
      >
        <DropdownMenuLabel>{labels.label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={choice} onValueChange={(value) => choose(value as Choice)}>
          {themeChoices.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              <Icon choice={option} size={16} className="text-muted-foreground" />
              {labels[option]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
