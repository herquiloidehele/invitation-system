import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { resolveTextElementOverride } from "@/lib/curtain-canva";
import { resolveTextStyles } from "@/lib/text-styles";
import type { TemplateTheme, TextStyleOverrides } from "@/lib/types";

const theme = {
  id: "t1",
  name: "test",
  label: "Test",
  description: "",
  envelope: { base: "#fff", topFlap: "#fff", bottomFlap: "#fff" },
  bg: "#fff",
  cardBg: "#fff",
  cardBorder: "#eee",
  primary: "#111",
  secondary: "#222",
  accent: "#C9A961",
  textPrimary: "#111",
  textSecondary: "#555",
  textMuted: "#999",
  displayFont: "Display",
  bodyFont: "Body",
  uiFont: "UI",
  ctaPrimaryBg: "#111",
  ctaPrimaryText: "#fff",
  ctaSecondaryBorder: "#111",
  ctaSecondaryText: "#111",
  ctaRadius: "8px",
  monogramColor: "#111",
  tapTextColor: "#111",
  decorativeColor: "#ccc",
} as TemplateTheme;

/**
 * Reads a component source with all whitespace stripped, so assertions on call
 * sites survive Prettier reflowing them across lines.
 */
const readSource = (...segments: string[]) =>
  readFileSync(join(process.cwd(), ...segments), "utf8").replace(/\s+/g, "");

// The gifts/dress-code section title, the RSVP field labels and the curtain
// scratch labels all used to share a single `elements.labels` slot, so styling
// one silently restyled the others. Each now owns its own key and only falls
// back to `labels` for invitations saved before the split.
describe("label text styles are independent per usage site", () => {
  it("styles the section label without touching the RSVP field labels", () => {
    const overrides: TextStyleOverrides = {
      elements: { sectionLabel: { fontFamily: "Script", fontSize: 27 } },
    };

    const ts = resolveTextStyles(theme, overrides);

    expect(ts.sectionLabel.fontFamily).toBe("Script");
    expect(ts.sectionLabel.fontSize).toBe(27);
    expect(
      resolveTextElementOverride(overrides, "rsvpFieldLabel", "labels"),
    ).toEqual({});
  });

  it("styles the RSVP field labels without touching the section label", () => {
    const overrides: TextStyleOverrides = {
      elements: { rsvpFieldLabel: { fontFamily: "Script", fontSize: 27 } },
    };

    const ts = resolveTextStyles(theme, overrides);

    expect(
      resolveTextElementOverride(overrides, "rsvpFieldLabel", "labels"),
    ).toEqual({ fontFamily: "Script", fontSize: 27 });
    expect(ts.sectionLabel.fontFamily).toBe(theme.uiFont);
    expect(ts.sectionLabel.fontSize).toBe(9);
  });

  it("styles the scratch labels without touching the other two", () => {
    const overrides: TextStyleOverrides = {
      elements: { scratchLabel: { color: "#ff0000" } },
    };

    const ts = resolveTextStyles(theme, overrides);

    expect(
      resolveTextElementOverride(overrides, "scratchLabel", "labels"),
    ).toEqual({ color: "#ff0000" });
    expect(ts.sectionLabel.color).toBe(theme.textMuted);
    expect(
      resolveTextElementOverride(overrides, "rsvpFieldLabel", "labels"),
    ).toEqual({});
  });
});

describe("legacy `labels` override stays honoured", () => {
  const legacy: TextStyleOverrides = {
    elements: { labels: { fontFamily: "Legacy", fontSize: 18 } },
  };

  it("feeds the section label when no dedicated override exists", () => {
    const ts = resolveTextStyles(theme, legacy);

    expect(ts.sectionLabel.fontFamily).toBe("Legacy");
    expect(ts.sectionLabel.fontSize).toBe(18);
  });

  it("feeds the RSVP and scratch labels when no dedicated override exists", () => {
    expect(
      resolveTextElementOverride(legacy, "rsvpFieldLabel", "labels"),
    ).toEqual({ fontFamily: "Legacy", fontSize: 18 });
    expect(
      resolveTextElementOverride(legacy, "scratchLabel", "labels"),
    ).toEqual({
      fontFamily: "Legacy",
      fontSize: 18,
    });
  });

  it("is superseded by a dedicated override", () => {
    const overrides: TextStyleOverrides = {
      elements: {
        labels: { fontFamily: "Legacy" },
        sectionLabel: { fontFamily: "Fresh" },
        rsvpFieldLabel: { fontFamily: "Rsvp" },
      },
    };

    const ts = resolveTextStyles(theme, overrides);

    expect(ts.sectionLabel.fontFamily).toBe("Fresh");
    expect(
      resolveTextElementOverride(overrides, "rsvpFieldLabel", "labels"),
    ).toEqual({ fontFamily: "Rsvp" });
  });
});

describe("resolveTextElementOverride key precedence", () => {
  it("returns the first key that has an override", () => {
    const overrides: TextStyleOverrides = {
      elements: { labels: { color: "#111" } },
    };

    expect(
      resolveTextElementOverride(overrides, "sectionLabel", "labels"),
    ).toEqual({ color: "#111" });
  });

  it("returns an empty object when no key has an override", () => {
    expect(resolveTextElementOverride({}, "sectionLabel", "labels")).toEqual(
      {},
    );
    expect(resolveTextElementOverride(undefined, "sectionLabel")).toEqual({});
  });
});

// Guards the wiring the unit tests above cannot reach: the components pick the
// element key that the admin toolbar writes to, so a stray `elementKey="labels"`
// would silently re-couple two unrelated pieces of text.
describe("component wiring uses the split element keys", () => {
  it("points the gifts section title at sectionLabel", () => {
    const source = readSource("components", "shared", "GiftsSection.tsx");

    expect(source).toContain('elementKey="sectionLabel"');
    expect(source).not.toContain('elementKey="labels"');
  });

  it("points the dress-code section title at sectionLabel", () => {
    const source = readSource("components", "shared", "InvitationPage.tsx");

    expect(source).toContain('elementKey="sectionLabel"');
    expect(source).not.toContain('elementKey="labels"');
  });

  it("points every RSVP field label at rsvpFieldLabel", () => {
    const source = readSource("components", "shared", "RSVPForm.tsx");

    expect(source).toContain(
      'resolveTextElementOverride(textStyles,"rsvpFieldLabel","labels"',
    );
    expect(source).not.toContain('elementKey="labels"');
    expect(source).toContain('elementKey="rsvpFieldLabel"');
  });

  it("points the scratch labels at scratchLabel", () => {
    const source = readSource(
      "components",
      "curtain-canva",
      "ScratchDateReveal.tsx",
    );

    expect(source).toContain(
      'resolveTextElementOverride(textStyles,"scratchLabel","labels"',
    );
    expect(source).not.toContain('elementKey="labels"');
    expect(source).toContain('elementKey="scratchLabel"');
  });
});
