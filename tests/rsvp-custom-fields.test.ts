import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  findInvalidRsvpCustomField,
  formatRsvpCustomAnswers,
  getRsvpConditionTriggers,
  getVisibleRsvpCustomFields,
  normalizeRsvpCustomFields,
  reconcileRsvpCustomFieldConditions,
  toRsvpCustomAnswerInputs,
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

const kidsTrigger: RsvpCustomField = {
  id: "bring-kids",
  label: "Vai trazer crianças?",
  type: "radio",
  required: false,
  visibility: "attending",
  options: [
    { id: "yes", label: "Sim" },
    { id: "no", label: "Não" },
  ],
};

const kidsList: RsvpCustomField = {
  id: "kids",
  label: "Crianças",
  type: "list",
  required: true,
  visibility: "conditional",
  showWhen: { fieldId: "bring-kids", value: "yes" },
  columns: [
    { id: "age", label: "Idade", type: "number" },
    { id: "qty", label: "Quantidade", type: "number" },
  ],
};

const guestsList: RsvpCustomField = {
  id: "guests",
  label: "Acompanhantes",
  type: "list",
  required: false,
  visibility: "always",
  columns: [
    { id: "name", label: "Nome", type: "text" },
    {
      id: "menu",
      label: "Menu",
      type: "select",
      options: [
        { id: "fish", label: "Peixe" },
        { id: "meat", label: "Carne" },
      ],
    },
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

  it("keeps trimmed placeholders and omits blank ones", () => {
    expect(
      normalizeRsvpCustomFields({
        customFields: [
          { ...textField, placeholder: "  Ex: João e Maria  " },
          { ...switchField, placeholder: "   " },
        ],
      }),
    ).toEqual([
      { ...textField, placeholder: "Ex: João e Maria" },
      switchField,
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

describe("normalizeRsvpCustomFields: lists and conditions", () => {
  it("keeps a list with its columns, add label and condition", () => {
    expect(
      normalizeRsvpCustomFields({
        customFields: [
          kidsTrigger,
          { ...kidsList, addLabel: "  Adicionar criança  " },
        ],
      }),
    ).toEqual([kidsTrigger, { ...kidsList, addLabel: "Adicionar criança" }]);
  });

  it("drops invalid columns, caps them at three and drops a list left with none", () => {
    const column = (id: string) => ({ id, label: id, type: "text" });
    const [list] = normalizeRsvpCustomFields({
      customFields: [
        {
          ...guestsList,
          columns: [
            column("a"),
            { id: "b", label: "", type: "text" },
            { id: "c", label: "C", type: "date" },
            { id: "d", label: "D", type: "select", options: [] },
            column("e"),
            column("f"),
            column("g"),
          ],
        },
      ],
    });
    expect(list.columns?.map((item) => item.id)).toEqual(["a", "e", "f"]);

    expect(
      normalizeRsvpCustomFields({
        customFields: [{ ...guestsList, columns: [] }],
      }),
    ).toEqual([]);
    expect(
      normalizeRsvpCustomFields({
        customFields: [{ ...guestsList, columns: "bad" }],
      }),
    ).toEqual([]);
  });

  it("resets a dangling condition to always instead of dropping the field", () => {
    const cases: unknown[][] = [
      // trigger missing
      [kidsList],
      // trigger comes later
      [kidsList, kidsTrigger],
      // trigger is not a switch, radio or select
      [{ ...kidsTrigger, type: "text", options: undefined }, kidsList],
      // answer is not one of the trigger's options
      [
        kidsTrigger,
        { ...kidsList, showWhen: { fieldId: "bring-kids", value: "maybe" } },
      ],
      // no condition at all
      [kidsTrigger, { ...kidsList, showWhen: undefined }],
      // a switch trigger needs a boolean answer
      [
        switchField,
        { ...kidsList, showWhen: { fieldId: "children", value: "yes" } },
      ],
    ];

    for (const customFields of cases) {
      const kids = normalizeRsvpCustomFields({ customFields }).find(
        (field) => field.id === "kids",
      );
      expect(kids?.visibility).toBe("always");
      expect(kids && "showWhen" in kids).toBe(false);
    }
  });

  it("accepts a boolean condition on a switch and strips showWhen from non-conditional fields", () => {
    const fields = normalizeRsvpCustomFields({
      customFields: [
        switchField,
        { ...kidsList, showWhen: { fieldId: "children", value: true } },
        { ...textField, showWhen: { fieldId: "children", value: true } },
      ],
    });
    expect(fields[1].showWhen).toEqual({ fieldId: "children", value: true });
    expect("showWhen" in fields[2]).toBe(false);
  });
});

describe("getRsvpConditionTriggers", () => {
  it("offers only earlier switch, radio and select fields with their answers", () => {
    const fields = [
      textField,
      switchField,
      kidsTrigger,
      guestsList,
      kidsList,
      radioField,
    ];
    expect(getRsvpConditionTriggers(fields, "kids")).toEqual([
      {
        id: "children",
        label: "Quer trazer crianças?",
        answers: [
          { value: true, label: "Sim" },
          { value: false, label: "Não" },
        ],
      },
      {
        id: "bring-kids",
        label: "Vai trazer crianças?",
        answers: [
          { value: "yes", label: "Sim" },
          { value: "no", label: "Não" },
        ],
      },
    ]);
    expect(getRsvpConditionTriggers(fields, "transport-note")).toEqual([]);
    expect(getRsvpConditionTriggers(fields, "missing")).toEqual([]);
  });
});

describe("reconcileRsvpCustomFieldConditions", () => {
  it("returns the same objects when every condition is still valid", () => {
    const result = reconcileRsvpCustomFieldConditions([kidsTrigger, kidsList]);
    expect(result[0]).toBe(kidsTrigger);
    expect(result[1]).toBe(kidsList);
  });

  it("keeps a dependent chained on a field that was itself reset", () => {
    const followUp: RsvpCustomField = {
      id: "follow-up",
      label: "Precisa de cadeira?",
      type: "switch",
      required: false,
      visibility: "conditional",
      showWhen: { fieldId: "bring-kids", value: "yes" },
    };
    const chained: RsvpCustomField = {
      ...kidsList,
      showWhen: { fieldId: "follow-up", value: true },
    };

    // `bring-kids` was deleted: `follow-up` loses its condition, but `kids`
    // still hangs off `follow-up`, which is still there.
    const result = reconcileRsvpCustomFieldConditions([followUp, chained]);
    expect(result[0].visibility).toBe("always");
    expect("showWhen" in result[0]).toBe(false);
    expect(result[1].showWhen).toEqual({ fieldId: "follow-up", value: true });
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

describe("getVisibleRsvpCustomFields", () => {
  const ids = (attending: boolean, values: Record<string, unknown>) =>
    getVisibleRsvpCustomFields([kidsTrigger, kidsList], {
      attending,
      values,
    }).map((field) => field.id);

  it("shows a conditional field only while its trigger has the chosen answer", () => {
    expect(ids(true, {})).toEqual(["bring-kids"]);
    expect(ids(true, { "bring-kids": "no" })).toEqual(["bring-kids"]);
    expect(ids(true, { "bring-kids": "yes" })).toEqual(["bring-kids", "kids"]);
  });

  it("hides a dependent whenever its trigger is hidden", () => {
    expect(ids(false, { "bring-kids": "yes" })).toEqual([]);
  });

  it("treats an untouched switch as Não", () => {
    const whenOff: RsvpCustomField = {
      ...kidsList,
      showWhen: { fieldId: "children", value: false },
    };
    const whenOn: RsvpCustomField = {
      ...kidsList,
      id: "kids-on",
      showWhen: { fieldId: "children", value: true },
    };
    const visible = (values: Record<string, unknown>) =>
      getVisibleRsvpCustomFields([switchField, whenOff, whenOn], {
        attending: true,
        values,
      }).map((field) => field.id);

    expect(visible({})).toEqual(["children", "kids"]);
    expect(visible({ children: true })).toEqual(["children", "kids-on"]);
  });

  it("shows a field whose condition is dangling", () => {
    expect(
      getVisibleRsvpCustomFields([kidsList], {
        attending: false,
        values: {},
      }).map((field) => field.id),
    ).toEqual(["kids"]);
  });
});

describe("toRsvpCustomAnswerInputs", () => {
  it("sends switches as booleans and everything else untouched", () => {
    const rows = [{ age: "5", qty: "2" }];
    expect(
      toRsvpCustomAnswerInputs([switchField, textField, kidsList], {
        "transport-note": "Sim",
        kids: rows,
      }),
    ).toEqual([
      { fieldId: "children", value: false },
      { fieldId: "transport-note", value: "Sim" },
      { fieldId: "kids", value: rows },
    ]);
  });
});

describe("validateRsvpCustomAnswers: list fields", () => {
  const submit = (
    kids: unknown,
    bringKids: unknown = "yes",
    attending = true,
  ) =>
    validateRsvpCustomAnswers({
      fields: [kidsTrigger, kidsList],
      submittedAnswers: [
        { fieldId: "bring-kids", value: bringKids },
        { fieldId: "kids", value: kids },
      ],
      attending,
    });

  const submitGuests = (guests: unknown) =>
    validateRsvpCustomAnswers({
      fields: [guestsList],
      submittedAnswers: [{ fieldId: "guests", value: guests }],
      attending: true,
    });

  const triggerAnswer = {
    fieldId: "bring-kids",
    label: "Vai trazer crianças?",
    type: "radio",
    value: "yes",
    displayValue: "Sim",
  };

  it("stores rows with a display snapshot", () => {
    expect(
      submit([
        { age: "5", qty: "2" },
        { age: "8", qty: "1" },
      ]),
    ).toEqual({
      success: true,
      answers: [
        triggerAnswer,
        {
          fieldId: "kids",
          label: "Crianças",
          type: "list",
          value: [
            { age: "5", qty: "2" },
            { age: "8", qty: "1" },
          ],
          rows: [
            [
              { label: "Idade", value: "5" },
              { label: "Quantidade", value: "2" },
            ],
            [
              { label: "Idade", value: "8" },
              { label: "Quantidade", value: "1" },
            ],
          ],
          displayValue: "Idade 5 · Quantidade 2; Idade 8 · Quantidade 1",
        },
      ],
    });
  });

  it("drops empty rows and normalises numbers", () => {
    const result = submit([
      { age: "", qty: "  " },
      { age: 5, qty: "02" },
      {},
      { age: " 3 ", qty: "1" },
    ]);
    expect(result.success && result.answers[1].value).toEqual([
      { age: "5", qty: "2" },
      { age: "3", qty: "1" },
    ]);
  });

  it("rejects a partly filled row", () => {
    expect(submit([{ age: "5", qty: "" }])).toEqual({
      success: false,
      errors: [
        {
          field: "customAnswers.kids",
          message: "Crianças: preencha todos os campos de cada linha",
        },
      ],
    });
  });

  it("rejects a number cell that is not a whole number", () => {
    for (const age of ["cinco", "1.5", "-2", "1234567890"]) {
      expect(submit([{ age, qty: "1" }])).toEqual({
        success: false,
        errors: [
          {
            field: "customAnswers.kids",
            message: "Crianças: Idade deve ser um número inteiro",
          },
        ],
      });
    }
  });

  it("requires at least one complete row when the list is required", () => {
    for (const kids of [[], [{}, { age: "", qty: "" }]]) {
      expect(submit(kids)).toEqual({
        success: false,
        errors: [
          { field: "customAnswers.kids", message: "Crianças é obrigatório" },
        ],
      });
    }
  });

  it("treats a non-array answer as unanswered", () => {
    for (const kids of [undefined, null, "5 anos", { age: "5", qty: "1" }, 3]) {
      expect(submit(kids)).toEqual({
        success: false,
        errors: [
          { field: "customAnswers.kids", message: "Crianças é obrigatório" },
        ],
      });
      expect(submitGuests(kids)).toEqual({ success: true, answers: [] });
    }
  });

  it("stores nothing for an optional list left empty", () => {
    expect(submitGuests([{}])).toEqual({ success: true, answers: [] });
  });

  it("validates choice cells and snapshots the option label", () => {
    const valid = submitGuests([{ name: "Ana", menu: "fish" }]);
    expect(valid.success && valid.answers[0]).toMatchObject({
      value: [{ name: "Ana", menu: "fish" }],
      displayValue: "Nome Ana · Menu Peixe",
    });

    expect(submitGuests([{ name: "Ana", menu: "pasta" }])).toEqual({
      success: false,
      errors: [
        {
          field: "customAnswers.guests",
          message: "Acompanhantes: Menu tem uma opção inválida",
        },
      ],
    });
  });

  it("caps cell length and row count", () => {
    expect(
      submitGuests([{ name: "x".repeat(201), menu: "fish" }]),
    ).toEqual({
      success: false,
      errors: [
        {
          field: "customAnswers.guests",
          message: "Acompanhantes: Nome é demasiado longo",
        },
      ],
    });

    const tooMany = Array.from({ length: 21 }, () => ({
      name: "Ana",
      menu: "fish",
    }));
    expect(submitGuests(tooMany)).toEqual({
      success: false,
      errors: [
        {
          field: "customAnswers.guests",
          message: "Acompanhantes aceita no máximo 20 linhas",
        },
      ],
    });
    expect(submitGuests(tooMany.slice(0, 20)).success).toBe(true);
  });

  it("ignores answers for a hidden list, even invalid ones", () => {
    const partial = [{ age: "5", qty: "" }];

    // Guest filled rows, then switched the trigger back to "Não".
    expect(submit(partial, "no")).toEqual({
      success: true,
      answers: [{ ...triggerAnswer, value: "no", displayValue: "Não" }],
    });

    // Guest declined: the attending-only trigger and its list are both gone.
    expect(submit(partial, "yes", false)).toEqual({
      success: true,
      answers: [],
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

  it("returns list rows as one line each and keeps the flat value", () => {
    expect(
      formatRsvpCustomAnswers([
        {
          fieldId: "kids",
          label: "Crianças",
          type: "list",
          value: [
            { age: "5", qty: "2" },
            { age: "8", qty: "1" },
          ],
          rows: [
            [
              { label: "Idade", value: "5" },
              { label: "Quantidade", value: "2" },
            ],
            [
              { label: "Idade", value: "8" },
              { label: "Quantidade", value: "1" },
            ],
          ],
          displayValue: "Idade 5 · Quantidade 2; Idade 8 · Quantidade 1",
        },
      ]),
    ).toEqual([
      {
        label: "Crianças",
        value: "Idade 5 · Quantidade 2; Idade 8 · Quantidade 1",
        rows: ["Idade 5 · Quantidade 2", "Idade 8 · Quantidade 1"],
      },
    ]);
  });

  it("falls back to the flat value when the row snapshot is missing or malformed", () => {
    const goodRow = [
      { label: "Idade", value: "5" },
      { label: "Quantidade", value: "2" },
    ];
    const snapshots: unknown[] = [
      undefined,
      "bad",
      [],
      ["bad"],
      [[{ label: "", value: "5" }]],
      // A partly broken snapshot must not print a shortened list in place of
      // the complete flat value.
      [goodRow, "garbage"],
      [goodRow, []],
      [[{ label: "Idade", value: 5 }, goodRow[1]]],
    ];
    for (const rows of snapshots) {
      expect(
        formatRsvpCustomAnswers([
          { label: "Crianças", displayValue: "Idade 5", rows },
        ]),
      ).toEqual([{ label: "Crianças", value: "Idade 5" }]);
    }
  });
});

describe("findInvalidRsvpCustomField", () => {
  it("accepts complete fields", () => {
    expect(
      findInvalidRsvpCustomField([
        textField,
        radioField,
        kidsTrigger,
        kidsList,
        guestsList,
      ]),
    ).toBeUndefined();
    expect(findInvalidRsvpCustomField(undefined)).toBeUndefined();
  });

  it("flags a blank question, option-less choices and broken list columns", () => {
    const invalid: RsvpCustomField[] = [
      { ...textField, label: "  " },
      { ...radioField, options: [{ id: "a", label: " " }] },
      { ...kidsList, columns: [] },
      { ...kidsList, columns: [{ id: "age", label: "", type: "number" }] },
      {
        ...guestsList,
        columns: [{ id: "menu", label: "Menu", type: "select", options: [] }],
      },
    ];
    for (const field of invalid) {
      expect(findInvalidRsvpCustomField([textField, field])).toBe(field);
    }
  });

  it("flags a condition that points at an option left blank", () => {
    // Blank options are dropped when the form is read back, which would
    // silently turn the dependent into an always-visible field.
    const blankYes: RsvpCustomField = {
      ...kidsTrigger,
      options: [
        { id: "yes", label: "  " },
        { id: "no", label: "Não" },
      ],
    };
    expect(findInvalidRsvpCustomField([blankYes, kidsList])).toBe(kidsList);

    // A blank option nothing depends on stays allowed, as before.
    const dependsOnNo: RsvpCustomField = {
      ...kidsList,
      showWhen: { fieldId: "bring-kids", value: "no" },
    };
    expect(findInvalidRsvpCustomField([blankYes, dependsOnNo])).toBeUndefined();
  });
});

// Guest-facing RSVP surfaces read rsvp.customFields for every invitation
// type, so each admin form must expose the builder or its type can't use them.
describe("admin invitation forms expose RSVP custom fields", () => {
  for (const file of [
    "app/admin/invitations/InvitationForm.tsx",
    "app/admin/invitations/ExternalInvitationForm.tsx",
  ]) {
    const source = readFileSync(file, "utf8");
    it(`${file} renders the translation-aware builder`, () => {
      expect(source).toContain("<RsvpCustomFieldsBuilder");
      expect(source).toContain("sourceValue={sourceForm.rsvp.customFields}");
      expect(source).toContain("structureLocked={structureLocked}");
    });

    it(`${file} blocks saving incomplete custom fields`, () => {
      expect(source).toContain(
        "Preencha as perguntas e opções dos campos personalizados do RSVP.",
      );
    });
  }
});

// No DOM in this test environment, so the guest-side wiring is pinned by source.
describe("guest RSVP forms render list fields and share the answer mapping", () => {
  for (const file of [
    "components/shared/RSVPForm.tsx",
    "components/rsvp-page/RsvpPageForm.tsx",
  ]) {
    it(`${file} submits through toRsvpCustomAnswerInputs`, () => {
      expect(readFileSync(file, "utf8")).toContain(
        "toRsvpCustomAnswerInputs(customFields, customValues)",
      );
    });
  }

  it("the shared renderer applies the visibility chain and draws lists", () => {
    const source = readFileSync(
      "components/shared/RSVPCustomFields.tsx",
      "utf8",
    );
    expect(source).toContain(
      "getVisibleRsvpCustomFields(fields, { attending, values })",
    );
    expect(source).toContain("<RSVPCustomListField");
  });

  it("the legacy attending-only visibility helper is gone", () => {
    expect(readFileSync("lib/rsvp-custom-fields.ts", "utf8")).not.toContain(
      "isRsvpCustomFieldVisible",
    );
  });
});

describe("admin forms share the RSVP custom-field save guard", () => {
  for (const file of [
    "app/admin/invitations/InvitationForm.tsx",
    "app/admin/invitations/ExternalInvitationForm.tsx",
    "app/admin/save-the-dates/SaveTheDateForm.tsx",
  ]) {
    it(`${file} uses findInvalidRsvpCustomField`, () => {
      expect(readFileSync(file, "utf8")).toContain(
        "findInvalidRsvpCustomField(",
      );
    });
  }

  it("AI-built invitations are not offered the list type", () => {
    expect(
      readFileSync("app/admin/invitations/InvitationForm.tsx", "utf8"),
    ).toContain("allowListType={!isAi}");
  });

  it("the builder reconciles conditions on every structural edit", () => {
    const source = readFileSync(
      "components/admin/RsvpCustomFieldsBuilder.tsx",
      "utf8",
    );
    expect(source).toContain("reconcileRsvpCustomFieldConditions(next)");
    expect(source).toContain("<RsvpCustomListColumnsEditor");
    expect(source).toContain("<RsvpCustomFieldConditionEditor");
  });
});

describe("RSVP reports render list rows", () => {
  for (const file of [
    "app/admin/rsvps/RsvpsClient.tsx",
    "app/[locale]/confirmacoes/[token]/page.tsx",
    "components/pdf/RsvpExportDocument.tsx",
  ]) {
    it(`${file} renders answer.rows`, () => {
      expect(readFileSync(file, "utf8")).toContain("answer.rows");
    });
  }
});
