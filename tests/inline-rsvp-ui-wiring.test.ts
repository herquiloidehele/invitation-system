import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("inline RSVP form wiring", () => {
  it("lets callers suppress the RSVPForm header", () => {
    const source = readSource("components/shared/RSVPForm.tsx");

    // Declared on both prop variants of the discriminated union.
    expect(source.match(/hideTitle\?: boolean/g)?.length).toBe(2);
    // Only suppressed in inline mode — the modal header carries the X close.
    expect(source).toContain("const hideHeader = inline && props.hideTitle");
  });

  it("renders the inline form instead of the button and modal", () => {
    const source = readSource("components/shared/InvitationPage.tsx");

    // Resolve once, branch three ways — "inline" must never read as calendar.
    expect(source).toContain("const rsvpCtaAction = getRsvpCtaAction(");
    expect(source).toContain(
      'const isCalendarCta = rsvpCtaAction === "calendar"',
    );
    expect(source).toContain('const isInlineRsvp = rsvpCtaAction === "inline"');

    // The form is lazy-loaded the same way RSVPModal loads it.
    expect(source).toContain('dynamic(() => import("./RSVPForm")');
    expect(source).toContain("<InlineRSVPForm");
    expect(source).toContain("hideTitle");

    // The modal (and its trigger state) never render in inline mode.
    expect(source).toContain("{!isCalendarCta && !isInlineRsvp && (");
  });

  it("wraps the inline form in a toggleable themed card", () => {
    const types = readSource("lib/types.ts");
    const source = readSource("components/shared/InvitationPage.tsx");

    // "rsvp" is a card section, so the floating toolbar (with its
    // "Sem cartão" switch) can target it like any other section.
    expect(types).toMatch(/export type CardSectionKey =[\s\S]*?\| "rsvp"/);

    expect(source).toContain('<EditableCard sectionKey="rsvp"');
    expect(source).toContain('const rsvpCard = cs("rsvp"');
    // Honours the plain flag, and drops the padding with the card surface.
    expect(source).toContain("resolveCardSurfaceStyle(rsvpCard");
    expect(source).toContain("padding: rsvpCard.plain ? 0 : 20");
  });

  it("offers the inline option in the admin CTA-action select", () => {
    const source = readSource("app/admin/invitations/InvitationForm.tsx");

    expect(source).toContain('<SelectItem value="inline">');
    expect(source).toContain("Formulário embutido na página");
    // The stored value must round-trip instead of being flattened to "rsvp".
    expect(source).toContain("getRsvpCtaAction(form.rsvp)");
  });
});
