import { describe, expect, it } from "vitest";

import {
  INVITATION_SLUG_PATTERN,
  buildDuplicateInvitationInitialData,
  buildDuplicateThemeData,
  buildDuplicateThemeName,
  isSameInvitationCustomer,
} from "@/lib/invitation-duplication";
import {
  sourceInvitationRow,
  sourceTheme,
} from "./fixtures/invitation-duplication";

describe("buildDuplicateInvitationInitialData", () => {
  it("copies editable configuration and reuses media URLs", () => {
    const result = buildDuplicateInvitationInitialData(sourceInvitationRow);
    const copiedKeys = [
      "couple",
      "date",
      "quote",
      "location",
      "rsvp",
      "schedule",
      "scheduleStyle",
      "dressCode",
      "giftRegistry",
      "audio",
      "heroImage",
      "heroHeight",
      "heroOverlay",
      "heroScrollIndicator",
      "heroTextLayer",
      "imageLayer",
      "videoUrl",
      "videoPoster",
      "heroMediaFit",
      "curtainVideoUrl",
      "curtainVideoPoster",
      "heroRevealSeconds",
      "heroTopText",
      "heroTapPrompt",
      "faqs",
      "envelope",
      "guestGuide",
      "saveDateStyle",
      "cinematicImageUrl",
      "sectionImages",
      "coupleGallery",
      "coverVideos",
      "places",
      "parents",
      "ourStory",
      "scratchReveal",
      "heroConfetti",
      "countdown",
      "personalGuestCard",
      "textStyles",
      "cardStyles",
      "spacingStyles",
      "imageSettings",
      "customTexts",
      "languageSwitcherEnabled",
      "enabledLocales",
      "translations",
      "eventType",
      "invitationType",
      "externalLink",
      "guestManagementEnabled",
      "ownerCanAddGuests",
      "guestMessageTemplate",
      "socialPreview",
    ] as const;

    for (const key of copiedKeys) {
      expect(result[key]).toEqual(sourceInvitationRow[key]);
    }
    expect(result.themeId).toBe(sourceTheme.id);
    expect(result.template).toBe(sourceTheme.name);
    expect(result.location2).toBeUndefined();
    expect(result.heroImage).toBe("https://cdn.example.com/hero.jpg");
    expect(result.videoUrl).toBe("https://cdn.example.com/hero.mp4");
  });

  it("clears public identity and catalogue fields", () => {
    const result = buildDuplicateInvitationInitialData(sourceInvitationRow);

    expect(result).not.toHaveProperty("id");
    expect(result.slug).toBe("");
    expect(result.isDemo).toBe(false);
    expect(result.priceFromCents).toBeNull();
    expect(result.discountPriceFromCents).toBeNull();
    expect(result.priceOverrides).toBeNull();
    expect(result.currency).toBe("EUR");
    expect(result.landingModelName).toBeNull();
    expect(result.landingImageUrl).toBeNull();
    expect(result.landingDescription).toBeNull();
    expect(result.landingSubtitle).toBeNull();
    expect(result.landingCustomizationLevel).toBe("fully_customizable");
  });
});

describe("customer identity", () => {
  const source = {
    eventType: "wedding" as const,
    couple: sourceInvitationRow.couple,
  };

  it("ignores case, repeated whitespace, and wedding name order", () => {
    expect(
      isSameInvitationCustomer(source, {
        eventType: "wedding",
        couple: { bride: "  JOÃO ", groom: "ana", monogram: "J&A" },
      }),
    ).toBe(true);
  });

  it("accepts a different couple and a different single-name customer", () => {
    expect(
      isSameInvitationCustomer(source, {
        eventType: "wedding",
        couple: { bride: "Maria", groom: "Pedro", monogram: "M&P" },
      }),
    ).toBe(false);
    expect(
      isSameInvitationCustomer(
        {
          eventType: "baptism",
          couple: { bride: "Ana", groom: "", monogram: "A" },
        },
        {
          eventType: "baptism",
          couple: { bride: "Beatriz", groom: "", monogram: "B" },
        },
      ),
    ).toBe(false);
  });
});

describe("slug and theme copy", () => {
  it("accepts only lowercase kebab-case invitation slugs", () => {
    expect(INVITATION_SLUG_PATTERN.test("maria-pedro-2027")).toBe(true);
    expect(INVITATION_SLUG_PATTERN.test("Maria Pedro")).toBe(false);
    expect(INVITATION_SLUG_PATTERN.test("-maria-pedro")).toBe(false);
  });

  it("generates deterministic suffixed theme names", () => {
    expect(buildDuplicateThemeName("rose-garden", "maria-pedro")).toBe(
      "rose-garden-maria-pedro",
    );
    expect(buildDuplicateThemeName("rose-garden", "maria-pedro", 2)).toBe(
      "rose-garden-maria-pedro-2",
    );
  });

  it("copies theme values but not identity or timestamps", () => {
    const data = buildDuplicateThemeData(
      sourceTheme,
      "rose-garden-maria-pedro",
      "Maria & Pedro",
    );
    const copiedKeys = [
      "description",
      "envelope",
      "bg",
      "cardBg",
      "cardBorder",
      "primary",
      "secondary",
      "accent",
      "textPrimary",
      "textSecondary",
      "textMuted",
      "displayFont",
      "bodyFont",
      "scriptFont",
      "uiFont",
      "sectionTitleFont",
      "sectionTitleFontSize",
      "sectionTitleFontWeight",
      "ctaPrimaryBg",
      "ctaPrimaryText",
      "ctaSecondaryBorder",
      "ctaSecondaryText",
      "ctaRadius",
      "monogramColor",
      "tapTextColor",
      "bgGradient",
      "decorativeColor",
      "ctaGlow",
      "layout",
    ] as const;

    expect(data.name).toBe("rose-garden-maria-pedro");
    expect(data.label).toBe("Rose Garden — Maria & Pedro");
    for (const key of copiedKeys) {
      expect(data[key]).toEqual(sourceTheme[key]);
    }
    expect(data).not.toHaveProperty("id");
    expect(data).not.toHaveProperty("createdAt");
    expect(data).not.toHaveProperty("updatedAt");
    expect(data).not.toHaveProperty("invitations");
  });
});
