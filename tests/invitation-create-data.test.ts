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
      showCalendarCta: false,
      showDecorativeLines: false,
      countdown: { enabled: true, layout: "inline" },
      rsvpPage: { base: "theme", layout: "editorial" },
      heroVideoMuted: false,
    });

    const data = buildInvitationCreateData(body, "theme_copy");

    expect(data.slug).toBe("maria-pedro");
    expect(data.theme).toEqual({ connect: { id: "theme_copy" } });
    expect(data.couple).toEqual(body.couple);
    expect(data.rsvp).toEqual(body.rsvp);
    expect(data.heroImage).toBe(body.heroImage);
    expect(data.videoUrl).toBe(body.videoUrl);
    expect(data.heroVideoMuted).toBe(false);
    expect(data.saveTheDateBackgroundImageUrl).toBe(
      body.saveTheDateBackgroundImageUrl,
    );
    expect(data.showCalendarCta).toBe(body.showCalendarCta);
    expect(data.showDecorativeLines).toBe(false);
    expect(data.countdown).toEqual(body.countdown);
    expect(data.rsvpPage).toEqual({ base: "theme", layout: "editorial" });
    expect(data.giftRegistry).toEqual(body.giftRegistry);
    expect(data.transportInfo).toEqual(body.transportInfo);
    expect(data.guestPhotoUpload).toEqual(body.guestPhotoUpload);
    expect(data.cardStyles).toEqual(body.cardStyles);
    expect(data.guestManagementEnabled).toBe(true);
    expect(data.ownerCanAddGuests).toBe(true);
    expect(data.checkInEnabled).toBe(true);
    expect(data.qrCodeStyle).toEqual({ fgColor: "#aa0000", bgColor: "#ffeeee" });
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
      heroVideoMuted: undefined,
      showDecorativeLines: undefined,
    });

    const data = buildInvitationCreateData(body, "theme_copy");

    expect(data.heroHeight).toBeNull();
    expect(data.heroMediaFit).toBeNull();
    expect(data.heroVideoMuted).toBe(true);
    expect(data.rsvp).toEqual({ enabled: true });
    expect(data.showCalendarCta).toBe(true);
    expect(data.showDecorativeLines).toBe(true);
    expect(data.priceOverrides).toBe(Prisma.JsonNull);
    expect(data.landingCustomizationLevel).toBe("fully_customizable");
  });

  it("stores a missing or invalid rsvpPage as JSON null", () => {
    const missing = buildInvitationCreateData(
      duplicateForm({ rsvpPage: undefined }),
      "theme_copy",
    );
    expect(missing.rsvpPage).toBe(Prisma.JsonNull);
    const invalid = buildInvitationCreateData(
      duplicateForm({ rsvpPage: { base: "dark" } as never }),
      "theme_copy",
    );
    expect(invalid.rsvpPage).toBe(Prisma.JsonNull);
  });

  it("stores EUR when a new invitation submits the legacy AOA currency", () => {
    const body = duplicateForm({ currency: "AOA" });
    const data = buildInvitationCreateData(body, "theme_copy");
    expect(data.currency).toBe("EUR");
  });

  it("stores a minimal host guest form mode", () => {
    const data = buildInvitationCreateData(
      duplicateForm({ ownerGuestFormMode: "minimal" }),
      "theme_copy",
    );
    expect(data.ownerGuestFormMode).toBe("minimal");
  });

  it("defaults an invalid host guest form mode to complete", () => {
    const data = buildInvitationCreateData(
      duplicateForm({ ownerGuestFormMode: "invalid" as never }),
      "theme_copy",
    );
    expect(data.ownerGuestFormMode).toBe("complete");
  });

  it("stores a normalized ordered landing detail gallery", () => {
    const data = buildInvitationCreateData(
      duplicateForm({
        landingDetailImages: [
          " https://cdn.example.com/detail-a.jpg ",
          "",
          "https://cdn.example.com/detail-a.jpg",
          "https://cdn.example.com/detail-b.jpg",
        ],
      }),
      "theme_copy",
    );

    expect(data.landingDetailImages).toEqual([
      "https://cdn.example.com/detail-a.jpg",
      "https://cdn.example.com/detail-b.jpg",
    ]);
  });
});
