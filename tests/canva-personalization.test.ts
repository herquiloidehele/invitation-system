import { describe, it, expect } from "vitest";
import {
  encodeCanvaPersonalization,
  decodeCanvaPersonalization,
  applyCanvaPersonalization,
  type CanvaPersonalization,
} from "@/lib/canva-personalization";

const SAMPLE: CanvaPersonalization = {
  name: "Maria Sá",
  companion: "João",
  tableLabel: "Mesa 5",
  totalGuests: "2",
  token: "tok_abc",
  nameSlug: "maria-sa",
};

describe("encode/decode round-trip", () => {
  it("round-trips a payload", () => {
    const pz = encodeCanvaPersonalization(SAMPLE);
    expect(decodeCanvaPersonalization(pz)).toEqual(SAMPLE);
  });

  it("returns null for null/empty/garbage/oversized input", () => {
    expect(decodeCanvaPersonalization(null)).toBeNull();
    expect(decodeCanvaPersonalization("")).toBeNull();
    expect(decodeCanvaPersonalization("!!!not-base64!!!")).toBeNull();
    expect(decodeCanvaPersonalization("a".repeat(5000))).toBeNull();
  });
});

describe("applyCanvaPersonalization — text tokens", () => {
  it("replaces all four tokens with the guest's values, JSON-escaped", () => {
    const html = `"A":"Olá {{nome}} ({{acompanhante}}) {{mesa}} {{num_total}}"`;
    const out = applyCanvaPersonalization(html, SAMPLE);
    expect(out).toBe(`"A":"Olá Maria Sá (João) Mesa 5 2"`);
  });

  it("applies fallbacks when payload is null (no guest)", () => {
    const html = `{{nome}}|{{acompanhante}}|{{mesa}}|{{num_total}}`;
    expect(applyCanvaPersonalization(html, null)).toBe(`Convidado(a)|||`);
  });

  it("escapes quotes/backslashes and neutralizes angle brackets", () => {
    const p = { ...SAMPLE, name: 'A"B\\C<x>' };
    const out = applyCanvaPersonalization(`"A":"{{nome}}"`, p);
    expect(out).toBe(`"A":"A\\"B\\\\C\\u003cx\\u003e"`);
  });
});

describe("applyCanvaPersonalization — confirm link", () => {
  it("appends g & n to an absolute /confirmar/ URL", () => {
    const html = `"url":"https://app.com/pt/confirmar/sara-e-hugo"`;
    const out = applyCanvaPersonalization(html, SAMPLE);
    expect(out).toBe(
      `"url":"https://app.com/pt/confirmar/sara-e-hugo?g=tok_abc&n=maria-sa"`,
    );
  });

  it("appends to a relative /confirmar/ URL and respects an existing query + hash", () => {
    const html = `"x":"/confirmar/sara-e-hugo?foo=1#sec"`;
    const out = applyCanvaPersonalization(html, SAMPLE);
    expect(out).toBe(`"x":"/confirmar/sara-e-hugo?foo=1&g=tok_abc&n=maria-sa#sec"`);
  });

  it("does not touch confirm links when payload is null", () => {
    const html = `"url":"https://app.com/confirmar/x"`;
    expect(applyCanvaPersonalization(html, null)).toBe(html);
  });

  it("url-encodes token and slug", () => {
    const p = { ...SAMPLE, token: "a b", nameSlug: "a/b" };
    const out = applyCanvaPersonalization(`"/confirmar/x"`, p);
    expect(out).toBe(`"/confirmar/x?g=a%20b&n=a%2Fb"`);
  });
});

describe("applyCanvaPersonalization — Canva RLE length metadata", () => {
  // Mirrors Canva's run-length-encoded attributed text: a text run, a styling
  // array whose `{"A?":"B","A":N}` ops "retain N chars" of the preceding style,
  // and `"b":{"A":[total]}` for the element length.
  const rle = (text: string, retain: number, total: number) =>
    `"A":[{"A?":"A","A":"${text}"}],"B":[{"A?":"A","A":{"color":{"B":"#b3892b"},"font-size":{"B":"76"}}},{"A?":"B","A":${retain}},{"A?":"A","A":{"fill-id":{"B":"none"}}},{"A?":"B","A":1}],"E":{}},"b":{"A":[${total}]}`;

  it("bumps the covering retain and total for a longer value", () => {
    const html = rle("{{nome}}", 8, 9);
    const out = applyCanvaPersonalization(html, { ...SAMPLE, name: "Herquilóide" });
    expect(out).toContain('"A":"Herquilóide"');
    expect(out).toContain('{"A?":"B","A":11}'); // 8 + (11 - 8)
    expect(out).toContain('"b":{"A":[12]}'); // 9 + 3
    // The newline's own retain must stay untouched.
    expect(out).toContain('{"A?":"B","A":1}');
  });

  it("shrinks the covering retain and total for a shorter value", () => {
    const html = rle("{{num_total}}", 13, 14);
    const out = applyCanvaPersonalization(html, { ...SAMPLE, totalGuests: "3" });
    expect(out).toContain('"A":"3"');
    expect(out).toContain('"b":{"A":[2]}'); // 14 - 12
  });

  it("falls back to a plain replace when no RLE structure follows the token", () => {
    const out = applyCanvaPersonalization('"A":"Olá {{nome}}!"', {
      ...SAMPLE,
      name: "Maria Sá",
    });
    expect(out).toBe('"A":"Olá Maria Sá!"');
  });
});
