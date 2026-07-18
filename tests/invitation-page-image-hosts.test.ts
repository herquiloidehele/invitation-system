import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("components/shared/InvitationPage.tsx", "utf8");

describe("InvitationPage image section hosts", () => {
  it.each([
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
  ])("hosts the %s image section", (sectionKey) => {
    expect(source).toMatch(
      new RegExp(`<SectionImageHost[\\s\\S]{0,160}sectionKey="${sectionKey}"`),
    );
  });

  it("passes active hosted keys to the page canvas", () => {
    expect(source).toContain(
      "hostedSectionKeys={getStandardInvitationImageSectionKeys(invitation)}",
    );
  });

  it("mounts optional hosts only when their section renders", () => {
    expect(source).toContain("shouldRenderCoupleGallery(invitation) &&");
    expect(source).toContain("shouldRenderPlaces(invitation) &&");
  });
});
