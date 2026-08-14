import { describe, expect, it } from "vitest";

import {
  getEntranceInvitationImageSectionKeys,
  isEntranceImageMigrationReady,
} from "@/lib/entrance-invitation-image-sections";
import { MOCK_INVITATION } from "@/lib/mock-invitation";
import type { InvitationData } from "@/lib/types";

describe("getEntranceInvitationImageSectionKeys", () => {
  it("returns enabled entrance sections once in DOM order", () => {
    const invitation: InvitationData = {
      ...MOCK_INVITATION,
      invitationType: "external_link",
      externalLink: "https://example.com/invitation",
      scratchReveal: { enabled: true },
      countdown: { enabled: true },
      guest: {
        token: "guest",
        name: "Guest",
        totalGuests: 1,
        canInviteOthers: false,
        invitationSlug: "preview",
      },
      coupleGallery: {
        enabled: true,
        style: "grid",
        images: [{ src: "/gallery.jpg" }],
      },
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

    expect(getEntranceInvitationImageSectionKeys(invitation)).toEqual([
      "hero",
      "scratchReveal",
      "countdown",
      "personalGuestCard",
      "coupleGallery",
      "canvaDetails",
      "places",
      "rsvp",
    ]);
  });

  it("omits personalGuestCard when visibility is never, even with a real guest", () => {
    const invitation: InvitationData = {
      ...MOCK_INVITATION,
      invitationType: "external_link",
      externalLink: "https://example.com/invitation",
      scratchReveal: { enabled: false },
      countdown: { enabled: false },
      guest: {
        token: "guest",
        name: "Guest",
        totalGuests: 1,
        canInviteOthers: false,
        invitationSlug: "preview",
      },
      personalGuestCard: { visibility: "never" },
      coupleGallery: { enabled: false, style: "grid", images: [] },
      places: { enabled: false, layout: "stacked", sections: [] },
      rsvp: { ...MOCK_INVITATION.rsvp, enabled: false },
    };

    expect(getEntranceInvitationImageSectionKeys(invitation)).not.toContain(
      "personalGuestCard",
    );
  });

  it("omits initial-page sections after internal Canva navigation", () => {
    const invitation: InvitationData = {
      ...MOCK_INVITATION,
      invitationType: "external_link",
      externalLink: "https://example.com/invitation",
      scratchReveal: { enabled: true },
      countdown: { enabled: true },
    };

    expect(
      getEntranceInvitationImageSectionKeys(invitation, {
        showInitialPageSections: false,
      }),
    ).toEqual(["hero", "canvaDetails"]);
  });

  it("omits sections whose render conditions are false", () => {
    const invitation: InvitationData = {
      ...MOCK_INVITATION,
      externalLink: "",
      scratchReveal: { enabled: false },
      countdown: { enabled: false },
      guest: undefined,
      coupleGallery: { enabled: true, style: "grid", images: [] },
      places: { enabled: true, layout: "stacked", sections: [] },
      rsvp: { ...MOCK_INVITATION.rsvp, enabled: false },
    };

    expect(getEntranceInvitationImageSectionKeys(invitation)).toEqual(["hero"]);
  });
});

describe("isEntranceImageMigrationReady", () => {
  it("requires reveal", () => {
    expect(
      isEntranceImageMigrationReady({
        revealed: false,
        externalLink: "",
        measuredExternalLink: null,
      }),
    ).toBe(false);
  });

  it("is ready after reveal without Canva", () => {
    expect(
      isEntranceImageMigrationReady({
        revealed: true,
        externalLink: "",
        measuredExternalLink: null,
      }),
    ).toBe(true);
  });

  it("requires measurement for the current Canva link", () => {
    const externalLink = "https://example.com/current";

    expect(
      isEntranceImageMigrationReady({
        revealed: true,
        externalLink,
        measuredExternalLink: "https://example.com/old",
      }),
    ).toBe(false);
    expect(
      isEntranceImageMigrationReady({
        revealed: true,
        externalLink,
        measuredExternalLink: externalLink,
      }),
    ).toBe(true);
  });
});
