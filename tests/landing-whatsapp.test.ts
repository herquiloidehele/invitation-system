import { describe, expect, it } from "vitest";
import pt from "../messages/pt.json";
import { buildPurchaseMessage, buildWhatsappUrl } from "@/lib/landing-whatsapp";

describe("landing WhatsApp helpers", () => {
  it("builds the configured WhatsApp URL with encoded text", () => {
    expect(buildWhatsappUrl("Olá! Quero comprar o modelo Jardim.")).toBe(
      "https://wa.me/351910671757?text=Ol%C3%A1!%20Quero%20comprar%20o%20modelo%20Jardim.",
    );
  });

  it("builds a purchase message with a trimmed model title", () => {
    expect(buildPurchaseMessage("  Modelo Jardim  ")).toBe(
      "Olá! Quero comprar o modelo Modelo Jardim.",
    );
  });

  it("uses the fallback title when the model title is blank", () => {
    expect(buildPurchaseMessage("   ", "Convite")).toBe(
      "Olá! Quero comprar o modelo Convite.",
    );
  });

  it("encodes the localized custom-invitation enquiry", () => {
    expect(
      buildWhatsappUrl(pt.LandingCustomInvitation.whatsappMessage),
    ).toBe(
      "https://wa.me/351910671757?text=Ol%C3%A1!%20Gostaria%20de%20criar%20um%20convite%20100%25%20personalizado.",
    );
  });
});
