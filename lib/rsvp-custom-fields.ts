import type {
  RsvpCustomAnswer,
  RsvpCustomAnswerInput,
  RsvpCustomField,
  RsvpCustomFieldOption,
  RsvpCustomFieldType,
  RsvpCustomFieldVisibility,
} from "@/lib/types";

const FIELD_TYPES = new Set<RsvpCustomFieldType>([
  "text",
  "textarea",
  "switch",
  "radio",
  "select",
]);

const VISIBILITIES = new Set<RsvpCustomFieldVisibility>([
  "always",
  "attending",
]);

export type RsvpCustomAnswerError = {
  field: string;
  message: string;
};

export type RsvpCustomAnswerValidationResult =
  | { success: true; answers: RsvpCustomAnswer[] }
  | { success: false; errors: RsvpCustomAnswerError[] };

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

export function normalizeRsvpCustomFields(
  config: unknown,
): RsvpCustomField[] {
  const record = asRecord(config);
  const customFields = record?.customFields;
  if (!Array.isArray(customFields)) return [];

  return customFields
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

      if (normalized.type === "radio" || normalized.type === "select") {
        const options = normalizeOptions(fieldRecord.options);
        if (options.length === 0) return null;
        normalized.options = options;
      }

      return normalized;
    })
    .filter((field): field is RsvpCustomField => field !== null);
}

export function isRsvpCustomFieldVisible(
  field: RsvpCustomField,
  attending: boolean,
): boolean {
  return field.visibility === "always" || attending;
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

  for (const field of fields) {
    if (!isRsvpCustomFieldVisible(field, attending)) continue;
    const submittedAnswer = submittedById.get(field.id);

    if (!submittedAnswer || !hasAnswer(field, submittedAnswer.value)) {
      if (field.required) {
        errors.push({
          field: `customAnswers.${field.id}`,
          message: `${field.label} é obrigatório`,
        });
      }
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

export function formatRsvpCustomAnswers(
  value: unknown,
): { label: string; value: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((answer) => {
      const record = asRecord(answer);
      if (!record) return null;
      const label = trimString(record.label);
      const displayValue = trimString(record.displayValue);
      return label && displayValue ? { label, value: displayValue } : null;
    })
    .filter(
      (answer): answer is { label: string; value: string } => answer !== null,
    );
}
