import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "components/shared/RichExternalLinkPage.tsx",
  "utf8",
);

describe("RichExternalLinkPage image section hosts", () => {
  it.each([
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
  ])("anchors %s images to the rendered section", (sectionKey) => {
    expect(source).toMatch(
      new RegExp(`<SectionImageHost[\\s\\S]{0,160}sectionKey="${sectionKey}"`),
    );
  });

  it("filters section-owned images from the page-wide fallback canvas", () => {
    expect(source).toContain("hostedSectionKeys={hostedSectionKeys}");
  });

  it("waits for the responsive Canva height before migrating legacy images", () => {
    expect(source).toContain("migrationReady={imageMigrationReady}");
    expect(source).toContain(
      "onContentHeightReady={handleCanvaContentHeightReady}",
    );
  });
});
