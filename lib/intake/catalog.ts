import { z } from "zod";

import { PREDEFINED_GUIDE_ITEMS } from "@/lib/guest-guide";

// ---------------------------------------------------------------------------
// Customer intake question catalogue.
//
// This file is the single source of truth for which questions exist, which
// wizard step shows them, and how each answer is validated. Answers are stored
// as key-value rows (IntakeAnswer), so adding a question means adding a key
// here, its form control in components/intake, and its line in
// lib/intake/apply.ts. No migration.
//
// Two validation modes share the same rules:
//   - "lenient" runs on every autosave: required fields may still be empty,
//     but enums, formats and maximum lengths are enforced.
//   - "strict" runs on "Continuar" and on submit: required fields must be set.
// Error messages are codes ("required", "invalid", "tooLong", "tooMany") that
// the wizard translates.
// ---------------------------------------------------------------------------

export const INTAKE_KINDS = ["convite", "save-the-date"] as const;
export type IntakeKind = (typeof INTAKE_KINDS)[number];

export function parseIntakeKind(value: unknown): IntakeKind | null {
  return typeof value === "string" &&
    (INTAKE_KINDS as readonly string[]).includes(value)
    ? (value as IntakeKind)
    : null;
}

export const INTAKE_STATUSES = [
  "draft",
  "submitted",
  "in_production",
  "archived",
] as const;
export type IntakeStatus = (typeof INTAKE_STATUSES)[number];

export function parseIntakeStatus(value: unknown): IntakeStatus | null {
  return typeof value === "string" &&
    (INTAKE_STATUSES as readonly string[]).includes(value)
    ? (value as IntakeStatus)
    : null;
}

/** Answers can no longer change once production started or the intake was archived. */
export function isReadOnlyStatus(status: string): boolean {
  return status === "in_production" || status === "archived";
}

export const INTAKE_SOURCES = ["admin", "self"] as const;
export type IntakeSource = (typeof INTAKE_SOURCES)[number];

// ---------------------------------------------------------------------------
// Answer types. Every field is optional because drafts are partial; strict
// validation decides what must be present before submission.
// ---------------------------------------------------------------------------

export const INTAKE_EVENT_TYPES = [
  "wedding",
  "engagement",
  "anniversary",
  "baptism",
  "other",
] as const;
export type IntakeEventType = (typeof INTAKE_EVENT_TYPES)[number];

/** The cards shown on the event step. Xiguiane and Graduação are stored as "other" + label. */
export const INTAKE_EVENT_CHOICES = [
  { id: "wedding", type: "wedding" },
  { id: "engagement", type: "engagement" },
  { id: "anniversary", type: "anniversary" },
  { id: "baptism", type: "baptism" },
  { id: "xiguiane", type: "other", typeLabel: "Xiguiane" },
  { id: "graduation", type: "other", typeLabel: "Graduação" },
  { id: "other", type: "other" },
] as const satisfies ReadonlyArray<{
  id: string;
  type: IntakeEventType;
  typeLabel?: string;
}>;
export type IntakeEventChoiceId = (typeof INTAKE_EVENT_CHOICES)[number]["id"];

export const INTAKE_LOCATION_KINDS = [
  "religious",
  "civil",
  "reception",
  "other",
] as const;
export type IntakeLocationKind = (typeof INTAKE_LOCATION_KINDS)[number];

export interface IntakeEventAnswer {
  type?: IntakeEventType;
  typeLabel?: string;
  primaryName?: string;
  secondaryName?: string;
  /** "YYYY-MM-DD" */
  date?: string;
  /** "HH:mm" */
  time?: string;
  quote?: string;
  /** Save the Date only: city or country. */
  place?: string;
}

export interface IntakeParentsAnswer {
  enabled?: boolean;
  bridesFather?: string;
  bridesMother?: string;
  groomsFather?: string;
  groomsMother?: string;
}

