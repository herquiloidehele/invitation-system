import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { isSectionIconHidden } from "@/lib/section-icons";

const read = (file: string) => readFileSync(file, "utf8");

describe("isSectionIconHidden", () => {
  it("shows the icon when the section is missing", () => {
    expect(isSectionIconHidden(null)).toBe(false);
    expect(isSectionIconHidden(undefined)).toBe(false);
  });

  it("shows the icon when the flag was never set", () => {
    expect(isSectionIconHidden({})).toBe(false);
  });

  it("shows the icon when the flag is explicitly false", () => {
    expect(isSectionIconHidden({ hideIcon: false })).toBe(false);
  });

  it("hides the icon only when the flag is exactly true", () => {
    expect(isSectionIconHidden({ hideIcon: true })).toBe(true);
  });
});

/**
 * Hiding the icon must reserve its footprint so the rest of the card does not
 * shift up. Each chip is a 40x40 direct flex child of a `gap-3` column, so the
 * hidden branch renders an equally sized empty spacer rather than nothing.
 */
const SPACER = '<div className="h-10 w-10" aria-hidden="true" />';

describe("public render guards", () => {
  it("guards the dress code icon chip and preserves its space", () => {
    const source = read("components/shared/InvitationPage.tsx");
    expect(source).toContain('from "@/lib/section-icons"');
    expect(source).toContain("isSectionIconHidden(invitation.dressCode)");
    expect(source).toContain(SPACER);
  });

  it("guards the gifts icon chip and preserves its space", () => {
    const source = read("components/shared/GiftsSection.tsx");
    expect(source).toContain('from "@/lib/section-icons"');
    expect(source).toContain("isSectionIconHidden(giftRegistry)");
    expect(source).toContain(SPACER);
  });

  it("leaves the elegant-floral button icon alone", () => {
    const source = read("components/elegant-floral/GiftsSection.tsx");
    expect(source).not.toContain("isSectionIconHidden");
  });
});

describe("admin controls", () => {
  it("exposes the dress code switch", () => {
    const source = read("app/admin/invitations/InvitationForm.tsx");
    expect(source).toContain("form.dressCode.hideIcon === true");
    expect(source).toContain('updateDressCode("hideIcon", value)');
  });

  it("exposes the gifts switch on the standard form", () => {
    const source = read("app/admin/invitations/InvitationForm.tsx");
    expect(source).toContain("form.giftRegistry.hideIcon === true");
    expect(source).toContain('updateGiftRegistry("hideIcon", value)');
  });

  it("exposes the gifts switch on the external form", () => {
    const source = read("app/admin/invitations/ExternalInvitationForm.tsx");
    expect(source).toContain("form.giftRegistry.hideIcon === true");
    expect(source).toContain('updateGiftRegistry("hideIcon", enabled)');
  });
});
