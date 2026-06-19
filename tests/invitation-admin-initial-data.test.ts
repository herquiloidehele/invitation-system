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
  places: null,
  parents: null,
  ourStory: null,
  scratchReveal: null,
  heroConfetti: null,
  countdown: null,
  personalGuestCard: null,
  textStyles: null,
  cardStyles: null,
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
};

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