export interface IntakeLocationAnswer {
  kind?: IntakeLocationKind;
  name?: string;
  address?: string;
  mapsUrl?: string;
}

export interface IntakeScheduleRow {
  time?: string;
  label?: string;
  venue?: string;
}

export interface IntakeToggleTextAnswer {
  enabled?: boolean;
  text?: string;
}

export interface IntakeDressCodeAnswer extends IntakeToggleTextAnswer {
  colors?: string[];
}

export interface IntakeGuestGuideAnswer {
  enabled?: boolean;
  presetIds?: string[];
  customLabels?: string[];
}

export interface IntakeRsvpAnswer {
  /** "YYYY-MM-DD" */
  deadline?: string;
  askDietary?: boolean;
}

export interface IntakeColorsAnswer {
  text?: string;
  swatches?: string[];
}

export interface IntakeFaqRow {
  question?: string;
  answer?: string;
}

export interface IntakeNotesAnswer {
  text?: string;
}

export interface IntakeAnswers {
  event?: IntakeEventAnswer;
  parents?: IntakeParentsAnswer;
  locations?: IntakeLocationAnswer[];
  schedule?: IntakeScheduleRow[];
  dressCode?: IntakeDressCodeAnswer;
  gifts?: IntakeToggleTextAnswer;
  music?: IntakeToggleTextAnswer;
  guestGuide?: IntakeGuestGuideAnswer;
  rsvp?: IntakeRsvpAnswer;
  colors?: IntakeColorsAnswer;
  faqs?: IntakeFaqRow[];
  notes?: IntakeNotesAnswer;
}

export type IntakeAnswerKey = keyof IntakeAnswers;

export const INTAKE_ANSWER_KEYS = [
  "event",
  "parents",
  "locations",
  "schedule",
  "dressCode",
  "gifts",
  "music",
  "guestGuide",
  "rsvp",
  "colors",
  "faqs",
  "notes",
] as const satisfies readonly IntakeAnswerKey[];

export function isIntakeAnswerKey(value: string): value is IntakeAnswerKey {
  return (INTAKE_ANSWER_KEYS as readonly string[]).includes(value);
}

export interface IntakeContact {
  name?: string;
  /** Digits only, country code included, no "+". */
  whatsapp?: string;
}

