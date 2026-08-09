import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst, findMany } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { landingFeature: { findFirst, findMany } },
}));

import {
  getLandingProductDetails,
  getPublicLandingProductPaths,
} from "@/lib/landing-product-details-data";

const sharedPricing = {
  priceFromCents: 8900,
  discountPriceFromCents: null,
  currency: "EUR",
  priceOverrides: null,
};

const invitationFeature = {
  invitation: {
    slug: "amalfi",
    couple: { bride: "Ana", groom: "Miguel" },
    landingModelName: "Amalfi",
    landingSubtitle: "Editorial",
    landingDescription: "Um convite sereno.",
    landingTranslations: {
      en: {
        landingSubtitle: "Editorial collection",
        landingDescription: "A quiet invitation.",
      },
    },
    landingCustomizationLevel: "fully_customizable",
    landingDetailImages: ["detail"],
    landingImageUrl: "landing",
    heroImage: "hero",
    coupleGallery: {
      enabled: true,
      style: "grid",
      images: [{ id: "one", src: "gallery" }],
    },
    ...sharedPricing,
  },
  saveTheDate: null,
};

const saveTheDateFeature = {
  invitation: null,
  saveTheDate: {
    slug: "golden-heart",
    couple: { bride: "Lucía", groom: "Diego" },
    landingModelName: "Golden Heart",
    landingSubtitle: null,
    landingDescription: "Reserva la fecha.",
    landingTranslations: null,
    landingCustomizationLevel: "pre_designed",
    landingDetailImages: null,
    landingImageUrl: "landing",
    bottomHero: {
      enabled: true,
      mediaType: "image",
      mediaUrl: "bottom-image",
      title: "",
      description: "",
    },
    ...sharedPricing,
  },
};

describe("getLandingProductDetails", () => {
  beforeEach(() => {
    findFirst.mockReset();
    findMany.mockReset();
  });

  it("does not expose a product without an enabled landing feature", async () => {
    findFirst.mockResolvedValue(null);

    await expect(
      getLandingProductDetails("convite", "hidden", "EUR", "pt"),
    ).resolves.toBeNull();
  });

  it("normalizes localized invitation media and purchase data", async () => {
    findFirst.mockResolvedValue(invitationFeature);

    const result = await getLandingProductDetails(
      "convite",
      "amalfi",
      "EUR",
      "en",
    );

    expect(result).toMatchObject({
      kind: "convite",
      slug: "amalfi",
      previewHref: "/amalfi",
      detailsHref: "/modelos/convite/amalfi",
      title: "Amalfi",
      subtitle: "Editorial collection",
      description: "A quiet invitation.",
      customizationLevel: "fully_customizable",
      images: ["detail", "landing", "hero", "gallery"],
      price: { amount: "89 €" },
    });
    expect(result?.whatsappHref).toContain("https://wa.me/");
    expect(result?.whatsappHref).toContain("Amalfi");
  });

  it("uses image-based Save the Date bottom media as a fallback", async () => {
    findFirst.mockResolvedValue(saveTheDateFeature);

    const result = await getLandingProductDetails(
      "save-the-date",
      "golden-heart",
      "USD",
      "es",
    );

    expect(result).toMatchObject({
      kind: "save-the-date",
      previewHref: "/s/golden-heart",
      detailsHref: "/modelos/save-the-date/golden-heart",
      images: ["landing", "bottom-image"],
      customizationLevel: "pre_designed",
    });
  });
});

describe("getPublicLandingProductPaths", () => {
  it("returns unique public paths for both product kinds", async () => {
    findMany.mockResolvedValue([
      { invitation: { slug: "amalfi" }, saveTheDate: null },
      { invitation: { slug: "amalfi" }, saveTheDate: null },
      { invitation: null, saveTheDate: { slug: "golden-heart" } },
    ]);

    await expect(getPublicLandingProductPaths()).resolves.toEqual([
      { kind: "convite", slug: "amalfi" },
      { kind: "save-the-date", slug: "golden-heart" },
    ]);
  });
});
