import { describe, expect, it } from "vitest";
import { Prisma } from "@/lib/generated/prisma/client";
import { buildInvitationCreateData } from "@/lib/invitation-create-data";
import { duplicateForm } from "./fixtures/invitation-duplication";

describe("buildInvitationCreateData", () => {
  it("maps the complete editable contract and connects only the supplied theme", () => {
    const body = duplicateForm({
      slug: "maria-pedro",
      eventType: "wedding",
      couple: { bride: "Maria", groom: "Pedro", monogram: "M&P" },
    });

    const data = buildInvitationCreateData(body, "theme_copy");

    expect(data.slug).toBe("maria-pedro");
    expect(data.theme).toEqual({ connect: { id: "theme_copy" } });
    expect(data.couple).toEqual(body.couple);
    expect(data.rsvp).toEqual(body.rsvp);
    expect(data.heroImage).toBe(body.heroImage);
    expect(data.videoUrl).toBe(body.videoUrl);
    expect(data.giftRegistry).toEqual(body.giftRegistry);
    expect(data.guestManagementEnabled).toBe(true);
    expect(data.ownerCanAddGuests).toBe(true);
    expect(data).not.toHaveProperty("guests");
    expect(data).not.toHaveProperty("rsvpResponses");
    expect(data).not.toHaveProperty("giftReservations");
    expect(data).not.toHaveProperty("landingFeatures");
    expect(data).not.toHaveProperty("ownerToken");
  });

  it("preserves ordinary-create defaults and sanitization", () => {
    const body = duplicateForm({
      slug: "maria-pedro",
      heroHeight: undefined,
      heroMediaFit: "invalid" as never,
      rsvp: undefined as never,
      spacingStyles: undefined,
      priceOverrides: { USD: { fromCents: -1 } },
      landingCustomizationLevel: "invalid" as never,
    });

    const data = buildInvitationCreateData(body, "theme_copy");

    expect(data.heroHeight).toBeNull();
    expect(data.heroMediaFit).toBeNull();
    expect(data.rsvp).toEqual({ enabled: true });
    expect(data.priceOverrides).toBe(Prisma.JsonNull);
    expect(data.landingCustomizationLevel).toBe("fully_customizable");
  });
});
