import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { shouldShowRsvpSection } from "@/lib/rsvp-config";

const readSource = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("shouldShowRsvpSection", () => {
  it("shows the section when the flag is missing", () => {
    expect(shouldShowRsvpSection({})).toBe(true);
    expect(shouldShowRsvpSection(null)).toBe(true);
    expect(shouldShowRsvpSection(undefined)).toBe(true);
  });

  it("shows the section when enabled is true", () => {
    expect(shouldShowRsvpSection({ enabled: true })).toBe(true);
  });

  it("hides the section only when enabled is exactly false", () => {
    expect(shouldShowRsvpSection({ enabled: false })).toBe(false);
  });

  it("hides the section whatever the button action is", () => {
    expect(
      shouldShowRsvpSection({ enabled: false, ctaAction: "calendar" }),
    ).toBe(false);
    expect(shouldShowRsvpSection({ enabled: false, ctaAction: "inline" })).toBe(
      false,
    );
  });
});

describe("standard invitation RSVP section wiring", () => {
  it("drops the CTA section and the modal when RSVP is off", () => {
    const source = readSource("components/shared/InvitationPage.tsx");

    expect(source).toContain(
      "const showRsvpSection = shouldShowRsvpSection(invitation.rsvp)",
    );
    // The label, the button / inline form and the entry pass all live inside
    // this one section, so a single gate removes every RSVP entry point.
    expect(source).toMatch(
      /\{showRsvpSection && \(\s*<AnimatedSection className="px-4 pb-10"/,
    );
    expect(source).toContain(
      "{showRsvpSection && !isCalendarCta && !isInlineRsvp && (",
    );
  });

  it("explains the switch and hides the button action while it is off", () => {
    const source = readSource("app/admin/invitations/InvitationForm.tsx");

    expect(source).toMatch(
      /Quando desativada, a secção RSVP deixa de aparecer no\s+convite\./,
    );
    // The action select sits behind the same switch as the other RSVP options.
    expect(source).toMatch(
      /\{form\.rsvp\.enabled && \(\s*<>\s*<div className="space-y-1\.5">\s*<Label>Ação do botão principal<\/Label>/,
    );
  });
});
