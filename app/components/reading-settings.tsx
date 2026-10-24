"use client";

import { useId, useLayoutEffect, useState, type CSSProperties } from "react";
import { CheckIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "app/components/ui/button";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "app/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "app/components/ui/popover";
import { Separator } from "app/components/ui/separator";
import { Slider } from "app/components/ui/slider";
import { Switch } from "app/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "app/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "app/components/ui/tooltip";
import type { Dictionary } from "app/lib/i18n";
import { themeChoices, useSiteTheme, type ThemeChoice } from "app/components/use-site-theme";
import {
  applyReading,
  defaultReading,
  parseReading,
  readingOptions,
  readingStorageKey,
  type ReadingSettings as Settings,
} from "app/lib/reading";

type Labels = Dictionary["post"]["reading"];

// Swatches of the site's themes ("system" is half light, half dark)
// (longhands: the "background" shorthand would reset bg-clip-padding)
const swatches: Record<ThemeChoice, CSSProperties> = {
  system: { backgroundImage: "linear-gradient(135deg, #fafafa 50%, #0a0a0a 50%)" },
  light: { backgroundColor: "#fafafa" },
  sepia: { backgroundColor: "#f9f5e9" },
  dark: { backgroundColor: "#262626" },
  black: { backgroundColor: "#000000" },
};

const fontFamilies: Record<Settings["font"], string> = {
  sans: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  serif: "var(--font-literata), Georgia, ui-serif, serif",
  legible: "var(--font-atkinson), ui-sans-serif, system-ui, sans-serif",
};

function save(settings: Settings) {
  try {
    localStorage.setItem(readingStorageKey, JSON.stringify(settings));
  } catch {}
}

/** A setting with a few steps (size, line spacing, width): a labeled slider
 * with the current value beside the label */
function StepSlider<Value extends string>({
  label,
  steps,
  value,
  valueText,
  onChange,
}: {
  label: string;
  steps: readonly Value[];
  value: Value;
  valueText: string;
  onChange: (value: Value) => void;
}) {
  const id = useId();
  const index = steps.indexOf(value);
  return (
    <Field>
      <div className="flex items-center justify-between">
        <FieldLabel id={id}>{label}</FieldLabel>
        <span className="text-sm text-muted-foreground tabular-nums">{valueText}</span>
      </div>
      <Slider
        aria-labelledby={id}
        aria-valuetext={valueText}
        min={0}
        max={steps.length - 1}
        step={1}
        value={[index]}
        onValueChange={([next]) => onChange(steps[next])}
      />
    </Field>
  );
}

const sizePx: Record<Settings["size"], number> = { "1": 15, "2": 16, "3": 18, "4": 20, "5": 22 };

/**
 * "Aa" button of a post: font, size, column width, line spacing and the
 * reading progress bar, like a browser's reader mode, saved in the browser
 * and applied while on posts; plus the site's theme (shared with the
 * header's select, for every page).
 */
export function ReadingSettings({
  labels,
  themeLabels,
}: {
  labels: Labels;
  themeLabels: Dictionary["theme"];
}) {
  // The site's theme (the same as the header's select), here for convenience
  const [theme, setTheme] = useSiteTheme();
  const [settings, setSettings] = useState<Settings>(defaultReading);
  const progressId = useId();

  // Applied before paint on client navigations (a full load already has them,
  // from the inline script in <head>), and removed when leaving the post
  useLayoutEffect(() => {
    let stored = defaultReading;
    try {
      stored = parseReading(localStorage.getItem(readingStorageKey));
    } catch {}
    setSettings(stored);
    applyReading(stored);
    return () => applyReading(null);
  }, []);

  function update(change: Partial<Settings>) {
    const next = { ...settings, ...change };
    setSettings(next);
    save(next);
    applyReading(next);
  }

  const isDefault = (Object.keys(defaultReading) as (keyof Settings)[]).every(
    (key) => settings[key] === defaultReading[key]
  );

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="outline" aria-label={labels.open} className="px-2.5">
              <span aria-hidden="true">
                A<span className="text-xs">a</span>
              </span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{labels.open}</TooltipContent>
      </Tooltip>

      <PopoverContent
        align="start"
        className="max-h-(--radix-popover-content-available-height) w-80 gap-4 overflow-y-auto p-4"
      >
        <PopoverHeader>
          <PopoverTitle>{labels.open}</PopoverTitle>
          <PopoverDescription>{labels.description}</PopoverDescription>
        </PopoverHeader>
        <Separator />
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel>{labels.font}</FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={2}
              value={settings.font}
              onValueChange={(font) => font && update({ font: font as Settings["font"] })}
              className="grid w-full grid-cols-3"
            >
              {readingOptions.font.map((font) => (
                <ToggleGroupItem key={font} value={font} className="h-auto flex-col gap-0.5 py-2">
                  <span aria-hidden="true" className="text-lg leading-tight" style={{ fontFamily: fontFamilies[font] }}>
                    Aa
                  </span>
                  <span className="text-xs font-normal">{labels.fonts[font]}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <StepSlider
            label={labels.size}
            steps={readingOptions.size}
            value={settings.size}
            valueText={`${sizePx[settings.size]}px`}
            onChange={(size) => update({ size })}
          />
          <StepSlider
            label={labels.spacing}
            steps={readingOptions.spacing}
            value={settings.spacing}
            valueText={{ compact: labels.compact, normal: labels.normal, relaxed: labels.relaxed }[settings.spacing]}
            onChange={(spacing) => update({ spacing })}
          />
          {/* On phones the column already takes the whole screen */}
          <div className="max-sm:hidden">
            <StepSlider
              label={labels.width}
              steps={readingOptions.width}
              value={settings.width}
              valueText={{ narrow: labels.narrow, medium: labels.medium, wide: labels.wide }[settings.width]}
              onChange={(width) => update({ width })}
            />
          </div>
        </FieldGroup>
        <Separator />
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor={progressId}>{labels.progress}</FieldLabel>
            <FieldDescription>{labels.progressHint}</FieldDescription>
          </FieldContent>
          <Switch
            id={progressId}
            checked={settings.progress === "on"}
            onCheckedChange={(checked) => update({ progress: checked ? "on" : "off" })}
          />
        </Field>
        <Separator />
        <Field>
          <FieldLabel>{themeLabels.label}</FieldLabel>
          <ToggleGroup
            type="single"
            value={theme}
            onValueChange={(choice) => choice && setTheme(choice as ThemeChoice)}
            className="flex w-full justify-between"
          >
            {themeChoices.map((choice) => (
              <ToggleGroupItem
                key={choice}
                value={choice}
                className="group/swatch h-auto flex-col gap-1 px-1 py-1 text-xs font-normal text-muted-foreground hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-foreground"
              >
                <span
                  aria-hidden="true"
                  style={swatches[choice]}
                  // bg-clip-padding: the background (the system one's gradient)
                  // stays inside the border instead of showing at its edge
                  className="flex size-9 items-center justify-center rounded-full border bg-clip-padding ring-offset-2 ring-offset-popover transition-shadow group-hover/swatch:ring-2 group-hover/swatch:ring-ring/40 group-data-[state=on]/swatch:ring-2 group-data-[state=on]/swatch:ring-primary"
                >
                  {theme === choice && (
                    <CheckIcon
                      className={choice === "system" ? "size-4 rounded-full bg-neutral-500 p-0.5" : "size-4"}
                      color={choice === "light" || choice === "sepia" ? "#171717" : "#fafafa"}
                      strokeWidth={3}
                    />
                  )}
                </span>
                {themeLabels[choice]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
        <Separator />
        <Button variant="outline" size="sm" disabled={isDefault} onClick={() => update({ ...defaultReading })}>
          <RotateCcwIcon />
          {labels.reset}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
