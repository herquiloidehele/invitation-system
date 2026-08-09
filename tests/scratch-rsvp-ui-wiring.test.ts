import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("post-scratch RSVP UI wiring", () => {
  it("reveals the shared RSVP action from the unique-part completion result", () => {
    const source = readSource("components/curtain-canva/ScratchDateReveal.tsx");

    expect(source).toContain("onRsvpClick?: () => void");
    expect(source).toContain("registerRevealedScratchPart");
    expect(source).toContain("setRsvpButtonVisible(true)");
    expect(source).toContain('t("cta_confirmButton")');
    expect(source).toContain("onClick={onRsvpClick}");
    expect(source).toContain("<RsvpActionButton");
    expect(source).toContain('elementKey="ctaLabel"');
  });

  it("uses one RSVP button presentation for submit and scratch actions", () => {
    const sharedPath = "components/shared/RsvpActionButton.tsx";

    expect(existsSync(join(process.cwd(), sharedPath))).toBe(true);
    const sharedSource = readSource(sharedPath);
    const formSource = readSource("components/shared/RSVPForm.tsx");
    const scratchSource = readSource(
      "components/curtain-canva/ScratchDateReveal.tsx",
    );

    expect(formSource).toContain("<RsvpActionButton");
    expect(scratchSource).toContain("<RsvpActionButton");
    expect(sharedSource).toContain("resolveRsvpSubmitStyle");
    expect(sharedSource).toContain('"ctaLabel"');
  });

  it("preserves the CTA label override for RSVP status actions", () => {
    const formSource = readSource("components/shared/RSVPForm.tsx");

    expect(formSource).toContain(
      'const ctaLabelOverride = resolveTextElementOverride(textStyles, "ctaLabel")',
    );
    expect(formSource).toContain("...ctaLabelOverride");
  });

  it.each([
    "components/shared/RichExternalLinkPage.tsx",
    "components/shared/RevealableExternalSections.tsx",
  ])("forwards the existing RSVP input style in %s", (path) => {
    const source = readSource(path);

    expect(source).toContain("inputStyle={invitation.rsvp.inputStyle}");
  });

  it.each([
    "components/shared/RichExternalLinkPage.tsx",
    "components/shared/RevealableExternalSections.tsx",
  ])("opens the shared RSVP modal from the scratch callback in %s", (path) => {
    const source = readSource(path);

    expect(source).toContain("shouldEnablePostScratchRsvp(invitation)");
    expect(source).toContain("onRsvpClick={");
    expect(source).toContain("setRsvpOpen(true)");
    expect(source).toContain("<RSVPModal");
    expect(source).toContain("open={rsvpOpen}");
    expect(source).toContain("invitation={invitation}");
    expect(source).toContain("customTexts={invitation.customTexts}");
    expect(source).toContain("guest={invitation.guest}");
  });

  it.each([
    "components/shared/RichExternalLinkPage.tsx",
    "components/shared/RevealableExternalSections.tsx",
  ])("uses a mutually exclusive inline RSVP gate in %s", (path) => {
    const source = readSource(path);

    expect(source).toContain("shouldShowInlineRsvp({");
    expect(source).toContain("postScratchRsvpEnabled");
    expect(source).toContain("{showInlineRsvp && (");
    expect(source).toContain("<RSVPForm");
    expect(source).toContain("inline");
  });

  it("offers the opt-in post-scratch RSVP switch in both admin panels", () => {
    const source = readSource(
      "app/admin/invitations/ExternalInvitationForm.tsx",
    );

    expect(
      source.match(
        /checked=\{\s*form\.scratchReveal\?\.showRsvpButtonAfterReveal\s*===\s*true\s*\}/g,
      ),
    ).toHaveLength(2);
    expect(
      source.match(/updateScratchRevealField\(\s*"showRsvpButtonAfterReveal"/g),
    ).toHaveLength(2);
    expect(source.match(/Mostrar RSVP após raspar/g)).toHaveLength(2);
  });

  it("does not retain a scratch-specific appearance model", () => {
    const editorPath = "components/admin/ScratchRsvpButtonStyleFields.tsx";
    const formSource = readSource(
      "app/admin/invitations/ExternalInvitationForm.tsx",
    );
    const typesSource = readSource("lib/types.ts");
    const helperSource = readSource("lib/scratch-rsvp.ts");

    expect(existsSync(join(process.cwd(), editorPath))).toBe(false);
    expect(formSource).not.toContain("ScratchRsvpButtonStyleFields");
    expect(formSource).not.toContain("rsvpButtonBackgroundColor");
    expect(formSource).not.toContain("scratchRsvpButton");
    expect(typesSource).not.toContain("rsvpButtonBackgroundColor");
    expect(typesSource).not.toContain("scratchRsvpButton");
    expect(helperSource).not.toContain("resolveScratchRsvpButtonAppearance");
  });
});
