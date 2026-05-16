import { describe, expect, it } from "vitest";

import { toAdminInvitationInitialData } from "../lib/invitation-admin-initial-data";

describe("toAdminInvitationInitialData", () => {
  it("preserves the persisted hero height for the edit form", () => {
    const initialData = toAdminInvitationInitialData({
      id: "inv_1",
      slug: "ana-e-bruno",
      themeId: "theme_1",
      theme: { name: "pink-floral" },
      couple: { bride: "Ana", groom: "Bruno", monogram: "A&B" },
      date: {},
      quote: "",
      location: {},
      location2: null,
      rsvp: { enabled: true },
      schedule: [],
      dressCode: { enabled: false, text: "" },
      giftRegistry: { enabled: false, text: "" },
      audio: { enabled: false, src: "", artist: "", title: "" },
      heroImage: "https://example.com/hero.jpg",
      heroHeight: 520,
      videoUrl: null,
      videoPoster: null,
      faqs: null,
      envelope: null,
      guestGuide: null,
      saveDateStyle: null,
      cinematicImageUrl: null,
      sectionImages: null,
      parents: null,
      ourStory: null,
      textStyles: null,
      cardStyles: null,
      imageSettings: null,
      eventType: "wedding",
      invitationType: "standard",
      externalLink: null,
      isDemo: false,
      socialPreview: null,
    });

    expect(initialData.heroHeight).toBe(520);
    expect(initialData.isDemo).toBe(false);
  });
});
