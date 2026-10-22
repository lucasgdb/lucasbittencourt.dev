"use client";

import { useForm } from "@tanstack/react-form";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
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

const legendClass =
  "mb-3 font-medium tracking-tight text-neutral-900 dark:text-neutral-100";

// A choice drawn as a small box: the radio itself stays, visually hidden,
// so keyboard and screen readers use it as a radio
const pillClass =
  "inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-md border border-neutral-300 px-3 text-sm text-neutral-700 transition-colors hover:border-neutral-500 peer-checked:border-neutral-900 peer-checked:bg-neutral-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:peer-checked:border-neutral-100 dark:peer-checked:bg-neutral-100 dark:peer-checked:text-neutral-900";

/** A field's first error, whether a string or a Standard Schema issue */
function firstError(errors: unknown[]) {
  const error = errors.find(Boolean);
  if (!error) return undefined;
  if (typeof error === "string") return error;
  return (error as { message?: string }).message;
}

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

  const form = useForm({
    defaultValues: emptyForm as FeedbackForm,
    validators: { onSubmit: survey.formSchema(locale) },
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
      className="space-y-10"
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
      <form.Field name="reason">
        {(field) => {
          const error = firstError(field.state.meta.errors);
          return (
            <fieldset
              aria-describedby={error ? `${id}-reason-error` : undefined}
            >
              <legend className={legendClass}>{text.reasonLegend}</legend>
              <div className="flex flex-col gap-3">
                {survey.reasons.map((reason) => (
                  <label
                    key={reason}
                    className="flex cursor-pointer items-start gap-3 text-neutral-700 dark:text-neutral-300"
                  >
                    <input
                      type="radio"
                      name={field.name}
                      value={reason}
                      checked={field.state.value === reason}
                      onChange={() => field.handleChange(reason)}
                      onBlur={field.handleBlur}
                      className="mt-1 size-4 shrink-0 accent-neutral-900 dark:accent-neutral-100"
                    />
                    <span>{text.reasons[reason]}</span>
                  </label>
                ))}
              </div>
              {error && (
                <p
                  id={`${id}-reason-error`}
                  className="mt-3 text-sm text-red-600 dark:text-red-400"
                >
                  {error}
                </p>
              )}
            </fieldset>
          );
        }}
      </form.Field>

      <form.Field name="comment">
        {(field) => {
          const error = firstError(field.state.meta.errors);
          const length = field.state.value.length;
          return (
            <div>
              <label htmlFor={`${id}-comment`} className={`block ${legendClass}`}>
                {text.commentLabel}
              </label>
              <p
                id={`${id}-comment-hint`}
                className="-mt-2 mb-3 text-sm text-neutral-600 dark:text-neutral-400"
              >
                {text.commentHint}
              </p>
              <textarea
                id={`${id}-comment`}
                name={field.name}
                rows={4}
                maxLength={maxCommentLength}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                aria-describedby={`${id}-comment-hint ${id}-comment-count`}
                aria-invalid={error ? true : undefined}
                className="w-full resize-y rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-700 dark:text-neutral-100"
              />
              <div className="mt-1 flex justify-between gap-4 text-sm">
                <span className="text-red-600 dark:text-red-400">{error}</span>
                <span
                  id={`${id}-comment-count`}
                  className="shrink-0 tabular-nums text-neutral-500"
                >
                  {length}/{maxCommentLength}
                </span>
              </div>
            </div>
          );
        }}
      </form.Field>

      <form.Field name="rating">
        {(field) => (
          <fieldset>
            <legend className={legendClass}>
              {text.ratingLegend}{" "}
              <span className="text-sm font-normal text-neutral-500">
                {text.optional}
              </span>
            </legend>
            {/* The scale's ends under the first and last option */}
            <div className="flex flex-wrap items-start gap-2">
              <div className="inline-flex flex-col">
                <div className="flex gap-2">
                  {ratings.map((value) => {
                    const label = text.ratingLabels[value - 1] ?? "";
                    return (
                      <label key={value} title={label}>
                        <input
                          type="radio"
                          name={field.name}
                          value={value}
                          checked={field.state.value === value}
                          onChange={() => field.handleChange(value)}
                          aria-label={text.ratingAria(value, label)}
                          className="peer sr-only"
                        />
                        <span className={pillClass} aria-hidden="true">
                          {value}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p
                  className="mt-2 flex justify-between gap-4 text-sm text-neutral-500"
                  aria-hidden="true"
                >
                  <span>{text.ratingLabels[0]}</span>
                  <span>{text.ratingLabels[4]}</span>
                </p>
              </div>
              {field.state.value !== null && (
                <span className="flex h-9 items-center">
                  <ClearButton onClick={() => field.handleChange(null)}>
                    {text.clear}
                  </ClearButton>
                </span>
              )}
            </div>
          </fieldset>
        )}
      </form.Field>

      <form.Field name="wouldUseAgain">
        {(field) => (
          <fieldset>
            <legend className={legendClass}>
              {text.againLegend}{" "}
              <span className="text-sm font-normal text-neutral-500">
                {text.optional}
              </span>
            </legend>
            <div className="flex flex-wrap items-center gap-2">
              {wouldUseAgainValues.map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name={field.name}
                    value={value}
                    checked={field.state.value === value}
                    onChange={() => field.handleChange(value)}
                    className="peer sr-only"
                  />
                  <span className={pillClass}>{text.again[value]}</span>
                </label>
              ))}
              {field.state.value !== "" && (
                <ClearButton onClick={() => field.handleChange("")}>
                  {text.clear}
                </ClearButton>
              )}
            </div>
          </fieldset>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => {
          const busy = isSubmitting || mutation.isPending;
          return (
            <div className="space-y-3">
              <button
                type="submit"
                disabled={busy}
                aria-busy={busy}
                className="w-full rounded-md bg-neutral-900 px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:bg-neutral-100 dark:text-neutral-900"
              >
                {busy ? text.sending : text.submit}
              </button>
              {mutation.isError && !busy && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                  {text.errors.send}
                </p>
              )}
            </div>
          );
        }}
      </form.Subscribe>
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
    <button
      type="button"
      onClick={onClick}
      className={`ml-1 text-sm text-neutral-600 dark:text-neutral-400 ${linkClass}`}
    >
      {children}
    </button>
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
