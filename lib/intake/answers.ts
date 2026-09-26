import { PREDEFINED_GUIDE_ITEMS } from "@/lib/guest-guide";
import {
  type IntakeAnswerKey,
  type IntakeAnswers,
  type IntakeContact,
  type IntakeEventAnswer,
  type IntakeKind,
  type IntakeLocationKind,
  type IntakeStepId,
  type IntakeStepOptions,
  type IntakeToggleTextAnswer,
  isIntakeAnswerKey,
  stepsFor,
} from "./catalog";

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

/** Fold IntakeAnswer rows into one answers object. Unknown keys are dropped. */
export function foldAnswerRows(
  rows: ReadonlyArray<{ key: string; value: unknown }>,
): IntakeAnswers {
  const answers: Record<string, unknown> = {};
  for (const row of rows) {
    if (isIntakeAnswerKey(row.key)) answers[row.key] = row.value;
  }
  return answers as IntakeAnswers;
}

/**
 * Keys written after the admin's last visit. Before the first visit nothing is
 * marked, because everything is new and a marker on every row is noise.
 */
export function changedKeysSince(
  rows: ReadonlyArray<{ key: string; updatedAt: Date }>,
  viewedAt: Date | null,
): Set<IntakeAnswerKey> {
  const changed = new Set<IntakeAnswerKey>();
  if (!viewedAt) return changed;
  for (const row of rows) {
    if (isIntakeAnswerKey(row.key) && row.updatedAt > viewedAt) {
      changed.add(row.key);
    }
  }
  return changed;
}

/**
 * Deep equality for stored answer values. Object key order is ignored because
 * Postgres jsonb re-orders keys, and `undefined` properties count as absent
 * (JSON drops them). Array order matters: reordering a schedule is a change.
 */
export function jsonEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => jsonEqual(item, b[index]));
  }
  const left = Object.entries(a).filter(([, value]) => value !== undefined);
  const right = Object.entries(b).filter(([, value]) => value !== undefined);
  if (left.length !== right.length) return false;
  const rightMap = new Map(right);
  return left.every(
    ([key, value]) => rightMap.has(key) && jsonEqual(value, rightMap.get(key)),
  );
}

/** Submitted and either never opened by the admin or edited since. */
export function isIntakeUnseen(intake: {
  status: string;
  adminViewedAt: Date | null;
  answersUpdatedAt: Date | null;
}): boolean {
  if (intake.status !== "submitted") return false;
  if (!intake.adminViewedAt) return true;
  return Boolean(
    intake.answersUpdatedAt && intake.answersUpdatedAt > intake.adminViewedAt,
  );
}

// ---------------------------------------------------------------------------
// Admin formatting (Portuguese, like the rest of /admin)
// ---------------------------------------------------------------------------

export const INTAKE_STEP_TITLES: Record<IntakeStepId, string> = {
  contact: "Contacto",
  event: "Evento",
  locations: "Locais",
  schedule: "Cronograma",
  details: "Detalhes",
  guestGuide: "Manual do convidado",
  rsvp: "Confirmação de presença",
  extras: "Extras",
};

export const INTAKE_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  submitted: "Submetido",
  in_production: "Em produção",
  archived: "Arquivado",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "Casamento",
  engagement: "Noivado",
  anniversary: "Aniversário",
  baptism: "Batizado",
  other: "Outro",
};

const LOCATION_KIND_LABELS: Record<IntakeLocationKind, string> = {
  religious: "Cerimónia religiosa",
  civil: "Cerimónia civil",
  reception: "Celebração",
  other: "Local",
};

export interface IntakeAnswerRow {
  key: IntakeAnswerKey;
  label: string;
  value: string;
}

export interface IntakeAnswerSection {
  stepId: IntakeStepId;
  title: string;
  rows: IntakeAnswerRow[];
}

export function formatIsoDate(value: string | undefined): string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

function clean(value: string | undefined): string {
  return value?.trim() ?? "";
}

function lines(...values: Array<string | undefined>): string {
  return values.map(clean).filter(Boolean).join("\n");
}

export function eventTypeLabel(event: IntakeEventAnswer | undefined): string {
  if (!event?.type) return "";
  if (event.type === "other") return clean(event.typeLabel) || "Outro";
  return EVENT_TYPE_LABELS[event.type] ?? event.type;
}

export function eventDisplayName(event: IntakeEventAnswer | undefined): string {
  return [clean(event?.primaryName), clean(event?.secondaryName)]
    .filter(Boolean)
    .join(" & ");
}

function toggleRow(
  key: IntakeAnswerKey,
  label: string,
  value: IntakeToggleTextAnswer | undefined,
  extra = "",
): IntakeAnswerRow[] {
  if (!value || value.enabled === undefined) return [];
  if (!value.enabled) return [{ key, label, value: "Não" }];
  return [{ key, label, value: lines(value.text, extra) || "Sim" }];
}

