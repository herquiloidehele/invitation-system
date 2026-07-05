import { describe, expect, it } from "vitest";

import {
  CONSTELLATION_GROUPS,
  getConstellationPreview,
  type ConstellationFeatureKey,
} from "@/components/landing/landing-constellation-data";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import pt from "@/messages/pt.json";

const EXPECTED_FEATURES: ConstellationFeatureKey[] = [
  "animatedEntrance",
  "music",
  "customDesign",
  "socialPreview",
  "countdown",
  "schedule",
  "coupleStory",
  "photoGallery",
  "dressCode",
  "maps",
  "calendar",
  "giftRegistry",
  "guestGuide",
  "faqs",
  "languages",
  "personalizedRsvp",
  "partyResponses",
  "dietaryNotes",
  "customAnswers",
  "guestTracking",
  "whatsapp",
  "excelExport",
];

describe("CONSTELLATION_GROUPS", () => {
  it("keeps the four customer-outcome groups in the approved order", () => {
    expect(CONSTELLATION_GROUPS.map((group) => group.key)).toEqual([
      "entrance",
      "story",
      "guide",
      "organize",
    ]);
  });

  it("contains every audited capability exactly once", () => {
    const actual = CONSTELLATION_GROUPS.flatMap(
      (group) => group.features,
    ) as ConstellationFeatureKey[];

    expect(actual).toHaveLength(EXPECTED_FEATURES.length);
    expect(new Set(actual).size).toBe(actual.length);
    expect([...actual].sort()).toEqual([...EXPECTED_FEATURES].sort());
  });

  it("gives every group at least four features", () => {
    expect(
      CONSTELLATION_GROUPS.every((group) => group.features.length >= 4),
    ).toBe(true);
  });
});

describe("LandingConstellation translations", () => {
  it.each([
    ["pt", pt],
    ["en", en],
    ["es", es],
  ])("%s defines every constellation label", (_locale, messages) => {
    const section = messages.LandingConstellation;

    expect(section.eyebrow).toBeTruthy();
    expect(section.title).toBeTruthy();
    expect(section.body).toBeTruthy();

    for (const group of CONSTELLATION_GROUPS) {
      expect(section.groups[group.key].title).toBeTruthy();
      for (const feature of group.features) {
        expect(section.features[feature]).toBeTruthy();
      }
    }
  });
});

describe("getConstellationPreview", () => {
  it("uses the first configured live demo", () => {
    expect(
      getConstellationPreview([
        { id: "first", title: "First invitation", href: "/first" },
        { id: "second", title: "Second invitation", href: "/second" },
      ]),
    ).toEqual({
      id: "first",
      title: "First invitation",
      href: "/first",
    });
  });

  it("returns null when no live demo is configured", () => {
    expect(getConstellationPreview([])).toBeNull();
  });
});
