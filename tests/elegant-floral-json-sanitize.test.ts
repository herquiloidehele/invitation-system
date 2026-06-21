import { describe, expect, it } from "vitest";
import { sanitizeJsonField } from "../lib/json-sanitize";

describe("elegant-floral JSON persistence", () => {
  it("preserves extended dressCode verbatim", () => {
    const dressCode = {
      enabled: true,
      text: "Le Jardin de Paradis",
      title: "LE JARDIN DE PARADIS",
      intro: "Uma noite de elegância.",
      ladies: {
        label: "SENHORAS",
        note: "VESTIDOS LONGOS EM TONS COMO:",
        palette: [{ name: "Azul safira", hex: "#0F52BA" }],
        imageUrl: "https://x/gowns.png",
      },
      gentlemen: {
        label: "SENHORES",
        note: "Smoking…",
        imageUrl: "https://x/suits.png",
      },
      reservedNote: "Vermelho é reservado às madrinhas e mães.",
    };
    expect(sanitizeJsonField(dressCode, { enabled: false, text: "" })).toEqual(
      dressCode,
    );
  });

  it("preserves location photos verbatim", () => {
    const location = {
      name: "Igreja de Jesus",
      address: "Sé Catedral (Cidade Alta)",
      googleMapsUrl: "https://maps/x",
      wazeUrl: "https://waze/x",
      photos: [{ src: "a.jpg" }, { src: "b.jpg", positionY: 30 }],
    };
    expect(sanitizeJsonField(location, {})).toEqual(location);
  });
});
