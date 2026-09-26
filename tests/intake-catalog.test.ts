import { describe, expect, it } from "vitest";

import {
  INTAKE_ANSWER_KEYS,
  isIntakeStepId,
  isReadOnlyStatus,
  parseAnswers,
  parseContact,
  parseIntakeKind,
  resolveEventChoice,
  stepsFor,
  validateAll,
  validateStep,
} from "@/lib/intake/catalog";
import type { IntakeAnswers } from "@/lib/intake/catalog";

const contact = { name: "Ana Silva", whatsapp: "258841234567" };

const validInvitation: IntakeAnswers = {
  event: {
    type: "wedding",
    primaryName: "Ana",
    secondaryName: "João",
    date: "2027-05-20",
    time: "15:30",
  },
  locations: [{ kind: "religious", name: "Igreja de Santo António" }],
};

describe("intake catalogue — steps", () => {
  it("lists the invitation steps, with colors and faqs only when customizable", () => {
    const customizable = stepsFor("convite", { customizable: true });
    expect(customizable.map((step) => step.id)).toEqual([
      "contact",
      "event",
      "locations",
      "schedule",
      "details",
      "guestGuide",
      "rsvp",
      "extras",
    ]);
    expect(customizable.at(-1)?.keys).toEqual(["colors", "faqs", "notes"]);

    const preDesigned = stepsFor("convite", { customizable: false });
    expect(preDesigned.at(-1)?.keys).toEqual(["notes"]);
  });

  it("lists the three Save the Date steps", () => {
    const steps = stepsFor("save-the-date", { customizable: true });
    expect(steps.map((step) => step.id)).toEqual([
      "contact",
      "event",
      "details",
    ]);
    expect(steps[2].keys).toEqual(["rsvp", "music", "colors", "notes"]);
    expect(
      stepsFor("save-the-date", { customizable: false })[2].keys,
    ).toEqual(["rsvp", "music", "notes"]);
  });

  it("recognises step ids per kind", () => {
    expect(isIntakeStepId("convite", "schedule")).toBe(true);
    expect(isIntakeStepId("save-the-date", "schedule")).toBe(false);
    expect(isIntakeStepId("convite", "nope")).toBe(false);
  });

  it("every step key is a known answer key", () => {
    for (const kind of ["convite", "save-the-date"] as const) {
      for (const step of stepsFor(kind, { customizable: true })) {
        for (const key of step.keys) {
          expect(INTAKE_ANSWER_KEYS).toContain(key);
        }
      }
    }
  });

  it("parses kinds and read-only statuses", () => {
    expect(parseIntakeKind("convite")).toBe("convite");
    expect(parseIntakeKind("save-the-date")).toBe("save-the-date");
    expect(parseIntakeKind("invitation")).toBeNull();
    expect(isReadOnlyStatus("in_production")).toBe(true);
    expect(isReadOnlyStatus("archived")).toBe(true);
    expect(isReadOnlyStatus("submitted")).toBe(false);
    expect(isReadOnlyStatus("draft")).toBe(false);
  });
});

describe("intake catalogue — contact", () => {
  it("strips formatting from the WhatsApp number and requires a name", () => {
    expect(
      parseContact({ name: " Ana ", whatsapp: "+258 84 123 4567" }, "strict"),
    ).toEqual({ ok: true, contact: { name: "Ana", whatsapp: "258841234567" } });

    const missing = parseContact({ name: "", whatsapp: "123" }, "strict");
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.issues.map((issue) => issue.field).sort()).toEqual([
        "name",
        "whatsapp",
      ]);
    }
  });

  it("accepts a partial contact in lenient mode", () => {
    expect(parseContact({ name: "An" }, "lenient")).toEqual({
      ok: true,
      contact: { name: "An" },
    });
  });
});

