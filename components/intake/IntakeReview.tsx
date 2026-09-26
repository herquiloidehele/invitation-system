"use client";

import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";

import { type AppLocale, getDateFormatLocale } from "@/i18n/locales";
import { PREDEFINED_GUIDE_ITEMS } from "@/lib/guest-guide";
import {
  type IntakeAnswers,
  type IntakeKind,
  type IntakeStepDef,
  type IntakeStepId,
  type IntakeToggleTextAnswer,
  eventHasTwoNames,
  resolveEventChoice,
} from "@/lib/intake/catalog";

interface ReviewRow {
  label: string;
  value: string;
}

export function stepTitleKey(kind: IntakeKind, stepId: IntakeStepId): string {
  return kind === "save-the-date" && stepId === "details"
    ? "steps.detailsSaveTheDate"
    : `steps.${stepId}`;
}

function formatDate(value: string | undefined, locale: AppLocale): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  return new Intl.DateTimeFormat(getDateFormatLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function joinLines(...values: Array<string | undefined>): string {
  return values
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join("\n");
}

export function IntakeReview({
  kind,
  steps,
  answers,
  contact,
  locale,
  onEdit,
}: {
  kind: IntakeKind;
  steps: IntakeStepDef[];
  answers: IntakeAnswers;
  contact: { name: string; whatsapp: string };
  locale: AppLocale;
  onEdit?: (stepId: IntakeStepId) => void;
}) {
  const t = useTranslations("Intake");

  const toggle = (label: string, value: IntakeToggleTextAnswer | undefined, extra = "") =>
    value?.enabled === undefined
      ? []
      : [
          {
            label,
            value: value.enabled ? joinLines(value.text, extra) || t("yes") : t("no"),
          },
        ];

  function rowsFor(stepId: IntakeStepId): ReviewRow[] {
    const event = answers.event ?? {};
    switch (stepId) {
      case "contact":
        return [
          { label: t("fields.contactName"), value: contact.name },
          { label: t("fields.whatsapp"), value: contact.whatsapp },
        ].filter((row) => row.value);
      case "event": {
        const choice = resolveEventChoice(event);
        const date = formatDate(event.date, locale);
        const parents = answers.parents;
        const rows: ReviewRow[] = [
          {
            label: t("fields.eventType"),
            value: choice
              ? choice === "other"
                ? event.typeLabel?.trim() || t("eventChoices.other")
                : t(`eventChoices.${choice}`)
              : "",
          },
          {
            label: t("fields.singleName"),
            value: [event.primaryName, event.secondaryName]
              .map((name) => name?.trim())
              .filter(Boolean)
              .join(" & "),
          },
          {
            label: t("fields.date"),
            value: date && event.time ? `${date} · ${event.time}` : date,
          },
          { label: t("fields.place"), value: event.place?.trim() ?? "" },
          { label: t("fields.quote"), value: event.quote?.trim() ?? "" },
        ];
        if (kind === "convite" && parents?.enabled !== undefined) {
          rows.push({
            label: t("fields.parentsToggle"),
            value: parents.enabled
              ? joinLines(
                  ...(
                    eventHasTwoNames(event.type)
                      ? ([
                          ["fields.bridesFather", parents.bridesFather],
                          ["fields.bridesMother", parents.bridesMother],
                          ["fields.groomsFather", parents.groomsFather],
                          ["fields.groomsMother", parents.groomsMother],
                        ] as const)
                      : ([
                          ["fields.father", parents.bridesFather],
                          ["fields.mother", parents.bridesMother],
                        ] as const)
                  )
                    .filter(([, name]) => name?.trim())
                    .map(([key, name]) => `${t(key)}: ${name?.trim()}`),
                ) || t("yes")
              : t("no"),
          });
        }
        return rows.filter((row) => row.value);
      }
      case "locations":
        return (answers.locations ?? [])
          .map((location) => ({
            label: t(`locationKinds.${location.kind ?? "other"}`),
            value: joinLines(location.name, location.address, location.mapsUrl),
          }))
          .filter((row) => row.value);
      case "schedule": {
        const value = (answers.schedule ?? [])
          .map((row) =>
            [row.time, row.label, row.venue ? `(${row.venue})` : ""]
              .map((part) => part?.trim())
              .filter(Boolean)
              .join(" "),
          )
          .filter(Boolean)
          .join("\n");
        return value ? [{ label: t("steps.schedule.title"), value }] : [];
      }
      case "details":
        return kind === "save-the-date"
          ? [
              ...(answers.rsvp?.deadline
                ? [
                    {
                      label: t("fields.rsvpDeadline"),
                      value: formatDate(answers.rsvp.deadline, locale),
                    },
                  ]
                : []),
              ...toggle(t("fields.musicText"), answers.music),
              ...colorRows(),
              ...notesRows(),
            ]
          : [
              ...toggle(
                t("fields.dressCodeText"),
                answers.dressCode,
                answers.dressCode?.colors?.join("  ") ?? "",
              ),
              ...toggle(t("fields.giftsText"), answers.gifts),
              ...toggle(t("fields.musicText"), answers.music),
            ];
      case "guestGuide": {
        const guide = answers.guestGuide;
        if (guide?.enabled === undefined) return [];
        if (!guide.enabled) return [{ label: t("fields.guestGuideToggle"), value: t("no") }];
        const presets = (guide.presetIds ?? [])
          .filter((id) => PREDEFINED_GUIDE_ITEMS.some((item) => item.id === id))
          .map((id) => t(`guidePresets.${id}`));
        return [
          {
            label: t("fields.guestGuideToggle"),
            value: joinLines(...presets, ...(guide.customLabels ?? [])) || t("yes"),
          },
        ];
      }
      case "rsvp": {
        const rsvp = answers.rsvp ?? {};
        return [
          {
            label: t("fields.rsvpDeadline"),
            value: formatDate(rsvp.deadline, locale),
          },
          {
            label: t("fields.askDietary"),
            value: rsvp.askDietary === false ? t("no") : t("yes"),
          },
        ].filter((row) => row.value);
      }
      case "extras":
        return [
          ...colorRows(),
          ...(answers.faqs ?? [])
            .filter((faq) => faq.question?.trim())
            .map((faq) => ({
              label: faq.question?.trim() ?? "",
              value: faq.answer?.trim() || "—",
            })),
          ...notesRows(),
        ];
    }
  }

  function colorRows(): ReviewRow[] {
    const value = joinLines(
      answers.colors?.text,
      answers.colors?.swatches?.join("  "),
    );
    return value ? [{ label: t("fields.colors"), value }] : [];
  }

  function notesRows(): ReviewRow[] {
    const value = answers.notes?.text?.trim();
    return value ? [{ label: t("fields.notes"), value }] : [];
  }

  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const rows = rowsFor(step.id);
        return (
          <section
            key={step.id}
            className="rounded-2xl border border-border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-foreground">
                {t(`${stepTitleKey(kind, step.id)}.title`)}
              </h2>
              {onEdit ? (
                <button
                  type="button"
                  onClick={() => onEdit(step.id)}
                  className="-mr-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-primary-deep hover:bg-primary-soft"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  {t("edit")}
                </button>
              ) : null}
            </div>
            {rows.length ? (
              <dl className="mt-3 space-y-3">
                {rows.map((row, index) => (
                  <div key={`${row.label}-${index}`}>
                    <dt className="text-xs font-medium uppercase tracking-[0.08em] text-subtle-foreground">
                      {row.label}
                    </dt>
                    <dd className="mt-0.5 whitespace-pre-line break-words text-[15px] text-foreground">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-faint-foreground">{t("review.empty")}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
