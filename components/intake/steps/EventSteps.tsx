"use client";

import { useTranslations } from "next-intl";
import {
  Cake,
  Droplets,
  Gem,
  GraduationCap,
  HandHeart,
  Heart,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { COUNTRY_CODES } from "@/lib/guest-links";
import {
  INTAKE_EVENT_CHOICES,
  INTAKE_LOCATION_KINDS,
  type IntakeEventAnswer,
  type IntakeEventChoiceId,
  type IntakeLocationAnswer,
  type IntakeScheduleRow,
  eventHasTwoNames,
  resolveEventChoice,
} from "@/lib/intake/catalog";
import { cn } from "@/lib/utils";
import {
  AddRowButton,
  ChoiceChips,
  FieldShell,
  RowCard,
  SuggestionChips,
  TextAreaField,
  TextField,
  ToggleRow,
  moveItem,
} from "../fields";
import { type ContactDraft, type StepProps, todayIso } from "./types";

const EVENT_ICONS: Record<IntakeEventChoiceId, LucideIcon> = {
  wedding: Heart,
  engagement: Gem,
  anniversary: Cake,
  baptism: Droplets,
  xiguiane: HandHeart,
  graduation: GraduationCap,
  other: Sparkles,
};

const MAX_LOCATIONS = 3;
const MAX_SCHEDULE_ROWS = 12;
const SCHEDULE_PRESETS = ["ceremony", "cocktail", "dinner", "party"] as const;

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export function ContactStep({
  contact,
  onChange,
  errorFor,
  honeypot,
  onHoneypot,
}: {
  contact: ContactDraft;
  onChange: (contact: ContactDraft) => void;
  errorFor: (path: string) => string | undefined;
  honeypot?: string;
  onHoneypot?: (value: string) => void;
}) {
  const t = useTranslations("Intake");
  const whatsappError = errorFor("whatsapp");

  return (
    <div className="space-y-5">
      <TextField
        label={t("fields.contactName")}
        value={contact.name}
        onChange={(name) => onChange({ ...contact, name })}
        placeholder={t("fields.contactNamePlaceholder")}
        autoComplete="name"
        maxLength={80}
        error={errorFor("name")}
      />

      <FieldShell
        label={t("fields.whatsapp")}
        hint={t("fields.whatsappHint")}
        error={whatsappError}
      >
        <div className="flex gap-2">
          <select
            aria-label={t("fields.whatsappPrefix")}
            value={contact.prefix}
            onChange={(event) =>
              onChange({ ...contact, prefix: event.target.value })
            }
            className="h-12 w-[7.5rem] shrink-0 rounded-xl border border-border bg-white px-3 text-base text-foreground outline-none focus:border-primary focus:ring-3 focus:ring-primary/20"
          >
            {!COUNTRY_CODES.some((option) => option.code === contact.prefix) ? (
              <option value={contact.prefix}>{contact.prefix || "+"}</option>
            ) : null}
            {COUNTRY_CODES.map((option) => (
              <option key={option.code} value={option.code}>
                {`${option.flag} ${option.code}`}
              </option>
            ))}
          </select>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={contact.number}
            onChange={(event) =>
              onChange({ ...contact, number: event.target.value })
            }
            placeholder={t("fields.whatsappNumberPlaceholder")}
            aria-label={t("fields.whatsapp")}
            aria-invalid={whatsappError ? true : undefined}
            maxLength={20}
            className="h-12 min-w-0 flex-1 rounded-xl border border-border bg-white px-4 text-base text-foreground outline-none placeholder:text-faint-foreground focus:border-primary focus:ring-3 focus:ring-primary/20 aria-invalid:border-destructive"
          />
        </div>
      </FieldShell>

      {onHoneypot ? (
        // Hidden from people and assistive tech; naive bots fill it in.
        <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
          <label>
            Website
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot ?? ""}
              onChange={(event) => onHoneypot(event.target.value)}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event (invitation + Save the Date)
// ---------------------------------------------------------------------------

export function EventStep({ kind, answers, update, errorFor }: StepProps) {
  const t = useTranslations("Intake");
  const event = answers.event ?? {};
  const parents = answers.parents ?? {};
  const choice = resolveEventChoice(event);
  const twoNames = eventHasTwoNames(event.type);
  const setEvent = (patch: Partial<IntakeEventAnswer>) =>
    update("event", { ...event, ...patch });

  function pickChoice(id: IntakeEventChoiceId) {
    const option = INTAKE_EVENT_CHOICES.find((item) => item.id === id);
    if (!option) return;
    const keepLabel = id === "other" && choice === "other";
    setEvent({
      type: option.type,
      typeLabel:
        "typeLabel" in option
          ? option.typeLabel
          : keepLabel
            ? event.typeLabel
            : "",
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2" role="radiogroup" aria-label={t("fields.eventType")}>
        <p className="text-sm font-medium text-foreground">{t("fields.eventType")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {INTAKE_EVENT_CHOICES.map((option) => {
            const Icon = EVENT_ICONS[option.id];
            const selected = choice === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => pickChoice(option.id)}
                className={cn(
                  "flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25",
                  selected
                    ? "border-primary bg-primary-soft text-primary-deep"
                    : "border-border bg-white text-foreground hover:bg-surface-warm",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {t(`eventChoices.${option.id}`)}
              </button>
            );
          })}
        </div>
        {errorFor("event.type") ? (
          <p role="alert" className="text-[13px] text-destructive">
            {errorFor("event.type")}
          </p>
        ) : null}
      </div>

      {choice === "other" ? (
        <TextField
          label={t("fields.typeLabel")}
          value={event.typeLabel}
          onChange={(typeLabel) => setEvent({ typeLabel })}
          placeholder={t("fields.typeLabelPlaceholder")}
          maxLength={60}
          error={errorFor("event.typeLabel")}
        />
      ) : null}

      {twoNames ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("fields.coupleFirst")}
            value={event.primaryName}
            onChange={(primaryName) => setEvent({ primaryName })}
            placeholder={t("fields.namePlaceholder")}
            maxLength={80}
            error={errorFor("event.primaryName")}
          />
          <TextField
            label={t("fields.coupleSecond")}
            value={event.secondaryName}
            onChange={(secondaryName) => setEvent({ secondaryName })}
            hint={t("fields.coupleSecondHint")}
            maxLength={80}
            error={errorFor("event.secondaryName")}
          />
        </div>
      ) : (
        <TextField
          label={t("fields.singleName")}
          value={event.primaryName}
          onChange={(primaryName) => setEvent({ primaryName })}
          hint={t("fields.singleNameHint")}
          maxLength={80}
          error={errorFor("event.primaryName")}
        />
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-3">
        <TextField
          type="date"
          label={t("fields.date")}
          value={event.date}
          onChange={(date) => setEvent({ date })}
          min={todayIso()}
          error={errorFor("event.date")}
        />
        <TextField
          type="time"
          label={t("fields.time")}
          value={event.time}
          onChange={(time) => setEvent({ time })}
          optionalLabel={t("optional")}
          error={errorFor("event.time")}
        />
      </div>

      {kind === "save-the-date" ? (
        <TextField
          label={t("fields.place")}
          value={event.place}
          onChange={(place) => setEvent({ place })}
          placeholder={t("fields.placePlaceholder")}
          hint={t("fields.placeHint")}
          optionalLabel={t("optional")}
          maxLength={120}
          error={errorFor("event.place")}
        />
      ) : null}

      <TextAreaField
        label={t("fields.quote")}
        value={event.quote}
        onChange={(quote) => setEvent({ quote })}
        placeholder={t("fields.quotePlaceholder")}
        optionalLabel={t("optional")}
        maxLength={600}
        error={errorFor("event.quote")}
      />

      {kind === "convite" ? (
        <div className="space-y-4">
          <ToggleRow
            label={t("fields.parentsToggle")}
            hint={t("fields.parentsHint")}
            checked={parents.enabled === true}
            onChange={(enabled) => update("parents", { ...parents, enabled })}
          />
          {parents.enabled ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {(twoNames
                ? ([
                    ["bridesFather", "fields.bridesFather"],
                    ["bridesMother", "fields.bridesMother"],
                    ["groomsFather", "fields.groomsFather"],
                    ["groomsMother", "fields.groomsMother"],
                  ] as const)
                : ([
                    ["bridesFather", "fields.father"],
                    ["bridesMother", "fields.mother"],
                  ] as const)
              ).map(([field, labelKey]) => (
                <TextField
                  key={field}
                  label={t(labelKey)}
                  value={parents[field]}
                  onChange={(value) =>
                    update("parents", { ...parents, [field]: value })
                  }
                  optionalLabel={t("optional")}
                  maxLength={80}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

export function LocationsStep({ answers, update, errorFor }: StepProps) {
  const t = useTranslations("Intake");
  const locations: IntakeLocationAnswer[] = answers.locations?.length
    ? answers.locations
    : [{ kind: "religious" }];
  const setLocations = (next: IntakeLocationAnswer[]) =>
    update("locations", next);
  const setLocation = (index: number, patch: Partial<IntakeLocationAnswer>) =>
    setLocations(
      locations.map((item, current) =>
        current === index ? { ...item, ...patch } : item,
      ),
    );
  const labels = { remove: t("remove"), moveUp: t("moveUp"), moveDown: t("moveDown") };

  return (
    <div className="space-y-4">
      {errorFor("locations") ? (
        <p role="alert" className="text-[13px] text-destructive">
          {errorFor("locations")}
        </p>
      ) : null}
      {locations.map((location, index) => (
        <RowCard
          key={index}
          title={t("fields.locationN", { n: index + 1 })}
          labels={labels}
          onRemove={
            locations.length > 1
              ? () => setLocations(locations.filter((_, i) => i !== index))
              : undefined
          }
          move={
            locations.length > 1
              ? {
                  up:
                    index > 0
                      ? () => setLocations(moveItem(locations, index, -1))
                      : undefined,
                  down:
                    index < locations.length - 1
                      ? () => setLocations(moveItem(locations, index, 1))
                      : undefined,
                }
              : undefined
          }
        >
          <ChoiceChips
            label={t("fields.locationKind")}
            options={INTAKE_LOCATION_KINDS.map((value) => ({
              value,
              label: t(`locationKinds.${value}`),
            }))}
            value={location.kind}
            onChange={(kind) => setLocation(index, { kind })}
          />
          <TextField
            label={t("fields.locationName")}
            value={location.name}
            onChange={(name) => setLocation(index, { name })}
            placeholder={t("fields.locationNamePlaceholder")}
            maxLength={120}
            error={errorFor(`locations.${index}.name`)}
          />
          <TextField
            label={t("fields.locationAddress")}
            value={location.address}
            onChange={(address) => setLocation(index, { address })}
            placeholder={t("fields.locationAddressPlaceholder")}
            optionalLabel={t("optional")}
            autoComplete="street-address"
            maxLength={240}
            error={errorFor(`locations.${index}.address`)}
          />
          <TextField
            type="url"
            inputMode="url"
            label={t("fields.locationMaps")}
            value={location.mapsUrl}
            onChange={(mapsUrl) => setLocation(index, { mapsUrl })}
            placeholder="https://maps.app.goo.gl/…"
            hint={t("fields.locationMapsHint")}
            optionalLabel={t("optional")}
            maxLength={500}
            error={errorFor(`locations.${index}.mapsUrl`)}
          />
        </RowCard>
      ))}
      {locations.length < MAX_LOCATIONS ? (
        <AddRowButton
          onClick={() => setLocations([...locations, { kind: "reception" }])}
        >
          {t("fields.addLocation")}
        </AddRowButton>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

export function ScheduleStep({ answers, update, errorFor }: StepProps) {
  const t = useTranslations("Intake");
  const rows: IntakeScheduleRow[] = answers.schedule ?? [];
  const venues = (answers.locations ?? [])
    .map((location) => location.name?.trim() ?? "")
    .filter(Boolean);
  const setRows = (next: IntakeScheduleRow[]) => update("schedule", next);
  const setRow = (index: number, patch: Partial<IntakeScheduleRow>) =>
    setRows(rows.map((row, current) => (current === index ? { ...row, ...patch } : row)));
  const usedLabels = new Set(rows.map((row) => row.label?.trim()));
  const suggestions = SCHEDULE_PRESETS.map((preset) =>
    t(`schedulePresets.${preset}`),
  ).filter((label) => !usedLabels.has(label));
  const labels = { remove: t("remove"), moveUp: t("moveUp"), moveDown: t("moveDown") };

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <p className="rounded-xl bg-surface-warm px-4 py-3 text-sm text-muted-foreground">
          {t("fields.scheduleEmpty")}
        </p>
      ) : null}

      {rows.map((row, index) => (
        <RowCard
          key={index}
          labels={labels}
          title={row.label?.trim() || t("fields.scheduleLabel")}
          onRemove={() => setRows(rows.filter((_, i) => i !== index))}
          move={{
            up: index > 0 ? () => setRows(moveItem(rows, index, -1)) : undefined,
            down:
              index < rows.length - 1
                ? () => setRows(moveItem(rows, index, 1))
                : undefined,
          }}
        >
          <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3">
            <TextField
              type="time"
              label={t("fields.scheduleTime")}
              value={row.time}
              onChange={(time) => setRow(index, { time })}
              error={errorFor(`schedule.${index}.time`)}
            />
            <TextField
              label={t("fields.scheduleLabel")}
              value={row.label}
              onChange={(label) => setRow(index, { label })}
              placeholder={t("fields.scheduleLabelPlaceholder")}
              maxLength={80}
              error={errorFor(`schedule.${index}.label`)}
            />
          </div>
          {venues.length ? (
            <FieldShell label={t("fields.scheduleVenue")} optionalLabel={t("optional")}>
              <select
                value={row.venue ?? ""}
                onChange={(event) => setRow(index, { venue: event.target.value })}
                className="h-12 w-full rounded-xl border border-border bg-white px-3 text-base text-foreground outline-none focus:border-primary focus:ring-3 focus:ring-primary/20"
              >
                <option value="">{t("fields.scheduleVenueNone")}</option>
                {venues.map((venue) => (
                  <option key={venue} value={venue}>
                    {venue}
                  </option>
                ))}
                {row.venue && !venues.includes(row.venue) ? (
                  <option value={row.venue}>{row.venue}</option>
                ) : null}
              </select>
            </FieldShell>
          ) : null}
        </RowCard>
      ))}

      {rows.length < MAX_SCHEDULE_ROWS ? (
        <>
          <SuggestionChips
            label={t("fields.suggestions")}
            suggestions={suggestions}
            onPick={(label) => setRows([...rows, { time: "", label }])}
          />
          <AddRowButton onClick={() => setRows([...rows, { time: "", label: "" }])}>
            {t("fields.addScheduleRow")}
          </AddRowButton>
        </>
      ) : null}
    </div>
  );
}
