import type {
  RsvpCustomAnswer,
  RsvpCustomAnswerCell,
  RsvpCustomAnswerInput,
  RsvpCustomField,
  RsvpCustomFieldCondition,
  RsvpCustomFieldOption,
  RsvpCustomFieldType,
  RsvpCustomFieldVisibility,
  RsvpCustomListColumn,
  RsvpCustomListColumnType,
  RsvpCustomListRow,
} from "@/lib/types";

export const RSVP_LIST_MAX_COLUMNS = 3;
export const RSVP_LIST_MAX_ROWS = 20;
export const RSVP_LIST_CELL_MAX_LENGTH = 200;

const FIELD_TYPES = new Set<RsvpCustomFieldType>([
  "text",
  "textarea",
  "switch",
  "radio",
  "select",
  "list",
]);

const VISIBILITIES = new Set<RsvpCustomFieldVisibility>([
  "always",
  "attending",
  "conditional",
]);

const COLUMN_TYPES = new Set<RsvpCustomListColumnType>([
  "text",
  "number",
  "select",
]);

const WHOLE_NUMBER = /^\d{1,9}$/;

export type RsvpCustomAnswerError = {
  field: string;
  message: string;
};

export type RsvpCustomAnswerValidationResult =
  | { success: true; answers: RsvpCustomAnswer[] }
  | { success: false; errors: RsvpCustomAnswerError[] };

export type RsvpConditionAnswer = { value: string | boolean; label: string };