function rowsForKey(
  key: IntakeAnswerKey,
  answers: IntakeAnswers,
): IntakeAnswerRow[] {
  switch (key) {
    case "event": {
      const event = answers.event;
      if (!event) return [];
      const date = formatIsoDate(event.date);
      const rows: IntakeAnswerRow[] = [
        { key, label: "Tipo de evento", value: eventTypeLabel(event) },
        { key, label: "Nomes", value: eventDisplayName(event) },
        {
          key,
          label: "Data",
          value: date && event.time ? `${date} às ${event.time}` : date,
        },
        { key, label: "Local", value: clean(event.place) },
        { key, label: "Frase ou versículo", value: clean(event.quote) },
      ];
      return rows.filter((row) => row.value);
    }
    case "parents": {
      const parents = answers.parents;
      if (!parents || parents.enabled === undefined) return [];
      if (!parents.enabled) return [{ key, label: "Pais", value: "Não" }];
      const names = [
        ["Pai da noiva", parents.bridesFather],
        ["Mãe da noiva", parents.bridesMother],
        ["Pai do noivo", parents.groomsFather],
        ["Mãe do noivo", parents.groomsMother],
      ]
        .filter(([, name]) => clean(name))
        .map(([label, name]) => `${label}: ${clean(name)}`);
      return [{ key, label: "Pais", value: names.join("\n") || "Sim" }];
    }
    case "locations":
      return (answers.locations ?? [])
        .map((location) => ({
          key,
          label: LOCATION_KIND_LABELS[location.kind ?? "other"] ?? "Local",
          value: lines(location.name, location.address, location.mapsUrl),
        }))
        .filter((row) => row.value);
    case "schedule": {
      const value = (answers.schedule ?? [])
        .map((row) => {
          const head = [clean(row.time), clean(row.label)]
            .filter(Boolean)
            .join(" — ");
          return clean(row.venue) ? `${head} (${clean(row.venue)})` : head;
        })
        .filter(Boolean)
        .join("\n");
      return value ? [{ key, label: "Cronograma", value }] : [];
    }
    case "dressCode":
      return toggleRow(
        key,
        "Código de vestimenta",
        answers.dressCode,
        answers.dressCode?.colors?.length
          ? `Cores: ${answers.dressCode.colors.join(", ")}`
          : "",
      );
    case "gifts":
      return toggleRow(key, "Presentes", answers.gifts);
    case "music":
      return toggleRow(key, "Música", answers.music);
    case "guestGuide": {
      const guide = answers.guestGuide;
      if (!guide || guide.enabled === undefined) return [];
      if (!guide.enabled) return [{ key, label: "Regras", value: "Não" }];
      const presets = (guide.presetIds ?? [])
        .map((id) => PREDEFINED_GUIDE_ITEMS.find((item) => item.id === id))
        .filter((item) => item !== undefined)
        .map((item) => item.label);
      const value = lines(...presets, ...(guide.customLabels ?? []));
      return [{ key, label: "Regras", value: value || "Sim" }];
    }
    case "rsvp": {
      const rsvp = answers.rsvp;
      if (!rsvp) return [];
      const rows: IntakeAnswerRow[] = [];
      const deadline = formatIsoDate(rsvp.deadline);
      if (deadline) rows.push({ key, label: "Data limite", value: deadline });
      if (rsvp.askDietary !== undefined) {
        rows.push({
          key,
          label: "Restrições alimentares",
          value: rsvp.askDietary ? "Perguntar no formulário" : "Não perguntar",
        });
      }
      return rows;
    }
    case "colors": {
      const colors = answers.colors;
      const value = lines(colors?.text, colors?.swatches?.join(", "));
      return value ? [{ key, label: "Cores", value }] : [];
    }
    case "faqs": {
      const value = (answers.faqs ?? [])
        .filter((faq) => clean(faq.question) || clean(faq.answer))
        .map((faq) => `P: ${clean(faq.question)}\nR: ${clean(faq.answer)}`)
        .join("\n\n");
      return value ? [{ key, label: "Perguntas frequentes", value }] : [];
    }
    case "notes": {
      const value = clean(answers.notes?.text);
      return value ? [{ key, label: "Observações", value }] : [];
    }
  }
}

/** Answers grouped by wizard step, for the admin detail page and text export. */
export function formatIntakeAnswers(
  kind: IntakeKind,
  answers: IntakeAnswers,
  options: IntakeStepOptions,
): IntakeAnswerSection[] {
  return stepsFor(kind, options)
    .filter((step) => step.id !== "contact")
    .map((step) => ({
      stepId: step.id,
      title: INTAKE_STEP_TITLES[step.id],
      rows: step.keys.flatMap((key) => rowsForKey(key, answers)),
    }))
    .filter((section) => section.rows.length > 0);
}

/** Plain-text version for "Copiar respostas". */
export function intakeAnswersToText({
  kind,
  demoName,
  contact,
  answers,
  customizable,
}: {
  kind: IntakeKind;
  demoName: string;
  contact: IntakeContact;
  answers: IntakeAnswers;
  customizable: boolean;
}): string {
  const head = [
    `Formulário — ${demoName}`,
    `Cliente: ${clean(contact.name) || "—"}`,
    `WhatsApp: ${contact.whatsapp ? `+${contact.whatsapp}` : "—"}`,
  ];
  const body = formatIntakeAnswers(kind, answers, { customizable }).map(
    (section) =>
      [
        section.title.toLocaleUpperCase("pt-PT"),
        ...section.rows.map(
          (row) => `${row.label}: ${row.value.replace(/\n/g, "\n  ")}`,
        ),
      ].join("\n"),
  );
  return [head.join("\n"), ...body].join("\n\n");
}
