import { describe, expect, it } from "vitest";

import { buildInvitationBrief } from "@/worker/lib/invitation-brief";
import type { InvitationData } from "@/lib/types";

const base = {
  couple: { bride: "Sofia", groom: "Pedro" },
  eventType: "wedding",
  enabledLocales: ["pt", "en"],
  date: { display: "18 de Julho, 2026", iso: "2026-07-18T16:00:00" },
  location: { name: "Quinta do Amor", address: "Porto" },
  rsvp: { enabled: true },
  schedule: [{ time: "16:00" }, { time: "19:00" }],
  faqs: [{ q: "a", a: "b" }],
} as unknown as InvitationData;

describe("buildInvitationBrief", () => {
  it("still forbids copying content into code", () => {
    expect(buildInvitationBrief(base)).toContain("props.invitation");
  });

  it("includes the venue and date so directions can be grounded", () => {
    const brief = buildInvitationBrief(base);
    expect(brief).toContain("Quinta do Amor");
    expect(brief).toContain("2026");
  });

  it("reports which content sections actually have data", () => {
    const brief = buildInvitationBrief(base);
    expect(brief).toMatch(/schedule: 2/i);
    expect(brief).toMatch(/faqs: 1/i);
  });

  it("derives the season from the date for palette grounding", () => {
    expect(buildInvitationBrief(base)).toMatch(/season: summer/i);
  });

  it("treats ourStory as a flag, not a list", () => {
    const withStory = {
      ...base,
      ourStory: { enabled: true, title: "t", description: "d" },
    } as unknown as InvitationData;
    expect(buildInvitationBrief(withStory)).toMatch(/our story: on/i);
    expect(buildInvitationBrief(base)).toMatch(/our story: off/i);
  });
});
