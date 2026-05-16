import { describe, expect, it } from "vitest";

import {
  buildContactMessage,
  buildWhatsappUrl,
  DEFAULT_WHATSAPP_MESSAGE,
  WHATSAPP_NUMBER,
} from "@/lib/landing-whatsapp";

describe("landing WhatsApp helpers", () => {
  it("builds a wa.me URL with the Brindeal number and encoded default message", () => {
    expect(buildWhatsappUrl()).toBe(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_WHATSAPP_MESSAGE)}`,
    );
  });

  it("builds a contact message with only the fields the visitor filled", () => {
    expect(
      buildContactMessage({
        name: "Maria Silva",
        eventType: "Casamento",
        date: "2026-09-12",
        guests: "120",
        message: "Queremos algo elegante e simples.",
      }),
    ).toBe(
      [
        DEFAULT_WHATSAPP_MESSAGE,
        "Nome: Maria Silva",
        "Tipo de evento: Casamento",
        "Data: 2026-09-12",
        "Convidados: 120",
        "Mensagem: Queremos algo elegante e simples.",
      ].join("\n"),
    );

    expect(
      buildContactMessage({
        name: "",
        eventType: "Baptizado",
        date: "",
        guests: "",
        message: "",
      }),
    ).toBe([DEFAULT_WHATSAPP_MESSAGE, "Tipo de evento: Baptizado"].join("\n"));
  });
});
