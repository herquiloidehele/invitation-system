import { describe, expect, it } from "vitest";

import { toAdminInvitationInitialData } from "@/lib/invitation-admin-initial-data";

// A complete, sane baseline row matching AdminInvitationInitialDataRow.
// Kept inline (not imported) so this test also documents the row shape.
const baseRow = {
  id: "inv_1",
  slug: "ana-e-joao",
  themeId: "theme_1",
  theme: { name: "pink-floral" },
  couple: { bride: "Ana", groom: "João", monogram: "A&J" },
  date: { iso: "2026-09-12" },
  quote: "",
  location: {},
  location2: null,
  rsvp: { enabled: true },
  schedule: [],
  scheduleStyle: null,
  dressCode: { enabled: false, text: "" },
  giftRegistry: { enabled: false, text: "" },
  audio: { enabled: false, src: "", artist: "", title: "" },
  heroImage: "https://example.com/hero.jpg",
  heroHeight: 300,
  heroOverlay: null,
  heroScrollIndicator: null,
  heroTextLayer: null,
  imageLayer: null,
  videoUrl: null,
  videoPoster: null,
  heroMediaFit: null,
  curtainVideoUrl: null,
  curtainVideoPoster: null,
  heroRevealSeconds: null,
  heroTopText: null,
  heroTapPrompt: true,
  faqs: null,
  envelope: null,
  guestGuide: null,
  saveDateStyle: null,
  cinematicImageUrl: null,
  sectionImages: null,
  coupleGallery: null,
  coverVideos: null,
  places: null,
  parents: null,
  ourStory: null,
  scratchReveal: null,
  heroConfetti: null,
  countdown: null,
  personalGuestCard: null,
  textStyles: null,
  cardStyles: null,
  spacingStyles: null,
  imageSettings: null,
  eventType: "wedding",
  invitationType: "external_link",
  externalLink: null,
  isDemo: false,
  guestManagementEnabled: false,
  ownerCanAddGuests: false,
  guestMessageTemplate: null,
  socialPreview: null,
  priceFromCents: null,
  discountPriceFromCents: null,
  currency: null,
  priceOverrides: null,
  landingModelName: null,
  landingImageUrl: null,
  landingDescription: null,
  landingSubtitle: null,
  landingCustomizationLevel: "fully_customizable",
};

describe("toAdminInvitationInitialData — landing customization", () => {
  it("hydrates an explicit pre-designed level", () => {
    const result = toAdminInvitationInitialData({
      ...baseRow,
      landingCustomizationLevel: "pre_designed",
    });

    expect(result.landingCustomizationLevel).toBe("pre_designed");
  });

  it("falls back to fully customizable for an unknown legacy value", () => {
    const result = toAdminInvitationInitialData({
      ...baseRow,
      landingCustomizationLevel: "legacy",
    });

    expect(result.landingCustomizationLevel).toBe("fully_customizable");
  });
});

describe("toAdminInvitationInitialData — heroTextLayer round-trip", () => {
  it("hydrates heroTextLayer into the admin form initial data", () => {
    const heroTextLayer = {
      hideDefaultText: true,
      blocks: [
        {
          id: "b1",
          content: "Ao casamento",
          xPct: 50,
          yPct: 40,
          widthPct: 80,
          fontKey: "display",
          fontFamily: "'Lobster', cursive",
          fontSizeCqw: 8,
          color: "#ffffff",
          fontWeight: 500,
          fontStyle: "normal",
          textAlign: "center",
          letterSpacing: 0,
          lineHeight: 1.15,
          shadow: true,
          rotation: 0,
          z: 1,
        },
      ],
    };
    const row = { ...baseRow, heroTextLayer };
    const result = toAdminInvitationInitialData(row);
    expect(result.heroTextLayer).toEqual(heroTextLayer);
  });

  it("leaves heroTextLayer undefined when the column is null", () => {
    const row = { ...baseRow, heroTextLayer: null };
    const result = toAdminInvitationInitialData(row);
    expect(result.heroTextLayer).toBeUndefined();
  });
});

