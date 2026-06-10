import { describe, expect, it } from "vitest";

import {
  formatRsvpCustomAnswers,
  normalizeRsvpCustomFields,
  validateRsvpCustomAnswers,
} from "@/lib/rsvp-custom-fields";
import type { RsvpCustomField } from "@/lib/types";

const textField: RsvpCustomField = {
  id: "transport-note",
  label: "Vai precisar de transporte?",
  type: "text",
  required: true,
  visibility: "attending",
};

const switchField: RsvpCustomField = {
  id: "children",
  label: "Quer trazer crianças?",
  type: "switch",
  required: true,
  visibility: "always",
};

const radioField: RsvpCustomField = {
  id: "meal",
  label: "Escolha a refeição",
  type: "radio",
  required: true,
  visibility: "attending",
  options: [
    { id: "fish", label: "Peixe" },
    { id: "meat", label: "Carne" },
  ],
};

describe("normalizeRsvpCustomFields", () => {
  it("returns an empty array when customFields is missing or malformed", () => {
    expect(normalizeRsvpCustomFields(undefined)).toEqual([]);
    expect(normalizeRsvpCustomFields({ customFields: "bad" })).toEqual([]);
  });

  it("trims labels, removes invalid fields, and keeps stable ids", () => {
    expect(
      normalizeRsvpCustomFields({
        customFields: [
          { ...textField, label: "  Transporte  " },
          {
            id: "bad",
            label: "No type",
            required: true,
            visibility: "always",
          },
          { ...radioField, options: [{ id: " fish ", label: " Peixe " }] },
        ],
      }),
    ).toEqual([
      { ...textField, label: "Transporte" },
      { ...radioField, options: [{ id: "fish", label: "Peixe" }] },
    ]);
  });

  it("drops radio and select fields without options", () => {
    expect(
      normalizeRsvpCustomFields({
        customFields: [{ ...radioField, options: [] }],
      }),
    ).toEqual([]);
  });
});

describe("validateRsvpCustomAnswers", () => {
  it("requires visible required fields", () => {
    const result = validateRsvpCustomAnswers({
      fields: [textField],
      submittedAnswers: [],
      attending: true,
    });
    expect(result.success).toBe(false);
    expect(result.success ? [] : result.errors).toEqual([
      {
        field: "customAnswers.transport-note",
        message: "Vai precisar de transporte? é obrigatório",
      },
    ]);
  });

  it("does not require attending-only fields when guest declines", () => {
    expect(
      validateRsvpCustomAnswers({
        fields: [textField],
        submittedAnswers: [],
        attending: false,
      }),
    ).toEqual({ success: true, answers: [] });
  });

  it("accepts false as a required switch answer", () => {
    expect(
      validateRsvpCustomAnswers({
        fields: [switchField],
        submittedAnswers: [{ fieldId: "children", value: false }],
        attending: false,
      }),
    ).toEqual({
      success: true,
      answers: [
        {
          fieldId: "children",
          label: "Quer trazer crianças?",
          type: "switch",
          value: false,
          displayValue: "Não",
        },
      ],
    });
  });

  it("rejects unknown field ids", () => {
    const result = validateRsvpCustomAnswers({
      fields: [textField],
      submittedAnswers: [{ fieldId: "unknown", value: "x" }],
      attending: true,
    });
    expect(result.success).toBe(false);
    expect(result.success ? [] : result.errors[0]).toEqual({
      field: "customAnswers.unknown",
      message: "Campo personalizado inválido",
    });
  });

  it("rejects invalid radio option ids and stores display labels", () => {
    const invalid = validateRsvpCustomAnswers({
      fields: [radioField],
      submittedAnswers: [{ fieldId: "meal", value: "pasta" }],
      attending: true,
    });
    expect(invalid.success).toBe(false);

    expect(
      validateRsvpCustomAnswers({
        fields: [radioField],
        submittedAnswers: [{ fieldId: "meal", value: "fish" }],
        attending: true,
      }),
    ).toEqual({
      success: true,
      answers: [
        {
          fieldId: "meal",
          label: "Escolha a refeição",
          type: "radio",
          value: "fish",
          displayValue: "Peixe",
        },
      ],
    });
  });
});

describe("formatRsvpCustomAnswers", () => {
  it("formats only submitted answer snapshots", () => {
    expect(
      formatRsvpCustomAnswers([
        {
          fieldId: "meal",
          label: "Escolha a refeição",
          type: "select",
          value: "fish",
          displayValue: "Peixe",
        },
      ]),
    ).toEqual([{ label: "Escolha a refeição", value: "Peixe" }]);
  });

  it("returns an empty array for null and malformed values", () => {
    expect(formatRsvpCustomAnswers(null)).toEqual([]);
    expect(formatRsvpCustomAnswers("bad")).toEqual([]);
  });
});