describe("intake catalogue — answers", () => {
  it("rejects unknown answer keys", () => {
    const result = parseAnswers({ event: {}, hacker: 1 }, "lenient");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0].field).toBe("hacker");
  });

  it("rejects a non-object answers payload", () => {
    expect(parseAnswers([], "lenient").ok).toBe(false);
    expect(parseAnswers("x", "lenient").ok).toBe(false);
  });

  it("accepts partial drafts with empty strings in lenient mode", () => {
    const result = parseAnswers(
      {
        event: { type: "wedding", primaryName: "", date: "" },
        schedule: [{ time: "", label: "" }],
        locations: [{ name: "" }],
      },
      "lenient",
    );
    expect(result.ok).toBe(true);
  });

  it("still enforces enums, formats and maximum lengths in lenient mode", () => {
    expect(parseAnswers({ event: { type: "party" } }, "lenient").ok).toBe(
      false,
    );
    expect(parseAnswers({ event: { date: "20/05/2027" } }, "lenient").ok).toBe(
      false,
    );
    expect(
      parseAnswers({ notes: { text: "x".repeat(2001) } }, "lenient").ok,
    ).toBe(false);
    expect(
      parseAnswers(
        { locations: [{}, {}, {}, {}] },
        "lenient",
      ).ok,
    ).toBe(false);
  });

  it("requires names, date and a label for 'other' events in strict mode", () => {
    const result = parseAnswers(
      { event: { type: "other", primaryName: "", date: "" } },
      "strict",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.field).sort()).toEqual([
        "event.date",
        "event.primaryName",
        "event.typeLabel",
      ]);
    }
  });

  it("rejects impossible calendar dates", () => {
    expect(
      parseAnswers(
        { event: { type: "wedding", primaryName: "A", date: "2027-02-30" } },
        "strict",
      ).ok,
    ).toBe(false);
  });

  it("validates schedule times, hex swatches and guest-guide presets", () => {
    expect(
      parseAnswers({ schedule: [{ time: "25:00", label: "Festa" }] }, "strict")
        .ok,
    ).toBe(false);
    expect(
      parseAnswers({ colors: { swatches: ["#abcdef", "red"] } }, "strict").ok,
    ).toBe(false);
    expect(
      parseAnswers(
        { guestGuide: { enabled: true, presetIds: ["be-punctual", "nope"] } },
        "strict",
      ).ok,
    ).toBe(false);
    expect(
      parseAnswers(
        {
          guestGuide: {
            enabled: true,
            presetIds: ["be-punctual", "no-children"],
            customLabels: ["Tragam guarda-chuva"],
          },
        },
        "strict",
      ).ok,
    ).toBe(true);
  });

  it("adds https:// to a pasted maps link without a scheme", () => {
    const result = parseAnswers(
      { locations: [{ name: "Quinta", mapsUrl: "maps.app.goo.gl/abc" }] },
      "strict",
    );
    expect(result).toEqual({
      ok: true,
      answers: {
        locations: [
          { name: "Quinta", mapsUrl: "https://maps.app.goo.gl/abc" },
        ],
      },
    });
  });

  it("maps the event choice back from type and label", () => {
    expect(resolveEventChoice({ type: "wedding" })).toBe("wedding");
    expect(resolveEventChoice({ type: "other", typeLabel: "Xiguiane" })).toBe(
      "xiguiane",
    );
    expect(resolveEventChoice({ type: "other", typeLabel: "Graduação" })).toBe(
      "graduation",
    );
    expect(resolveEventChoice({ type: "other", typeLabel: "Festa" })).toBe(
      "other",
    );
    expect(resolveEventChoice(undefined)).toBeNull();
  });
});

describe("intake catalogue — step and full validation", () => {
  it("validates one step against the strict rules", () => {
    expect(
      validateStep("convite", "event", contact, validInvitation, {
        customizable: true,
      }),
    ).toEqual([]);

    const issues = validateStep("convite", "locations", contact, {}, {
      customizable: true,
    });
    expect(issues).toEqual([{ field: "locations", message: "required" }]);
  });

  it("validates the contact step from the contact columns", () => {
    expect(
      validateStep("convite", "contact", { name: "", whatsapp: "" }, {}, {
        customizable: true,
      }).map((issue) => issue.field),
    ).toEqual(["name", "whatsapp"]);
  });

  it("returns the first invalid step for a full submission", () => {
    expect(
      validateAll("convite", contact, validInvitation, { customizable: true }),
    ).toEqual({ ok: true });

    const result = validateAll(
      "convite",
      contact,
      {
        event: validInvitation.event,
        schedule: [{ time: "10:00", label: "" }],
      },
      { customizable: true },
    );
    expect(result).toMatchObject({ ok: false, step: "locations" });
  });

  it("does not require locations for a Save the Date", () => {
    expect(
      validateAll(
        "save-the-date",
        contact,
        {
          event: {
            type: "wedding",
            primaryName: "Ana",
            date: "2027-05-20",
            place: "Maputo",
          },
        },
        { customizable: false },
      ),
    ).toEqual({ ok: true });
  });
});
