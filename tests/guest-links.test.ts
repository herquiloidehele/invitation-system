import { describe, expect, it } from "vitest";
import {
  buildPersonalInviteUrl,
  buildWhatsAppUrl,
  buildSmsUrl,
  renderMessageTemplate,
  COUNTRY_CODES,
  slugifyName,
} from "../lib/guest-links";

describe("slugifyName", () => {
  it("strips accents and lowercases", () => {
    expect(slugifyName("José")).toBe("jose");
  });

  it("slugifies multi-word accented names", () => {
    expect(slugifyName("Conceição da Silva")).toBe("conceicao-da-silva");
  });

  it("collapses repeated whitespace and trims", () => {
    expect(slugifyName("  Maria   Silva  ")).toBe("maria-silva");
  });

  it("collapses repeated separators", () => {
    expect(slugifyName("Ana--Beatriz")).toBe("ana-beatriz");
  });

  it("returns empty string for empty input", () => {
    expect(slugifyName("")).toBe("");
  });

  it("strips non-alphanumeric symbols like &", () => {
    expect(slugifyName("João & Maria")).toBe("joao-maria");
  });
});

describe("buildPersonalInviteUrl", () => {
  it("builds the canonical URL with g and n params", () => {
    expect(
      buildPersonalInviteUrl({
        origin: "https://example.com",
        slug: "ana-pedro",
        token: "tok123",
        name: "Maria Silva",
      }),
    ).toBe("https://example.com/ana-pedro?g=tok123&n=maria-silva");
  });

  it("normalizes a trailing slash on the origin", () => {
    expect(
      buildPersonalInviteUrl({
        origin: "https://example.com/",
        slug: "ana-pedro",
        token: "tok123",
        name: "Maria Silva",
      }),
    ).toBe("https://example.com/ana-pedro?g=tok123&n=maria-silva");
  });

  it("slugifies accented names for the n param", () => {
    expect(
      buildPersonalInviteUrl({
        origin: "https://example.com",
        slug: "ana-pedro",
        token: "tok",
        name: "José",
      }),
    ).toBe("https://example.com/ana-pedro?g=tok&n=jose");
  });

  it("omits the n param when the name is empty", () => {
    expect(
      buildPersonalInviteUrl({
        origin: "https://example.com",
        slug: "ana-pedro",
        token: "tok",
        name: "",
      }),
    ).toBe("https://example.com/ana-pedro?g=tok");
  });
});

describe("buildWhatsAppUrl", () => {
  it("strips the leading + and percent-encodes spaces in the message", () => {
    expect(
      buildWhatsAppUrl({
        countryCode: "+258",
        phoneNumber: "841234567",
        message: "Olá Maria",
      }),
    ).toBe("https://wa.me/258841234567?text=Ol%C3%A1%20Maria");
  });

  it("strips spaces from phone digits", () => {
    expect(
      buildWhatsAppUrl({
        countryCode: "+351",
        phoneNumber: "912 345 678",
        message: "Test",
      }),
    ).toBe("https://wa.me/351912345678?text=Test");
  });

  it("omits ?text= when the message is empty", () => {
    expect(
      buildWhatsAppUrl({
        countryCode: "+258",
        phoneNumber: "841234567",
        message: "",
      }),
    ).toBe("https://wa.me/258841234567");
  });
});

describe("buildSmsUrl", () => {
  it("keeps the leading + and url-encodes the body", () => {
    expect(
      buildSmsUrl({
        countryCode: "+258",
        phoneNumber: "841234567",
        message: "Olá Maria",
      }),
    ).toBe("sms:+258841234567?body=Ol%C3%A1%20Maria");
  });

  it("returns a bare sms: URI when the message is empty", () => {
    expect(
      buildSmsUrl({
        countryCode: "+1",
        phoneNumber: "5551234",
        message: "",
      }),
    ).toBe("sms:+15551234");
  });
});

describe("renderMessageTemplate", () => {
  it("substitutes {name} and {link}", () => {
    expect(
      renderMessageTemplate("Olá {name}, link: {link}", {
        name: "Maria",
        link: "https://x.com/y",
      }),
    ).toBe("Olá Maria, link: https://x.com/y");
  });

  it("substitutes multiple occurrences of the same placeholder", () => {
    expect(
      renderMessageTemplate("{name} {name}", { name: "A", link: "" }),
    ).toBe("A A");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(
      renderMessageTemplate("hi {name} {unknown}", { name: "A", link: "" }),
    ).toBe("hi A {unknown}");
  });

  it("returns empty string for an empty template", () => {
    expect(renderMessageTemplate("", { name: "A", link: "B" })).toBe("");
  });
});

describe("COUNTRY_CODES", () => {
  it("starts with Mozambique as the default", () => {
    expect(COUNTRY_CODES[0].code).toBe("+258");
    expect(COUNTRY_CODES[0].label).toBe("Moçambique");
  });

  it("includes the documented set of country codes", () => {
    const codes = COUNTRY_CODES.map((c) => c.code);
    expect(codes).toEqual(
      expect.arrayContaining(["+258", "+351", "+55", "+1", "+44", "+34", "+27"]),
    );
  });
});
