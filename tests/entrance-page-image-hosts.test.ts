import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const curtainPage = readFileSync(
  "components/curtain-canva/CurtainCanvaPage.tsx",
  "utf8",
);
const videoPage = readFileSync(
  "components/video-entrance/VideoEntrancePage.tsx",
  "utf8",
);
const sections = readFileSync(
  "components/shared/RevealableExternalSections.tsx",
  "utf8",
);

describe("entrance image section hosts", () => {
  it("hosts each entrance hero and filters it from the fallback canvas", () => {
    for (const source of [curtainPage, videoPage]) {
      expect(source).toMatch(/<SectionImageHost[\s\S]{0,120}sectionKey="hero"/);
      expect(source).toMatch(
        /<SectionImageHost[\s\S]{0,180}sectionKey="hero"[\s\S]{0,180}frontLayerPosition="interleaved"/,
      );
      expect(source).toContain("hostedSectionKeys={hostedSectionKeys}");
      expect(source).toContain("migrationReady={imageMigrationReady}");
    }
  });

  it("passes image ownership and readiness through shared sections", () => {
    for (const source of [curtainPage, videoPage]) {
      expect(source).toContain("imageLayer={invitation.imageLayer}");
      expect(source).toContain(
        "onCanvaContentHeightReady={handleCanvaContentHeightReady}",
      );
    }
  });

  it("hosts every shared lower entrance section", () => {
    for (const key of [
      "scratchReveal",
      "countdown",
      "personalGuestCard",
      "coupleGallery",
      "canvaDetails",
      "places",
      "rsvp",
    ]) {
      expect(sections).toContain(`sectionKey="${key}"`);
    }
  });

  it("does not create gallery or places hosts when their content is absent", () => {
    expect(sections).toContain(
      "const coupleGalleryOn = shouldRenderCoupleGallery(invitation);",
    );
    expect(sections).toContain(
      "const placesOn = shouldRenderPlaces(invitation);",
    );
    expect(sections).toContain("showInitialPageSections && coupleGalleryOn");
    expect(sections).toContain("showInitialPageSections && placesOn");
  });
});
