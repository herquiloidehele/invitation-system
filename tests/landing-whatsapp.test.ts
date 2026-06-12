import { describe, expect, it } from "vitest";
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
});
