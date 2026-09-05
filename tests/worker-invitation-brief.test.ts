import { describe, expect, it } from "vitest";

import type { InvitationData } from "@/lib/types";
import { buildInvitationBrief } from "@/worker/lib/invitation-brief";

function inv(overrides: Partial<InvitationData> = {}): InvitationData {
  return {
    slug: "ana-e-bruno",
    couple: { bride: "Ana", groom: "Bruno", monogram: "A&B" },
    eventType: "wedding",
    enabledLocales: ["pt", "en"],
    giftRegistry: { enabled: true, items: [{ id: "g1", name: "x" }] },
    rsvp: { enabled: true },
    audio: { enabled: true, src: "/a.mp3" },
    ...overrides,
  } as InvitationData;
}

describe("buildInvitationBrief", () => {
  it("names the couple and event type", () => {
    const b = buildInvitationBrief(inv());
    expect(b).toContain("Ana");
    expect(b).toContain("Bruno");
    expect(b).toContain("wedding");
  });

  it("lists the enabled feature set", () => {
    const b = buildInvitationBrief(inv()).toLowerCase();
    expect(b).toContain("gifts");
    expect(b).toContain("rsvp");
    expect(b).toContain("audio");
  });

  it("marks disabled features off", () => {
    const b = buildInvitationBrief(
      inv({ giftRegistry: { enabled: false } as never }),
    ).toLowerCase();
    expect(b).toMatch(/gifts:\s*(off|no|disabled)/);
  });

  it("lists locales", () => {
    expect(buildInvitationBrief(inv())).toContain("pt");
    expect(buildInvitationBrief(inv())).toContain("en");
  });
});
