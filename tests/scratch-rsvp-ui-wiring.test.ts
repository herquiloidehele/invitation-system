import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("post-scratch RSVP UI wiring", () => {
  it("reveals a customized themed CTA from the unique-part completion result", () => {
    const source = readSource("components/curtain-canva/ScratchDateReveal.tsx");

    expect(source).toContain("onRsvpClick?: () => void");
    expect(source).toContain("registerRevealedScratchPart");
    expect(source).toContain("setRsvpButtonVisible(true)");
    expect(source).toContain('t("cta_confirmButton")');
    expect(source).toContain("background: theme.ctaPrimaryBg");
    expect(source).toContain("color: theme.ctaPrimaryText");
    expect(source).toContain("borderRadius: theme.ctaRadius");
    expect(source).toContain("onClick={onRsvpClick}");
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
});
