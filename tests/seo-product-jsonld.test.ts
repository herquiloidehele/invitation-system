import { describe, expect, it } from "vitest";

import { buildProductJsonLd } from "@/lib/seo";

describe("buildProductJsonLd", () => {
  it("emits an Offer with a numeric price in major units", () => {
    const result = buildProductJsonLd({
      name: "Modelo Dream",
      description: "Convite digital com vídeo",
      url: "https://brindeal.studio/modelos/convite/dream",
      image: "https://cdn.example.com/dream.jpg",
      offer: { priceCents: 10000, currency: "EUR" },
    });

    expect(result["@type"]).toBe("Product");
    expect(result.name).toBe("Modelo Dream");
    expect(result.image).toEqual(["https://cdn.example.com/dream.jpg"]);
    expect(result.offers).toEqual({
      "@type": "Offer",
      price: "100.00",
      priceCurrency: "EUR",
      url: "https://brindeal.studio/modelos/convite/dream",
      availability: "https://schema.org/InStock",
    });
  });

  it("uses the discounted price when one is present", () => {
    const result = buildProductJsonLd({
      name: "Modelo Dream",
      description: null,
      url: "https://brindeal.studio/modelos/convite/dream",
      image: null,
      offer: { priceCents: 3550, currency: "BRL" },
    });

    expect(result.offers).toMatchObject({
      price: "35.50",
      priceCurrency: "BRL",
    });
    expect(result.image).toBeUndefined();
    expect(result.description).toBeUndefined();
  });

  it("omits offers entirely when the product has no price", () => {
    const result = buildProductJsonLd({
      name: "Modelo Dream",
      description: "Sem preço",
      url: "https://brindeal.studio/modelos/convite/dream",
      image: null,
      offer: null,
    });

    expect(result.offers).toBeUndefined();
    expect(result.name).toBe("Modelo Dream");
  });
});
