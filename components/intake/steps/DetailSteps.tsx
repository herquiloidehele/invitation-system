"use client";

import { useTranslations } from "next-intl";
import {
  Aperture,
  Baby,
  BellOff,
  Cake,
  Camera,
  Check,
  CheckCircle2,
  Church,
  Clock,
  Flower,
  HeartHandshake,
  MessageCircleOff,
  PartyPopper,
  Sparkles,
  Star,
  Trash2,
  UserX,
  type LucideIcon,
} from "lucide-react";

import { PREDEFINED_GUIDE_ITEMS } from "@/lib/guest-guide";
import type { IntakeFaqRow } from "@/lib/intake/catalog";
import { cn } from "@/lib/utils";
import {
  AddRowButton,
  RowCard,
  SuggestionChips,
  SwatchPicker,
  TextAreaField,
  TextField,
  ToggleRow,
} from "../fields";
import { type StepProps, todayIso } from "./types";

const GUIDE_ICONS: Record<string, LucideIcon> = {
  CheckCircle2,
  Camera,
  Sparkles,
  Flower,
  UserX,
  Cake,
  Clock,
  MessageCircleOff,
  Church,
  PartyPopper,
  BellOff,
  HeartHandshake,
  Baby,
  Aperture,
};

const MAX_CUSTOM_RULES = 6;
const MAX_FAQS = 10;
const FAQ_PRESETS = ["howToGetThere", "kids", "parking"] as const;

// ---------------------------------------------------------------------------
// Invitation: dress code, gifts, music
// ---------------------------------------------------------------------------

export function DetailsStep({ answers, update, errorFor }: StepProps) {
  const t = useTranslations("Intake");
  const dressCode = answers.dressCode ?? {};
  const gifts = answers.gifts ?? {};

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <ToggleRow
          label={t("fields.dressCodeToggle")}
          checked={dressCode.enabled === true}
          onChange={(enabled) => update("dressCode", { ...dressCode, enabled })}
        />
        {dressCode.enabled ? (
          <>
            <TextAreaField
              label={t("fields.dressCodeText")}
              value={dressCode.text}
              onChange={(text) => update("dressCode", { ...dressCode, text })}
              placeholder={t("fields.dressCodePlaceholder")}
              maxLength={600}
              error={errorFor("dressCode.text")}
            />
            <SwatchPicker
              label={t("fields.dressCodeColors")}
              optionalLabel={t("optional")}
              colors={dressCode.colors ?? []}
              onChange={(colors) => update("dressCode", { ...dressCode, colors })}
              max={6}
              addLabel={t("fields.addColor")}
              removeLabel={t("remove")}
            />
          </>
        ) : null}
      </div>

      <div className="space-y-4">
        <ToggleRow
          label={t("fields.giftsToggle")}
          checked={gifts.enabled === true}
          onChange={(enabled) => update("gifts", { ...gifts, enabled })}
        />
        {gifts.enabled ? (
          <TextAreaField
            label={t("fields.giftsText")}
            value={gifts.text}
            onChange={(text) => update("gifts", { ...gifts, text })}
            placeholder={t("fields.giftsPlaceholder")}
            maxLength={1000}
            rows={4}
            error={errorFor("gifts.text")}
          />
        ) : null}
      </div>

      <MusicField {...{ answers, update, errorFor }} />
    </div>
  );
}

