import { describe, expect, it } from "vitest";

import {
  changedKeysSince,
  foldAnswerRows,
  jsonEqual,
  formatIntakeAnswers,
  intakeAnswersToText,
  isIntakeUnseen,
} from "@/lib/intake/answers";

describe("foldAnswerRows", () => {
  it("turns key-value rows into an answers object and drops unknown keys", () => {
    expect(
      foldAnswerRows([
        { key: "event", value: { primaryName: "Ana" } },
        { key: "schedule", value: [{ time: "10:00", label: "Cerimónia" }] },
        { key: "legacy", value: 1 },
      ]),
    ).toEqual({
      event: { primaryName: "Ana" },
      schedule: [{ time: "10:00", label: "Cerimónia" }],
    });
  });
});

describe("changedKeysSince", () => {
  const rows = [
    { key: "event", updatedAt: new Date("2026-09-26T10:00:00Z") },
    { key: "schedule", updatedAt: new Date("2026-09-26T12:00:00Z") },
  ];

  it("marks answers written after the admin's last visit", () => {
    expect([
      ...changedKeysSince(rows, new Date("2026-09-26T11:00:00Z")),
    ]).toEqual(["schedule"]);
  });

  it("marks nothing before the first visit", () => {
    expect(changedKeysSince(rows, null).size).toBe(0);
  });
});

describe("isIntakeUnseen", () => {
  const submitted = {
    status: "submitted",
    adminViewedAt: null,
    answersUpdatedAt: new Date("2026-09-26T10:00:00Z"),
  };

  it("counts submitted intakes that were never opened or changed since", () => {
    expect(isIntakeUnseen(submitted)).toBe(true);
    expect(
      isIntakeUnseen({
        ...submitted,
        adminViewedAt: new Date("2026-09-26T11:00:00Z"),
      }),
    ).toBe(false);
    expect(
      isIntakeUnseen({
        ...submitted,
        adminViewedAt: new Date("2026-09-26T09:00:00Z"),
      }),
    ).toBe(true);
  });

  it("ignores drafts and intakes already in production", () => {
    expect(isIntakeUnseen({ ...submitted, status: "draft" })).toBe(false);
    expect(isIntakeUnseen({ ...submitted, status: "in_production" })).toBe(
      false,
    );
  });
});

describe("formatIntakeAnswers", () => {
  const answers = {
    event: {
      type: "other" as const,
      typeLabel: "Xiguiane",
      primaryName: "Ana",
      secondaryName: "João",
      date: "2027-05-20",
      time: "15:30",
    },
    parents: { enabled: true, bridesMother: "Maria" },
    locations: [
      {
        kind: "religious" as const,
        name: "Igreja",
        address: "Rua 1",
        mapsUrl: "https://maps.test/a",
      },
    ],
    schedule: [{ time: "15:30", label: "Cerimónia", venue: "Igreja" }],
    guestGuide: {
      enabled: true,
      presetIds: ["be-punctual"],
      customLabels: ["Tragam guarda-chuva"],
    },
    rsvp: { deadline: "2027-05-01", askDietary: false },
    music: { enabled: false, text: "ignored" },
    colors: { text: "Verde", swatches: ["#00ff00"] },
  };

  it("groups answers by wizard step with Portuguese labels", () => {
    const sections = formatIntakeAnswers("convite", answers, {
      customizable: true,
    });
    const event = sections.find((section) => section.stepId === "event");
    expect(event?.rows).toEqual(
      expect.arrayContaining([
        { key: "event", label: "Tipo de evento", value: "Xiguiane" },
        { key: "event", label: "Nomes", value: "Ana & João" },
        { key: "event", label: "Data", value: "20/05/2027 às 15:30" },
        { key: "parents", label: "Pais", value: "Mãe da noiva: Maria" },
      ]),
    );
    const guide = sections.find((section) => section.stepId === "guestGuide");
    expect(guide?.rows[0].value).toBe("Seja pontual!\nTragam guarda-chuva");
    const details = sections.find((section) => section.stepId === "details");
    expect(details?.rows).toEqual([
      { key: "music", label: "Música", value: "Não" },
    ]);
    const rsvp = sections.find((section) => section.stepId === "rsvp");
    expect(rsvp?.rows).toEqual([
      { key: "rsvp", label: "Data limite", value: "01/05/2027" },
      { key: "rsvp", label: "Restrições alimentares", value: "Não perguntar" },
    ]);
  });

  it("skips the contact step and steps with nothing answered", () => {
    const sections = formatIntakeAnswers("convite", {}, { customizable: false });
    expect(sections).toEqual([]);
  });

  it("renders a plain-text export with the contact on top", () => {
    const text = intakeAnswersToText({
      kind: "convite",
      demoName: "Aurora",
      contact: { name: "Ana", whatsapp: "258841234567" },
      answers,
      customizable: true,
    });
    expect(text.split("\n").slice(0, 3)).toEqual([
      "Formulário — Aurora",
      "Cliente: Ana",
      "WhatsApp: +258841234567",
    ]);
    expect(text).toContain("EVENTO");
    expect(text).toContain("Nomes: Ana & João");
  });
});

describe("jsonEqual", () => {
  it("ignores object key order, as Postgres jsonb reorders keys", () => {
    expect(
      jsonEqual(
        { text: "Gala", enabled: true, colors: ["#000000"] },
        { enabled: true, colors: ["#000000"], text: "Gala" },
      ),
    ).toBe(true);
  });

  it("detects real differences, including array order and missing keys", () => {
    expect(jsonEqual([{ a: 1 }, { b: 2 }], [{ b: 2 }, { a: 1 }])).toBe(false);
    expect(jsonEqual({ a: 1 }, { a: 1, b: undefined })).toBe(true);
    expect(jsonEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(jsonEqual("x", "y")).toBe(false);
    expect(jsonEqual(null, undefined)).toBe(false);
  });
});
