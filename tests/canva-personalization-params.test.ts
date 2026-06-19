import { describe, it, expect } from "vitest";
import { appendCanvaPersonalizationParams } from "@/lib/external-invitation-form";
import { decodeCanvaPersonalization } from "@/lib/canva-personalization";
import type { PublicGuestData } from "@/lib/types";

const GUEST: PublicGuestData = {
  token: "tok_1",
  name: "Maria Sá",
  companion: "João",
  tableLabel: "Mesa 5",
  totalGuests: 2,
  canInviteOthers: false,
  invitationSlug: "sara-e-hugo",
};

describe("appendCanvaPersonalizationParams", () => {
  it("appends a decodable pz param to a proxy src", () => {
    const out = appendCanvaPersonalizationParams(
      "/canva-proxy/x.canva.site/?disableScroll=1",
      GUEST,
    );
    const pz = new URLSearchParams(out.split("?")[1]).get("pz");
    expect(pz).toBeTruthy();
    const decoded = decodeCanvaPersonalization(pz);
    expect(decoded).toMatchObject({
      name: "Maria Sá",
      companion: "João",
      tableLabel: "Mesa 5",
      totalGuests: "2",
      token: "tok_1",
      nameSlug: "maria-sa",
    });
    expect(out).toContain("disableScroll=1");
  });

  it("no-ops for non-proxy srcs and when no guest", () => {
    expect(appendCanvaPersonalizationParams("https://x.canva.site/", GUEST)).toBe(
      "https://x.canva.site/",
    );
    expect(
      appendCanvaPersonalizationParams("/canva-proxy/x.canva.site/", null),
    ).toBe("/canva-proxy/x.canva.site/");
  });
});