function MusicField({
  answers,
  update,
  errorFor,
}: Pick<StepProps, "answers" | "update" | "errorFor">) {
  const t = useTranslations("Intake");
  const music = answers.music ?? {};
  return (
    <div className="space-y-4">
      <ToggleRow
        label={t("fields.musicToggle")}
        checked={music.enabled === true}
        onChange={(enabled) => update("music", { ...music, enabled })}
      />
      {music.enabled ? (
        <TextField
          label={t("fields.musicText")}
          value={music.text}
          onChange={(text) => update("music", { ...music, text })}
          placeholder={t("fields.musicPlaceholder")}
          maxLength={200}
          error={errorFor("music.text")}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Guest guide
// ---------------------------------------------------------------------------

export function GuestGuideStep({ answers, update, errorFor }: StepProps) {
  const t = useTranslations("Intake");
  const guide = answers.guestGuide ?? {};
  const selected = new Set(guide.presetIds ?? []);
  const customLabels = guide.customLabels ?? [];

  function togglePreset(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    update("guestGuide", {
      ...guide,
      presetIds: PREDEFINED_GUIDE_ITEMS.map((item) => item.id).filter((item) =>
        next.has(item),
      ),
    });
  }

  const setCustom = (labels: string[]) =>
    update("guestGuide", { ...guide, customLabels: labels });

  return (
    <div className="space-y-5">
      <ToggleRow
        label={t("fields.guestGuideToggle")}
        checked={guide.enabled === true}
        onChange={(enabled) => update("guestGuide", { ...guide, enabled })}
      />

      {guide.enabled ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            {PREDEFINED_GUIDE_ITEMS.map((item) => {
              const Icon = GUIDE_ICONS[item.iconName ?? ""] ?? Star;
              const checked = selected.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => togglePreset(item.id)}
                  className={cn(
                    "relative flex min-h-[5.5rem] flex-col items-start justify-between gap-2 rounded-xl border p-3 text-left text-[13px] font-medium leading-snug transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25",
                    checked
                      ? "border-primary bg-primary-soft text-primary-deep"
                      : "border-border bg-white text-foreground hover:bg-surface-warm",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span>{t(`guidePresets.${item.id}`)}</span>
                  {checked ? (
                    <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              {t("fields.customRules")}
            </p>
            {customLabels.map((label, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <TextField
                    label={<span className="sr-only">{t("fields.customRules")}</span>}
                    value={label}
                    onChange={(value) =>
                      setCustom(
                        customLabels.map((item, current) =>
                          current === index ? value : item,
                        ),
                      )
                    }
                    placeholder={t("fields.rulePlaceholder")}
                    maxLength={60}
                    error={errorFor(`guestGuide.customLabels.${index}`)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCustom(customLabels.filter((_, current) => current !== index))
                  }
                  className="mt-1.5 flex size-12 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-surface-warm"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  <span className="sr-only">{t("remove")}</span>
                </button>
              </div>
            ))}
            {customLabels.length < MAX_CUSTOM_RULES ? (
              <AddRowButton onClick={() => setCustom([...customLabels, ""])}>
                {t("fields.addRule")}
              </AddRowButton>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RSVP
// ---------------------------------------------------------------------------

function RsvpDeadlineField({
  answers,
  update,
  errorFor,
}: Pick<StepProps, "answers" | "update" | "errorFor">) {
  const t = useTranslations("Intake");
  const rsvp = answers.rsvp ?? {};
  return (
    <TextField
      type="date"
      label={t("fields.rsvpDeadline")}
      value={rsvp.deadline}
      onChange={(deadline) => update("rsvp", { ...rsvp, deadline })}
      min={todayIso()}
      max={answers.event?.date || undefined}
      hint={t("fields.rsvpDeadlineHint")}
      optionalLabel={t("optional")}
      error={errorFor("rsvp.deadline")}
    />
  );
}

export function RsvpStep({ answers, update, errorFor }: StepProps) {
  const t = useTranslations("Intake");
  const rsvp = answers.rsvp ?? {};
  return (
    <div className="space-y-5">
      <RsvpDeadlineField {...{ answers, update, errorFor }} />
      <ToggleRow
        label={t("fields.askDietary")}
        hint={t("fields.askDietaryHint")}
        checked={rsvp.askDietary !== false}
        onChange={(askDietary) => update("rsvp", { ...rsvp, askDietary })}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Extras: colors + FAQs (customizable demos), notes
// ---------------------------------------------------------------------------

function ColorsField({
  answers,
  update,
  errorFor,
}: Pick<StepProps, "answers" | "update" | "errorFor">) {
  const t = useTranslations("Intake");
  const colors = answers.colors ?? {};
  return (
    <div className="space-y-4">
      <TextField
        label={t("fields.colors")}
        value={colors.text}
        onChange={(text) => update("colors", { ...colors, text })}
        placeholder={t("fields.colorsPlaceholder")}
        optionalLabel={t("optional")}
        maxLength={300}
        error={errorFor("colors.text")}
      />
      <SwatchPicker
        label={t("fields.colorsSwatches")}
        optionalLabel={t("optional")}
        colors={colors.swatches ?? []}
        onChange={(swatches) => update("colors", { ...colors, swatches })}
        max={3}
        addLabel={t("fields.addColor")}
        removeLabel={t("remove")}
      />
    </div>
  );
}

function NotesField({
  answers,
  update,
  errorFor,
  customizable,
}: Pick<StepProps, "answers" | "update" | "errorFor" | "customizable">) {
  const t = useTranslations("Intake");
  return (
    <TextAreaField
      label={t("fields.notes")}
      value={answers.notes?.text}
      onChange={(text) => update("notes", { text })}
      placeholder={t("fields.notesPlaceholder")}
      hint={customizable ? t("fields.notesCustomizableHint") : undefined}
      optionalLabel={t("optional")}
      maxLength={2000}
      rows={4}
      error={errorFor("notes.text")}
    />
  );
}

function FaqsField({ answers, update, errorFor }: StepProps) {
  const t = useTranslations("Intake");
  const faqs: IntakeFaqRow[] = answers.faqs ?? [];
  const setFaqs = (next: IntakeFaqRow[]) => update("faqs", next);
  const used = new Set(faqs.map((faq) => faq.question?.trim()));
  const suggestions = FAQ_PRESETS.map((preset) => t(`faqPresets.${preset}`)).filter(
    (question) => !used.has(question),
  );
  const labels = { remove: t("remove"), moveUp: t("moveUp"), moveDown: t("moveDown") };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{t("fields.faqs")}</p>
      {faqs.map((faq, index) => (
        <RowCard
          key={index}
          labels={labels}
          title={`${index + 1}.`}
          onRemove={() => setFaqs(faqs.filter((_, current) => current !== index))}
        >
          <TextField
            label={t("fields.faqQuestion")}
            value={faq.question}
            onChange={(question) =>
              setFaqs(faqs.map((item, current) => (current === index ? { ...item, question } : item)))
            }
            maxLength={160}
            error={errorFor(`faqs.${index}.question`)}
          />
          <TextAreaField
            label={t("fields.faqAnswer")}
            value={faq.answer}
            onChange={(answer) =>
              setFaqs(faqs.map((item, current) => (current === index ? { ...item, answer } : item)))
            }
            maxLength={600}
            rows={2}
            error={errorFor(`faqs.${index}.answer`)}
          />
        </RowCard>
      ))}
      {faqs.length < MAX_FAQS ? (
        <>
          <SuggestionChips
            label={t("fields.suggestions")}
            suggestions={suggestions}
            onPick={(question) => setFaqs([...faqs, { question, answer: "" }])}
          />
          <AddRowButton onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}>
            {t("fields.addFaq")}
          </AddRowButton>
        </>
      ) : null}
    </div>
  );
}

export function ExtrasStep(props: StepProps) {
  return (
    <div className="space-y-7">
      {props.customizable ? <ColorsField {...props} /> : null}
      {props.customizable ? <FaqsField {...props} /> : null}
      <NotesField {...props} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Save the Date: deadline, music, colors, notes
// ---------------------------------------------------------------------------

export function SaveTheDateDetailsStep(props: StepProps) {
  return (
    <div className="space-y-6">
      <RsvpDeadlineField {...props} />
      <MusicField {...props} />
      {props.customizable ? <ColorsField {...props} /> : null}
      <NotesField {...props} />
    </div>
  );
}
