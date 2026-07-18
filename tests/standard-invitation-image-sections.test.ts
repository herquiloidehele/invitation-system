import { describe, expect, it } from "vitest";

import { MOCK_INVITATION } from "@/lib/mock-invitation";
import { getStandardInvitationImageSectionKeys } from "@/lib/standard-invitation-image-sections";
import type { InvitationData } from "@/lib/types";

describe("getStandardInvitationImageSectionKeys", () => {
  it("returns only section hosts rendered by the standard invitation", () => {
    const invitation: InvitationData = {
      ...MOCK_INVITATION,
      sectionImages: { image1: "/one.png", image4: "/four.png" },
      ourStory: { enabled: false, title: "", description: "" },
      coupleGallery: undefined,
      schedule: [],
      dressCode: { ...MOCK_INVITATION.dressCode, enabled: true },
      giftRegistry: { ...MOCK_INVITATION.giftRegistry, enabled: false },
      guestGuide: { enabled: false, items: [] },
      faqs: [],
      places: { enabled: false, layout: "stacked", sections: [] },
    };

    expect(getStandardInvitationImageSectionKeys(invitation)).toEqual([
      "hero",
      "saveTheDate",
      "sectionImage1",
      "location",
      "dressCode",
      "footer",
      "sectionImage4",
    ]);
  });

  it("includes every enabled conditional section once in DOM order", () => {
    const invitation: InvitationData = {
      ...MOCK_INVITATION,
      sectionImages: {
        image1: "/one.png",
        image2: "/two.png",
        image3: "/three.png",
        image4: "/four.png",
      },
      coupleGallery: {
        enabled: true,
        style: "grid",
        images: [{ src: "/gallery.png" }],
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
    };

    expect(getStandardInvitationImageSectionKeys(invitation)).toEqual([
      "hero",
      "saveTheDate",
      "sectionImage1",
      "ourStory",
      "coupleGallery",
      "schedule",
      "sectionImage2",
      "location",
      "sectionImage3",
      "dressCode",
      "giftRegistry",
      "guestGuide",
      "faqs",
      "places",
      "footer",
      "sectionImage4",
    ]);
  });
});