export interface IntakeIssue {
  field: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

export const INTAKE_STEP_IDS = [
  "contact",
  "event",
  "locations",
  "schedule",
  "details",
  "guestGuide",
  "rsvp",
  "extras",
] as const;
export type IntakeStepId = (typeof INTAKE_STEP_IDS)[number];

export interface IntakeStepDef {
  id: IntakeStepId;
  keys: IntakeAnswerKey[];
}

export interface IntakeStepOptions {
  /** True when the chosen demo is fully customizable (colors, FAQs). */
  customizable: boolean;
}

export function stepsFor(
  kind: IntakeKind,
  { customizable }: IntakeStepOptions,
): IntakeStepDef[] {
  if (kind === "save-the-date") {
    return [
      { id: "contact", keys: [] },
      { id: "event", keys: ["event"] },
      {
        id: "details",
        keys: customizable
          ? ["rsvp", "music", "colors", "notes"]
          : ["rsvp", "music", "notes"],
      },
    ];
  }

  return [
    { id: "contact", keys: [] },
    { id: "event", keys: ["event", "parents"] },
    { id: "locations", keys: ["locations"] },
    { id: "schedule", keys: ["schedule"] },
    { id: "details", keys: ["dressCode", "gifts", "music"] },
    { id: "guestGuide", keys: ["guestGuide"] },
    { id: "rsvp", keys: ["rsvp"] },
    {
      id: "extras",
      keys: customizable ? ["colors", "faqs", "notes"] : ["notes"],
    },
  ];
}

export function isIntakeStepId(kind: IntakeKind, value: unknown): boolean {
  return (
    typeof value === "string" &&
    stepsFor(kind, { customizable: true }).some((step) => step.id === value)
  );
}

/** Keys that must be present (and non-empty) before submitting. */
function requiredKeysFor(kind: IntakeKind): IntakeAnswerKey[] {
  return kind === "convite" ? ["event", "locations"] : ["event"];
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export type IntakeValidationMode = "strict" | "lenient";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const URL_RE = /^https?:\/\/\S+\.\S+$/i;
const WHATSAPP_RE = /^\d{8,15}$/;

const GUIDE_PRESET_IDS = PREDEFINED_GUIDE_ITEMS.map((item) => item.id) as [
  string,
  ...string[],
];

function isRealDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function optionalText(max: number) {
  return z.string().trim().max(max, "tooLong").optional();
}

function requiredText(mode: IntakeValidationMode, max: number) {
  return mode === "strict"
    ? z.string().trim().min(1, "required").max(max, "tooLong")
    : optionalText(max);
}

function dateField(mode: IntakeValidationMode, required: boolean) {
  const valid = z.string().trim().refine(isRealDate, "invalid");
  if (mode === "strict" && required) {
    return z
      .string({ error: "required" })
      .trim()
      .min(1, { error: "required", abort: true })
      .refine(isRealDate, "invalid");
  }
  return z.union([z.literal(""), valid], { error: "invalid" }).optional();
}

function timeField(mode: IntakeValidationMode, required: boolean) {
  const valid = z.string().trim().regex(TIME_RE, "invalid");
  if (mode === "strict" && required) {
    return z
      .string({ error: "required" })
      .trim()
      .min(1, { error: "required", abort: true })
      .regex(TIME_RE, "invalid");
  }
  return z.union([z.literal(""), valid], { error: "invalid" }).optional();
}

function withScheme(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const urlField = z.preprocess(
  withScheme,
  z
    .union([z.literal(""), z.string().max(500, "tooLong").regex(URL_RE, "invalid")], {
      error: "invalid",
    })
    .optional(),
);

const hexList = (max: number) =>
  z.array(z.string().regex(HEX_RE, "invalid")).max(max, "tooMany").optional();

function eventSchema(mode: IntakeValidationMode) {
  return z
    .object({
      type:
        mode === "strict"
          ? z.enum(INTAKE_EVENT_TYPES, { error: "required" })
          : z.enum(INTAKE_EVENT_TYPES, { error: "invalid" }).optional(),
      typeLabel: optionalText(60),
      primaryName: requiredText(mode, 80),
      secondaryName: optionalText(80),
      date: dateField(mode, true),
      time: timeField(mode, false),
      quote: optionalText(600),
      place: optionalText(120),
    });
}

/**
 * Cross-field rules. Kept outside zod because object-level refinements are
 * skipped whenever a field already failed, and the wizard needs every error
 * of a step at once.
 */
function crossFieldIssues(
  key: IntakeAnswerKey,
  value: unknown,
  mode: IntakeValidationMode,
): IntakeIssue[] {
  if (mode !== "strict" || key !== "event" || !isPlainObject(value)) return [];
  const label = typeof value.typeLabel === "string" ? value.typeLabel.trim() : "";
  return value.type === "other" && !label
    ? [{ field: "event.typeLabel", message: "required" }]
    : [];
}

type ParseKeyResult =
  | { ok: true; data: unknown }
  | { ok: false; issues: IntakeIssue[] };

function parseKey(
  key: IntakeAnswerKey,
  value: unknown,
  mode: IntakeValidationMode,
): ParseKeyResult {
  const parsed = ANSWER_SCHEMAS[mode][key].safeParse(value);
  const issues = [
    ...(parsed.success ? [] : toIssues(parsed.error, [key])),
    ...crossFieldIssues(key, value, mode),
  ];
  return parsed.success && issues.length === 0
    ? { ok: true, data: parsed.data }
    : { ok: false, issues };
}

function parentsSchema() {
  return z.object({
    enabled: z.boolean().optional(),
    bridesFather: optionalText(80),
    bridesMother: optionalText(80),
    groomsFather: optionalText(80),
    groomsMother: optionalText(80),
  });
}

function locationSchema(mode: IntakeValidationMode) {
  return z.object({
    kind: z.enum(INTAKE_LOCATION_KINDS, { error: "invalid" }).optional(),
    name: requiredText(mode, 120),
    address: optionalText(240),
    mapsUrl: urlField,
  });
}

function scheduleRowSchema(mode: IntakeValidationMode) {
  return z.object({
    time: timeField(mode, true),
    label: requiredText(mode, 80),
    venue: optionalText(120),
  });
}

function toggleTextSchema(max: number) {
  return z.object({
    enabled: z.boolean().optional(),
    text: optionalText(max),
  });
}

function guestGuideSchema(mode: IntakeValidationMode) {
  return z.object({
    enabled: z.boolean().optional(),
    presetIds: z
      .array(z.enum(GUIDE_PRESET_IDS, { error: "invalid" }))
      .max(GUIDE_PRESET_IDS.length, "tooMany")
      .optional(),
    customLabels: z
      .array(
        mode === "strict"
          ? z.string().trim().min(1, "required").max(60, "tooLong")
          : z.string().trim().max(60, "tooLong"),
      )
      .max(6, "tooMany")
      .optional(),
  });
}

function faqRowSchema(mode: IntakeValidationMode) {
  return z.object({
    question: requiredText(mode, 160),
    answer: requiredText(mode, 600),
  });
}

function buildAnswerSchemas(
  mode: IntakeValidationMode,
): Record<IntakeAnswerKey, z.ZodType> {
  return {
    event: eventSchema(mode),
    parents: parentsSchema(),
    locations: z.array(locationSchema(mode)).max(3, "tooMany"),
    schedule: z.array(scheduleRowSchema(mode)).max(12, "tooMany"),
    dressCode: toggleTextSchema(600).extend({ colors: hexList(6) }),
    gifts: toggleTextSchema(1000),
    music: toggleTextSchema(200),
    guestGuide: guestGuideSchema(mode),
    rsvp: z.object({
      deadline: dateField(mode, false),
      askDietary: z.boolean().optional(),
    }),
    colors: z.object({ text: optionalText(300), swatches: hexList(3) }),
    faqs: z.array(faqRowSchema(mode)).max(10, "tooMany"),
    notes: z.object({ text: optionalText(2000) }),
  };
}

const ANSWER_SCHEMAS: Record<
  IntakeValidationMode,
  Record<IntakeAnswerKey, z.ZodType>
> = {
  strict: buildAnswerSchemas("strict"),
  lenient: buildAnswerSchemas("lenient"),
};

function contactSchema(mode: IntakeValidationMode) {
  const whatsapp = z.preprocess(
    (value) => (typeof value === "string" ? value.replace(/\D/g, "") : value),
    mode === "strict"
      ? z
          .string({ error: "required" })
          .min(1, { error: "required", abort: true })
          .regex(WHATSAPP_RE, "invalid")
      : z
          .union([z.literal(""), z.string().regex(WHATSAPP_RE, "invalid")], {
            error: "invalid",
          })
          .optional(),
  );

  return z.object({ name: requiredText(mode, 80), whatsapp });
}

function toIssues(error: z.ZodError, prefix: string[] = []): IntakeIssue[] {
  return error.issues.map((issue) => ({
    field: [...prefix, ...issue.path.map(String)].join("."),
    message: issue.message,
  }));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ---------------------------------------------------------------------------
// Parsing and validation
// ---------------------------------------------------------------------------

export type ParseAnswersResult =
  | { ok: true; answers: IntakeAnswers }
  | { ok: false; issues: IntakeIssue[] };

/** Validate a map of answers. Unknown keys are rejected; values are normalized. */
export function parseAnswers(
  input: unknown,
  mode: IntakeValidationMode,
): ParseAnswersResult {
  if (!isPlainObject(input)) {
    return { ok: false, issues: [{ field: "answers", message: "invalid" }] };
  }

  const answers: Record<string, unknown> = {};
  const issues: IntakeIssue[] = [];

  for (const [key, value] of Object.entries(input)) {
    if (!isIntakeAnswerKey(key)) {
      issues.push({ field: key, message: "unknownKey" });
      continue;
    }
    const parsed = parseKey(key, value, mode);
    if (parsed.ok) answers[key] = parsed.data;
    else issues.push(...parsed.issues);
  }

  return issues.length
    ? { ok: false, issues }
    : { ok: true, answers: answers as IntakeAnswers };
}

export type ParseContactResult =
  | { ok: true; contact: IntakeContact }
  | { ok: false; issues: IntakeIssue[] };

export function parseContact(
  input: unknown,
  mode: IntakeValidationMode,
): ParseContactResult {
  const parsed = contactSchema(mode).safeParse(isPlainObject(input) ? input : {});
  if (!parsed.success) return { ok: false, issues: toIssues(parsed.error) };

  const contact: IntakeContact = {};
  if (parsed.data.name !== undefined) contact.name = parsed.data.name;
  if (typeof parsed.data.whatsapp === "string" && parsed.data.whatsapp) {
    contact.whatsapp = parsed.data.whatsapp;
  }
  return { ok: true, contact };
}

function isEmptyValue(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.length === 0);
}

/** Strict validation of one wizard step. Returns [] when the step is valid. */
export function validateStep(
  kind: IntakeKind,
  stepId: IntakeStepId,
  contact: IntakeContact,
  answers: IntakeAnswers,
  options: IntakeStepOptions,
): IntakeIssue[] {
  if (stepId === "contact") {
    const result = parseContact(contact, "strict");
    return result.ok ? [] : result.issues;
  }

  const step = stepsFor(kind, options).find((item) => item.id === stepId);
  if (!step) return [{ field: "step", message: "invalid" }];

  const required = requiredKeysFor(kind);
  const issues: IntakeIssue[] = [];

  for (const key of step.keys) {
    const value = answers[key];
    if (isEmptyValue(value)) {
      if (required.includes(key)) issues.push({ field: key, message: "required" });
      continue;
    }
    const parsed = parseKey(key, value, "strict");
    if (!parsed.ok) issues.push(...parsed.issues);
  }

  return issues;
}

export type ValidateAllResult =
  | { ok: true }
  | { ok: false; step: IntakeStepId; issues: IntakeIssue[] };

/** Strict validation of every step, reporting the first invalid one. */
export function validateAll(
  kind: IntakeKind,
  contact: IntakeContact,
  answers: IntakeAnswers,
  options: IntakeStepOptions,
): ValidateAllResult {
  for (const step of stepsFor(kind, options)) {
    const issues = validateStep(kind, step.id, contact, answers, options);
    if (issues.length) return { ok: false, step: step.id, issues };
  }
  return { ok: true };
}

/** Which event card is selected, derived from the stored type + label. */
export function resolveEventChoice(
  event: IntakeEventAnswer | undefined,
): IntakeEventChoiceId | null {
  if (!event?.type) return null;
  if (event.type !== "other") return event.type;

  const label = event.typeLabel?.trim().toLocaleLowerCase();
  const preset = INTAKE_EVENT_CHOICES.find(
    (choice) =>
      "typeLabel" in choice && choice.typeLabel.toLocaleLowerCase() === label,
  );
  return preset?.id ?? "other";
}

/** A wedding-like event asks for two names. */
export function eventHasTwoNames(type: IntakeEventType | undefined): boolean {
  return type === "wedding" || type === "engagement" || type === "anniversary";
}
