import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(file, "utf8");

describe("plain card renderer coverage", () => {
  it.each([
    "components/shared/InvitationPage.tsx",
    "components/shared/ScheduleSection.tsx",
    "components/shared/LocationCard.tsx",
    "components/shared/GuestGuideSection.tsx",
    "components/shared/FaqSection.tsx",
    "components/shared/PlacesSection.tsx",
  ])("uses the shared resolver in %s", (file) => {
    expect(read(file)).toContain("resolveCardSurfaceStyle");
  });

  it("forwards the section flag from the standard invitation resolver", () => {
    const source = read("components/shared/InvitationPage.tsx");
    expect(source).toContain(
      "plain: invitation.cardStyles?.[section]?.plain === true",
    );
    expect(source).toContain('plain={cs("location", 16).plain}');
    expect(source).toContain('plain={cs("guestGuide", 14).plain}');
  });

  it("applies plain mode to the personal guest card surface", () => {
    const source = read("components/shared/PersonalGuestCard.tsx");
    expect(source).toContain("resolveCardSurfaceStyle");
    expect(source).toContain("cardStyle?: CardStyle");
  });

  it("exposes the personal guest card as an editable card section", () => {
    const page = read("components/shared/InvitationPage.tsx");
    const types = read("lib/types.ts");
    expect(types).toContain('| "personalGuestCard"');
    expect(page).toContain(
      '<EditableCard sectionKey="personalGuestCard">',
    );
    expect(page).toContain('cardStyle={cs("personalGuestCard", 24)}');
  });

  it.each([
    "components/shared/SaveTheDateSection.tsx",
    "components/shared/ExternalCountdownSection.tsx",
    "components/shared/RichExternalLinkPage.tsx",
  ])("uses the shared resolver in %s", (file) => {
    expect(read(file)).toContain("resolveCardSurfaceStyle");
  });

  it("forwards plain mode through both external page paths", () => {
    expect(read("components/shared/RichExternalLinkPage.tsx")).toContain(
      "plain: invitation.cardStyles?.[section]?.plain === true",
    );
    expect(read("components/shared/RevealableExternalSections.tsx")).toContain(
      "plain: invitation.cardStyles?.places?.plain === true",
    );
  });

  it("covers every save-the-date surface family", () => {
    const source = read("components/shared/SaveTheDateSection.tsx");
    expect(
      source.match(/resolveCardSurfaceStyle/g)?.length ?? 0,
    ).toBeGreaterThanOrEqual(8);
  });
});