/** An earlier field a condition can depend on, with its possible answers. */
export type RsvpConditionTrigger = {
  id: string;
  label: string;
  answers: RsvpConditionAnswer[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function trimString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptions(value: unknown): RsvpCustomFieldOption[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((option) => {
      const record = asRecord(option);
      if (!record) return null;
      const id = trimString(record.id);
      const label = trimString(record.label);
      return id && label ? { id, label } : null;
    })
    .filter((option): option is RsvpCustomFieldOption => option !== null);
}

function normalizeColumns(value: unknown): RsvpCustomListColumn[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((column) => {
      const record = asRecord(column);
      if (!record) return null;
      const id = trimString(record.id);
      const label = trimString(record.label);
      const type = record.type;
      if (!id || !label || !COLUMN_TYPES.has(type as RsvpCustomListColumnType)) {
        return null;
      }

      const normalized: RsvpCustomListColumn = {
        id,
        label,
        type: type as RsvpCustomListColumnType,
      };
      const placeholder = trimString(record.placeholder);
      if (placeholder) normalized.placeholder = placeholder;

      if (normalized.type === "select") {
        const options = normalizeOptions(record.options);
        if (options.length === 0) return null;
        normalized.options = options;
      }
      return normalized;
    })
    .filter((column): column is RsvpCustomListColumn => column !== null)
    .slice(0, RSVP_LIST_MAX_COLUMNS);
}

function normalizeCondition(value: unknown): RsvpCustomFieldCondition | null {
  const record = asRecord(value);
  if (!record) return null;
  const fieldId = trimString(record.fieldId);
  if (!fieldId) return null;
  if (typeof record.value === "boolean") {
    return { fieldId, value: record.value };
  }
  const optionId = trimString(record.value);
  return optionId ? { fieldId, value: optionId } : null;
}

function conditionAnswers(field: RsvpCustomField): RsvpConditionAnswer[] {
  if (field.type === "switch") {
    return [
      { value: true, label: "Sim" },
      { value: false, label: "Não" },
    ];
  }
  if (field.type === "radio" || field.type === "select") {
    return (field.options ?? []).map((option) => ({
      value: option.id,
      label: option.label,
    }));
  }
  return [];
}

/**
 * The fields a condition on `fieldId` may depend on: switch, radio and select
 * fields placed before it. Only looking backwards rules out cycles and means
 * the guest always meets the trigger first.
 */
export function getRsvpConditionTriggers(
  fields: RsvpCustomField[],
  fieldId: string,
): RsvpConditionTrigger[] {
  const index = fields.findIndex((field) => field.id === fieldId);
  if (index <= 0) return [];
  return fields
    .slice(0, index)
    .map((field) => ({
      id: field.id,
      label: field.label,
      answers: conditionAnswers(field),
    }))
    .filter((trigger) => trigger.answers.length > 0);
}

function withoutCondition(field: RsvpCustomField): RsvpCustomField {
  const next = { ...field };
  delete next.showWhen;
  return next;
}

/**
 * Resets conditions that can no longer be evaluated (trigger deleted, moved
 * below, retyped, or its chosen option removed) to "always". Showing an extra
 * question is a safer failure than silently losing one. Untouched fields are
 * returned by identity.
 */
export function reconcileRsvpCustomFieldConditions(
  fields: RsvpCustomField[],
): RsvpCustomField[] {
  return fields.map((field) => {
    if (field.visibility !== "conditional") {
      return field.showWhen === undefined ? field : withoutCondition(field);
    }

    const condition = field.showWhen;
    const trigger = condition
      ? getRsvpConditionTriggers(fields, field.id).find(
          (item) => item.id === condition.fieldId,
        )
      : undefined;
    if (
      condition &&
      trigger?.answers.some((answer) => answer.value === condition.value)
    ) {
      return field;
    }
    return { ...withoutCondition(field), visibility: "always" };
  });
}

export function normalizeRsvpCustomFields(
  config: unknown,
): RsvpCustomField[] {
  const record = asRecord(config);
  const customFields = record?.customFields;
  if (!Array.isArray(customFields)) return [];

  const fields = customFields
    .map((field) => {
      const fieldRecord = asRecord(field);
      if (!fieldRecord) return null;

      const id = trimString(fieldRecord.id);
      const label = trimString(fieldRecord.label);
      const type = fieldRecord.type;
      const visibility = fieldRecord.visibility;

      if (!id || !label || !FIELD_TYPES.has(type as RsvpCustomFieldType)) {
        return null;
      }
      if (!VISIBILITIES.has(visibility as RsvpCustomFieldVisibility)) {
        return null;
      }

      const normalized: RsvpCustomField = {
        id,
        label,
        type: type as RsvpCustomFieldType,
        required: fieldRecord.required === true,
        visibility: visibility as RsvpCustomFieldVisibility,
      };

      if (normalized.visibility === "conditional") {
        const showWhen = normalizeCondition(fieldRecord.showWhen);
        if (showWhen) normalized.showWhen = showWhen;
      }

      const placeholder = trimString(fieldRecord.placeholder);
      if (placeholder) {
        normalized.placeholder = placeholder;
      }

      if (normalized.type === "radio" || normalized.type === "select") {
        const options = normalizeOptions(fieldRecord.options);
        if (options.length === 0) return null;
        normalized.options = options;
      }

      if (normalized.type === "list") {
        const columns = normalizeColumns(fieldRecord.columns);
        if (columns.length === 0) return null;
        normalized.columns = columns;
        const addLabel = trimString(fieldRecord.addLabel);
        if (addLabel) normalized.addLabel = addLabel;
      }

      return normalized;
    })
    .filter((field): field is RsvpCustomField => field !== null);

  return reconcileRsvpCustomFieldConditions(fields);
}

export type RsvpCustomVisibilityContext = {
  attending: boolean;
  /** Current answers by field id: form state on the client, the submission on the server. */
  values: Record<string, unknown>;
};

function conditionMatches(
  trigger: RsvpCustomField,
  answer: unknown,
  expected: string | boolean,
): boolean {
  // An untouched switch reads as "Não", which is also how the forms submit it.
  if (trigger.type === "switch") return (answer === true) === expected;
  return typeof answer === "string" && answer.trim() === expected;
}

/**
 * The fields to show, in order. A conditional field is visible only if its
 * trigger is itself visible and currently has the chosen answer.
 */
export function getVisibleRsvpCustomFields(
  fields: RsvpCustomField[],
  { attending, values }: RsvpCustomVisibilityContext,
): RsvpCustomField[] {
  const visibleById = new Map<string, RsvpCustomField>();

  for (const field of reconcileRsvpCustomFieldConditions(fields)) {
    let visible = true;
    if (field.visibility === "attending") {
      visible = attending;
    } else if (field.visibility === "conditional" && field.showWhen) {
      const trigger = visibleById.get(field.showWhen.fieldId);
      visible =
        trigger !== undefined &&
        conditionMatches(trigger, values[trigger.id], field.showWhen.value);
    }
    if (visible) visibleById.set(field.id, field);
  }

  return [...visibleById.values()];
}

/** Form state -> the `customAnswers` shape the validator and the API expect. */
export function toRsvpCustomAnswerInputs(
  fields: RsvpCustomField[],
  values: Record<string, unknown>,
): RsvpCustomAnswerInput[] {
  return fields.map((field) => ({
    fieldId: field.id,
    value:
      field.type === "switch" ? values[field.id] === true : values[field.id],
  }));
}

function normalizeSubmittedAnswers(value: unknown): RsvpCustomAnswerInput[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((answer) => {
      const record = asRecord(answer);
      if (!record) return null;
      const fieldId = trimString(record.fieldId);
      return fieldId ? { fieldId, value: record.value } : null;
    })
    .filter((answer): answer is RsvpCustomAnswerInput => answer !== null);
}

function hasAnswer(field: RsvpCustomField, value: unknown): boolean {
  if (field.type === "switch") return typeof value === "boolean";
  return typeof value === "string" && value.trim().length > 0;
}

function buildAnswer(
  field: RsvpCustomField,
  value: unknown,
): RsvpCustomAnswer | RsvpCustomAnswerError {
  if (field.type === "switch") {
    if (typeof value !== "boolean") {
      return {
        field: `customAnswers.${field.id}`,
        message: `${field.label} é obrigatório`,
      };
    }
    return {
      fieldId: field.id,
      label: field.label,
      type: field.type,
      value,
      displayValue: value ? "Sim" : "Não",
    };
  }

  const stringValue = trimString(value);
  if (!stringValue) {
    return {
      field: `customAnswers.${field.id}`,
      message: `${field.label} é obrigatório`,
    };
  }

  if (field.type === "radio" || field.type === "select") {
    const option = field.options?.find((item) => item.id === stringValue);
    if (!option) {
      return {
        field: `customAnswers.${field.id}`,
        message: `${field.label} tem uma opção inválida`,
      };
    }
    return {
      fieldId: field.id,
      label: field.label,
      type: field.type,
      value: option.id,
      displayValue: option.label,
    };
  }

  return {
    fieldId: field.id,
    label: field.label,
    type: field.type,
    value: stringValue,
    displayValue: stringValue,
  };
}

function cellText(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return trimString(value);
}

function formatListRow(cells: RsvpCustomAnswerCell[]): string {
  return cells.map((cell) => `${cell.label} ${cell.value}`).join(" · ");
}

/**
 * Validates a list answer. Returns null when there is nothing to store (no
 * complete row), an error for the first problem found, or the answer snapshot.
 */
function buildListAnswer(
  field: RsvpCustomField,
  value: unknown,
): RsvpCustomAnswer | RsvpCustomAnswerError | null {
  const columns = field.columns ?? [];
  const error = (message: string): RsvpCustomAnswerError => ({
    field: `customAnswers.${field.id}`,
    message,
  });

  if (!Array.isArray(value)) return null;
  if (value.length > RSVP_LIST_MAX_ROWS) {
    return error(
      `${field.label} aceita no máximo ${RSVP_LIST_MAX_ROWS} linhas`,
    );
  }

  const rows: RsvpCustomListRow[] = [];
  const display: RsvpCustomAnswerCell[][] = [];

  for (const entry of value) {
    const record = asRecord(entry);
    const cells = columns.map((column) => cellText(record?.[column.id]));
    if (cells.every((cell) => !cell)) continue;
    if (cells.some((cell) => !cell)) {
      return error(`${field.label}: preencha todos os campos de cada linha`);
    }

    const row: RsvpCustomListRow = {};
    const displayRow: RsvpCustomAnswerCell[] = [];
    for (const [index, column] of columns.entries()) {
      let stored = cells[index];
      let shown = stored;

      if (column.type === "number") {
        if (!WHOLE_NUMBER.test(stored)) {
          return error(
            `${field.label}: ${column.label} deve ser um número inteiro`,
          );
        }
        stored = String(Number(stored));
        shown = stored;
      } else if (column.type === "select") {
        const option = column.options?.find((item) => item.id === stored);
        if (!option) {
          return error(
            `${field.label}: ${column.label} tem uma opção inválida`,
          );
        }
        shown = option.label;
      } else if (stored.length > RSVP_LIST_CELL_MAX_LENGTH) {
        return error(`${field.label}: ${column.label} é demasiado longo`);
      }

      row[column.id] = stored;
      displayRow.push({ label: column.label, value: shown });
    }
    rows.push(row);
    display.push(displayRow);
  }

  if (rows.length === 0) return null;

  return {
    fieldId: field.id,
    label: field.label,
    type: field.type,
    value: rows,
    rows: display,
    displayValue: display.map(formatListRow).join("; "),
  };
}

export function validateRsvpCustomAnswers({
  fields,
  submittedAnswers,
  attending,
}: {
  fields: RsvpCustomField[];
  submittedAnswers: unknown;
  attending: boolean;
}): RsvpCustomAnswerValidationResult {
  const submitted = normalizeSubmittedAnswers(submittedAnswers);
  const fieldById = new Map(fields.map((field) => [field.id, field]));
  const submittedById = new Map(
    submitted.map((answer) => [answer.fieldId, answer]),
  );
  const errors: RsvpCustomAnswerError[] = [];
  const answers: RsvpCustomAnswer[] = [];

  for (const answer of submitted) {
    if (!fieldById.has(answer.fieldId)) {
      errors.push({
        field: `customAnswers.${answer.fieldId}`,
        message: "Campo personalizado inválido",
      });
    }
  }

  // Visibility is recomputed from the submission itself, so answers sent for
  // a hidden field are never validated or stored.
  const visibleFields = getVisibleRsvpCustomFields(fields, {
    attending,
    values: Object.fromEntries(
      submitted.map((answer) => [answer.fieldId, answer.value]),
    ),
  });

  for (const field of visibleFields) {
    const submittedAnswer = submittedById.get(field.id);
    const required: RsvpCustomAnswerError = {
      field: `customAnswers.${field.id}`,
      message: `${field.label} é obrigatório`,
    };

    if (field.type === "list") {
      const answer = buildListAnswer(field, submittedAnswer?.value);
      if (answer === null) {
        if (field.required) errors.push(required);
      } else if ("field" in answer) {
        errors.push(answer);
      } else {
        answers.push(answer);
      }
      continue;
    }

    if (!submittedAnswer || !hasAnswer(field, submittedAnswer.value)) {
      if (field.required) errors.push(required);
      continue;
    }

    const answer = buildAnswer(field, submittedAnswer.value);
    if ("field" in answer) {
      errors.push(answer);
    } else {
      answers.push(answer);
    }
  }

  return errors.length > 0
    ? { success: false, errors }
    : { success: true, answers };
}

export type RsvpCustomAnswerSummary = {
  label: string;
  value: string;
  /** List answers: one line per row. Absent for every other field type. */
  rows?: string[];
};

/**
 * One line per row of a stored list answer. All or nothing: if any part of the
 * snapshot is unreadable the caller falls back to the flat `displayValue`,
 * rather than printing a shortened list that looks complete.
 */
function formatAnswerRows(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const lines: string[] = [];

  for (const row of value) {
    if (!Array.isArray(row) || row.length === 0) return [];
    const cells: RsvpCustomAnswerCell[] = [];
    for (const cell of row) {
      const record = asRecord(cell);
      const label = trimString(record?.label);
      const cellValue = trimString(record?.value);
      if (!label || !cellValue) return [];
      cells.push({ label, value: cellValue });
    }
    lines.push(formatListRow(cells));
  }

  return lines;
}

export function formatRsvpCustomAnswers(
  value: unknown,
): RsvpCustomAnswerSummary[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((answer): RsvpCustomAnswerSummary | null => {
      const record = asRecord(answer);
      if (!record) return null;
      const label = trimString(record.label);
      const displayValue = trimString(record.displayValue);
      if (!label || !displayValue) return null;
      const rows = formatAnswerRows(record.rows);
      return rows.length > 0
        ? { label, value: displayValue, rows }
        : { label, value: displayValue };
    })
    .filter((answer): answer is RsvpCustomAnswerSummary => answer !== null);
}

function hasLabelledOption(
  options: RsvpCustomFieldOption[] | undefined,
): boolean {
  return (options ?? []).some((option) => option.label.trim());
}

/** Admin save guard: the first field that could not be shown to a guest as configured. */
export function findInvalidRsvpCustomField(
  fields: RsvpCustomField[] | undefined,
): RsvpCustomField | undefined {
  const all = fields ?? [];
  return all.find((field) => {
    if (!field.label.trim()) return true;
    if (
      (field.type === "radio" || field.type === "select") &&
      !hasLabelledOption(field.options)
    ) {
      return true;
    }
    if (field.type === "list") {
      const columns = field.columns ?? [];
      if (
        columns.length === 0 ||
        columns.some(
          (column) =>
            !column.label.trim() ||
            (column.type === "select" && !hasLabelledOption(column.options)),
        )
      ) {
        return true;
      }
    }

    // A blank option is dropped when the form is read back. A condition that
    // points at one would vanish with it, leaving this field always visible.
    const condition =
      field.visibility === "conditional" ? field.showWhen : undefined;
    if (condition) {
      const answer = all
        .find((item) => item.id === condition.fieldId)
        ?.options?.find((option) => option.id === condition.value);
      if (answer && !answer.label.trim()) return true;
    }
    return false;
  });
}