describe("toAdminInvitationInitialData — spacingStyles round-trip", () => {
  it("hydrates spacingStyles into the admin form initial data", () => {
    const spacingStyles = {
      sections: { schedule: { spaceBefore: 16, spaceAfter: 24 } },
      elements: { sectionTitles: { spaceAfter: 12 } },
    };

    const result = toAdminInvitationInitialData({
      ...baseRow,
      spacingStyles,
    });

    expect(result.spacingStyles).toEqual(spacingStyles);
  });

  it("leaves spacingStyles undefined when the column is null", () => {
    const result = toAdminInvitationInitialData({
      ...baseRow,
      spacingStyles: null,
    });

    expect(result.spacingStyles).toBeUndefined();
  });
});

describe("toAdminInvitationInitialData — ownerCanAddGuests round-trip", () => {
  it("hydrates a stored ownerCanAddGuests=true into the admin form initial data", () => {
    const row = { ...baseRow, ownerCanAddGuests: true };
    const result = toAdminInvitationInitialData(row);
    expect(result.ownerCanAddGuests).toBe(true);
  });

  it("preserves ownerCanAddGuests=false (the default)", () => {
    const row = { ...baseRow, ownerCanAddGuests: false };
    const result = toAdminInvitationInitialData(row);
    expect(result.ownerCanAddGuests).toBe(false);
  });
});

describe("toAdminInvitationInitialData — heroMediaFit round-trip", () => {
  it("hydrates a stored heroMediaFit into the admin form initial data", () => {
    const row = { ...baseRow, heroMediaFit: "contain" };
    const result = toAdminInvitationInitialData(row);
    expect(result.heroMediaFit).toBe("contain");
  });

  it("leaves heroMediaFit undefined when the column is null", () => {
    const row = { ...baseRow, heroMediaFit: null };
    const result = toAdminInvitationInitialData(row);
    expect(result.heroMediaFit).toBeUndefined();
  });
});

describe("toAdminInvitationInitialData — imageLayer round-trip", () => {
  it("hydrates imageLayer into the admin form initial data", () => {
    const imageLayer = {
      items: [
        {
          id: "img1",
          src: "https://example.com/a.png",
          naturalAspect: 1.5,
          xPct: 50,
          yPct: 50,
          widthPct: 40,
          aspect: 1.5,
          rotation: 0,
          flipH: false,
          flipV: false,
          opacity: 1,
          radiusPct: 0,
          blurPx: 0,
          shadow: null,
          crop: { offsetXPct: 50, offsetYPct: 50, zoom: 1 },
          z: 1,
        },
      ],
    };
    const row = { ...baseRow, imageLayer };
    const result = toAdminInvitationInitialData(row);
    expect(result.imageLayer).toEqual(imageLayer);
  });

  it("leaves imageLayer undefined when the column is null", () => {
    const row = { ...baseRow, imageLayer: null };
    const result = toAdminInvitationInitialData(row);
    expect(result.imageLayer).toBeUndefined();
  });
});

describe("toAdminInvitationInitialData — coverVideos round-trip", () => {
  it("hydrates coverVideos into the admin form initial data", () => {
    const coverVideos = {
      enabled: true,
      items: [
        {
          url: "https://cdn.example.com/a.mp4",
          poster: "https://cdn.example.com/a.jpg",
        },
        { url: "https://cdn.example.com/b.mp4" },
      ],
    };
    const row = { ...baseRow, coverVideos };
    const result = toAdminInvitationInitialData(row);
    expect(result.coverVideos).toEqual(coverVideos);
  });

  it("leaves coverVideos undefined when the column is null", () => {
    const row = { ...baseRow, coverVideos: null };
    const result = toAdminInvitationInitialData(row);
    expect(result.coverVideos).toBeUndefined();
  });
});
