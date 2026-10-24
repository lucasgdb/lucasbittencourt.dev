"use client";

import { useForm } from "@tanstack/react-form";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query";
import Link from "next/link";
import { CircleAlertIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "app/components/ui/button";
import { Alert, AlertDescription } from "app/components/ui/alert";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "app/components/ui/field";
import { Spinner } from "app/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "app/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "app/components/ui/radio-group";
import { Textarea } from "app/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "app/components/ui/toggle-group";
import { localizePath, type Locale } from "app/lib/i18n";
import { uninstallSurveys } from "app/tools/uninstall-surveys";
import {
  emptyForm,
  type FeedbackForm,
  maxCommentLength,
  ratings,
  type Survey,
  wouldUseAgainValues,
} from "app/tools/uninstall-survey";

const linkClass =
  "underline underline-offset-2 decoration-neutral-500 transition-colors hover:text-neutral-800 dark:hover:text-neutral-100";

// A chosen option of a scale/choice is filled, so it stands out. By
// aria-checked: a Tooltip around an option replaces its data-state with its own
const choiceClass =
  "min-w-9 px-3 aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground";

/** Sends one answer; resolves only once the API says it's stored (201) */
async function send({ survey, payload }: { survey: Survey; payload: unknown }) {
  const response = await fetch(survey.feedbackEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (response.status !== 201) {
    throw new Error(`Feedback not stored (HTTP ${response.status})`);
  }
}

/** The survey, with its own query client: nothing else on the site needs one */
export function UninstallSurvey({ slug, locale }: { slug: string; locale: Locale }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({ defaultOptions: { mutations: { retry: false } } }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <UninstallForm survey={uninstallSurveys[slug]} locale={locale} />
    </QueryClientProvider>
  );
}

function UninstallForm({ survey, locale }: { survey: Survey; locale: Locale }) {
  const text = survey.text[locale];
  const id = useId();
  // One send at a time: no cache, no retries behind the user's back
  const mutation = useMutation({ mutationFn: send });
  // Set at once on submit: clicks in the same instant, before the button
  // re-renders as disabled, don't send again
  const sending = useRef(false);
  const schema = survey.formSchema(locale);

  const form = useForm({
    defaultValues: emptyForm as FeedbackForm,
    // The Zod schema checks on submit, then on every change, so an error
    // clears as soon as it's fixed (shown only once a field is touched,
    // which submitting does to all of them)
    validators: { onSubmit: schema, onChange: schema },
    onSubmit: async ({ value }) => {
      // Built and checked again right before sending
      await mutation
        .mutateAsync({
          survey,
          payload: survey.toPayload(value, locale, window.location.search),
        })
        .catch(() => {
          // Shown below the button; the answers stay as they are
        });
    },
  });

  if (mutation.isSuccess) {
    return <Thanks text={text} locale={locale} />;
  }

  return (
    <form
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (sending.current) return;
        sending.current = true;
        try {
          await form.handleSubmit();
        } finally {
          sending.current = false;
        }
      }}
    >
      <FieldGroup className="gap-10">
        <form.Field name="reason">
          {(field) => {
            const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <FieldSet data-invalid={invalid}>
                <FieldLegend>{text.reasonLegend}</FieldLegend>
                <RadioGroup
                  name={field.name}
                  value={field.state.value}
                  onValueChange={(reason) => field.handleChange(reason as typeof field.state.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={invalid || undefined}
                  className="gap-3"
                >
                  {survey.reasons.map((reason) => (
                    <Field key={reason} orientation="horizontal" data-invalid={invalid}>
                      <RadioGroupItem id={`${id}-reason-${reason}`} value={reason} aria-invalid={invalid || undefined} />
                      <FieldLabel htmlFor={`${id}-reason-${reason}`} className="font-normal">
                        {text.reasons[reason]}
                      </FieldLabel>
                    </Field>
                  ))}
                </RadioGroup>
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </FieldSet>
            );
          }}
        </form.Field>

        <form.Field name="comment">
          {(field) => {
            const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor={`${id}-comment`}>{text.commentLabel}</FieldLabel>
                <FieldDescription id={`${id}-comment-hint`}>{text.commentHint}</FieldDescription>
                <Textarea
                  id={`${id}-comment`}
                  name={field.name}
                  rows={4}
                  maxLength={maxCommentLength}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  aria-describedby={`${id}-comment-hint ${id}-comment-count`}
                  aria-invalid={invalid || undefined}
                  className="resize-y"
                />
                <div className="flex justify-between gap-4">
                  <FieldError errors={invalid ? field.state.meta.errors : undefined} />
                  <span id={`${id}-comment-count`} className="ml-auto shrink-0 text-sm text-muted-foreground tabular-nums">
                    {field.state.value.length}/{maxCommentLength}
                  </span>
                </div>
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="rating">
          {(field) => (
            <FieldSet>
              <FieldLegend>
                {text.ratingLegend} <span className="text-sm font-normal text-muted-foreground">{text.optional}</span>
              </FieldLegend>
              {/* The scale's ends under the first and last option */}
              <div className="flex flex-wrap items-start gap-2">
                <div className="inline-flex flex-col">
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="lg"
                    spacing={2}
                    value={field.state.value === null ? "" : String(field.state.value)}
                    onValueChange={(value) => field.handleChange(value ? (Number(value) as typeof field.state.value) : null)}
                  >
                    {ratings.map((value) => {
                      const label = text.ratingLabels[value - 1] ?? "";
                      return (
                        <Tooltip key={value}>
                          <TooltipTrigger asChild>
                            <ToggleGroupItem value={String(value)} aria-label={text.ratingAria(value, label)} className={choiceClass}>
                              {value}
                            </ToggleGroupItem>
                          </TooltipTrigger>
                          <TooltipContent>{label}</TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </ToggleGroup>
                  <p className="mt-2 flex justify-between gap-4 text-sm text-muted-foreground" aria-hidden="true">
                    <span>{text.ratingLabels[0]}</span>
                    <span>{text.ratingLabels[4]}</span>
                  </p>
                </div>
                {field.state.value !== null && (
                  <span className="flex h-9 items-center">
                    <ClearButton onClick={() => field.handleChange(null)}>{text.clear}</ClearButton>
                  </span>
                )}
              </div>
            </FieldSet>
          )}
        </form.Field>

        <form.Field name="wouldUseAgain">
          {(field) => (
            <FieldSet>
              <FieldLegend>
                {text.againLegend} <span className="text-sm font-normal text-muted-foreground">{text.optional}</span>
              </FieldLegend>
              <div className="flex flex-wrap items-center gap-2">
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="lg"
                  spacing={2}
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                  className="flex-wrap"
                >
                  {wouldUseAgainValues.map((value) => (
                    <ToggleGroupItem key={value} value={value} className={choiceClass}>
                      {text.again[value]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                {field.state.value !== "" && <ClearButton onClick={() => field.handleChange("")}>{text.clear}</ClearButton>}
              </div>
            </FieldSet>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => {
            const busy = isSubmitting || mutation.isPending;
            return (
              <div className="space-y-4">
                <Button type="submit" size="lg" disabled={busy} aria-busy={busy} className="w-full px-4 sm:w-auto">
                  {busy && <Spinner />}
                  {busy ? text.sending : text.submit}
                </Button>
                {mutation.isError && !busy && (
                  <Alert variant="destructive">
                    <CircleAlertIcon />
                    <AlertDescription>{text.errors.send}</AlertDescription>
                  </Alert>
                )}
              </div>
            );
          }}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}

function ClearButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button type="button" variant="link" size="sm" onClick={onClick} className="text-muted-foreground">
      {children}
    </Button>
  );
}

/** In the form's place, once the API confirmed the answer is stored */
function Thanks({ text, locale }: { text: Survey["text"][Locale]; locale: Locale }) {
  const heading = useRef<HTMLHeadingElement>(null);
  // Screen readers and keyboards land on the result, not on a vanished button
  useEffect(() => heading.current?.focus(), []);
  return (
    <div role="status" className="space-y-2">
      <h2
        ref={heading}
        tabIndex={-1}
        className="font-semibold text-xl tracking-tighter text-neutral-900 outline-none dark:text-neutral-100"
      >
        {text.successTitle}
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400">{text.successBody}</p>
      <p className="pt-4 text-sm">
        <Link href={localizePath("/tools", locale)} className={linkClass}>
          {text.otherTools}
        </Link>
      </p>
    </div>
  );
}
