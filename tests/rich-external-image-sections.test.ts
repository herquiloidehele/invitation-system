import { describe, expect, it } from "vitest";

import { MOCK_INVITATION } from "@/lib/mock-invitation";
import {
  getRichExternalInvitationImageSectionKeys,
  isRichExternalImageMigrationReady,
} from "@/lib/rich-external-image-sections";
import type { InvitationData } from "@/lib/types";

describe("getRichExternalInvitationImageSectionKeys", () => {
  it("returns enabled rich external sections once in DOM order", () => {
    const invitation: InvitationData = {
      ...MOCK_INVITATION,
      invitationType: "external_link",
      externalLink: "https://example.com/invitation",
      scratchReveal: { enabled: true },
      countdown: { enabled: true },
      guestManagementEnabled: true,
      coupleGallery: {
        enabled: true,
        style: "grid",
        images: [{ src: "/gallery.jpg" }],
      },
      giftRegistry: { ...MOCK_INVITATION.giftRegistry, enabled: true },
      faqs: [{ question: "Question", answer: "Answer" }],
      places: {
        enabled: true,
        layout: "stacked",
        sections: [
          {
            id: "hotels",
            title: "Hotels",
            items: [{ id: "hotel", title: "Hotel" }],
          },
        ],
      },
      rsvp: { ...MOCK_INVITATION.rsvp, enabled: true },
    };

    expect(
      getRichExternalInvitationImageSectionKeys(invitation, {
        showRsvp: true,
      }),
    ).toEqual([
      "hero",
      "scratchReveal",
      "countdown",
      "personalGuestCard",
      "canvaDetails",
      "coupleGallery",
      "giftRegistry",
      "faqs",
      "places",
      "rsvp",
    ]);
  });

  it("omits personalGuestCard when visibility is never, even with guest management on", () => {
    const invitation: InvitationData = {
      ...MOCK_INVITATION,
      invitationType: "external_link",
      externalLink: "https://example.com/invitation",
      scratchReveal: { enabled: false },
      countdown: { enabled: false },
      guestManagementEnabled: true,
      personalGuestCard: { visibility: "never" },
      coupleGallery: { enabled: false, style: "grid", images: [] },
      giftRegistry: { ...MOCK_INVITATION.giftRegistry, enabled: false },
      faqs: [],
      places: { enabled: false, layout: "stacked", sections: [] },
      rsvp: { ...MOCK_INVITATION.rsvp, enabled: false },
    };

    expect(
      getRichExternalInvitationImageSectionKeys(invitation, {
        showRsvp: false,
      }),
    ).not.toContain("personalGuestCard");
  });

  it("omits section hosts whose content is absent", () => {
    const invitation: InvitationData = {
      ...MOCK_INVITATION,
      heroImage: undefined,
      videoUrl: undefined,
      externalLink: "",
      scratchReveal: { enabled: false },
      countdown: { enabled: false },
      guestManagementEnabled: false,
      coupleGallery: { enabled: true, style: "grid", images: [] },
      giftRegistry: { ...MOCK_INVITATION.giftRegistry, enabled: false },
      faqs: [],
      places: { enabled: true, layout: "stacked", sections: [] },
      rsvp: { ...MOCK_INVITATION.rsvp, enabled: false },
    };

    expect(
      getRichExternalInvitationImageSectionKeys(invitation, {
        showRsvp: false,
      }),
    ).toEqual([]);
  });
});

describe("isRichExternalImageMigrationReady", () => {
  it("waits for the current Canva link to report its responsive height", () => {
    const externalLink = "https://example.com/current";

    expect(
      isRichExternalImageMigrationReady({
        externalLink,
        measuredExternalLink: null,
      }),
    ).toBe(false);
    expect(
      isRichExternalImageMigrationReady({
        externalLink,
        measuredExternalLink: "https://example.com/old",
      }),
    ).toBe(false);
    expect(
      isRichExternalImageMigrationReady({
        externalLink,
        measuredExternalLink: externalLink,
      }),
    ).toBe(true);
  });

  it("is immediately ready when there is no Canva link", () => {
    expect(
      isRichExternalImageMigrationReady({
        externalLink: "",
        measuredExternalLink: null,
      }),
    ).toBe(true);
  });
});
