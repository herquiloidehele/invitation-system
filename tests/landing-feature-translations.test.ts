import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findManyMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    landingFeature: {
      findMany: findManyMock,
    },
  },
}));

import {
  getBestSellerFeatures,
  getGalleryFeaturesByCategory,
  landingInvitationSelect,
  landingSaveTheDateSelect,
} from "@/lib/landing-features";

const sharedProductFields = {
  couple: { bride: "Ana", groom: "Rui" },
  date: { display: "12 de Maio de 2027" },
  landingImageUrl: null,
  landingCustomizationLevel: "fully_customizable",
  priceFromCents: null,
  discountPriceFromCents: null,
  currency: "EUR",
  priceOverrides: null,
};

describe("localized landing features", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it("selects landing translations for both product types", () => {
    expect(landingInvitationSelect).toMatchObject({
      landingTranslations: true,
    });
    expect(landingSaveTheDateSelect).toMatchObject({
      landingTranslations: true,
    });
  });

  it("localizes invitation gallery copy with per-field fallback", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "gallery-1",
        galleryCategory: "wedding",
        invitation: {
          ...sharedProductFields,
          slug: "ana-rui",
          eventType: "wedding",
          heroImage: "/hero.jpg",
          landingModelName: "Clássico",
          landingSubtitle: "Elegante",
          landingDescription: "Convite em papel",
          landingTranslations: {
            en: {
              landingModelName: "Classic",
              landingDescription: "Paper invitation",
            },
          },
        },
        saveTheDate: null,
      },
    ]);

    const result = await getGalleryFeaturesByCategory("EUR", "en");

    expect(result.wedding[0]).toMatchObject({
      title: "Classic",
      subtitle: "Elegante",
      description: "Paper invitation",
      href: "/ana-rui",
    });
  });

  it("localizes Save the Date best-seller copy", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "best-1",
        invitation: null,
        saveTheDate: {
          ...sharedProductFields,
          slug: "ana-rui-save",
          landingModelName: "Romântico",
          landingSubtitle: "Guarde a data",
          landingDescription: "Anúncio digital",
          landingTranslations: {
            es: {
              landingModelName: "Romántico",
              landingSubtitle: "Reserva la fecha",
              landingDescription: "Anuncio digital",
            },
          },
        },
      },
    ]);

    const result = await getBestSellerFeatures("EUR", "es");

    expect(result[0]).toMatchObject({
      title: "Romántico",
      subtitle: "Reserva la fecha",
      description: "Anuncio digital",
      href: "/s/ana-rui-save",
    });
  });

  it("passes the resolved route locale to gallery and best-seller accessors", () => {
    const source = readFileSync("app/[locale]/page.tsx", "utf8");

    expect(source).toContain("params: Promise<{ locale: string }>");
    expect(source).toContain("resolveLocale(rawLocale)");
    expect(source).toContain(
      "getGalleryFeaturesByCategory(viewerCurrency, locale)",
    );
    expect(source).toContain("getBestSellerFeatures(viewerCurrency, locale)");
  });
});
