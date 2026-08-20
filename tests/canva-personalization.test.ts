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

describe("applyCanvaPersonalization — Canva compact length metadata", () => {
  // Real "export_website" format: text lives in a plain string array `"A":[...]`
  // and the element's character count is the single number in the sibling
  // `"B":[N]` array (styling is in `"C":[...]`). This is what current Canva
  // exports use; the token's own `"B"` count MUST be updated, and no unrelated
  // structure elsewhere in the document may be touched.
  const compact = (text: string, count: number) =>
    `"C":{"A":["${text}"],"B":[${count}],"C":[{"M":"#445129"}]}`;

  // An unrelated attributed-format element placed AFTER the token, to prove the
  // patcher never reaches across into a different element's length metadata.
  const farAttributed =
    `"A":[{"A?":"A","A":"Confirmar"}],` +
    `"B":[{"A?":"A","A":{"color":{"B":"#000"}}},{"A?":"B","A":9}],"b":{"A":[9]}`;

  it("shrinks the covering count for a shorter value and leaves other elements intact", () => {
    const html = compact("{{num_total}}\\n", 14) + "," + farAttributed;
    const out = applyCanvaPersonalization(html, { ...SAMPLE, totalGuests: "150" });
    expect(out).toContain('"A":["150\\n"]');
    expect(out).toContain('"B":[4]'); // 14 + (3 - 13)
    // The unrelated element's retain and total are untouched.
    expect(out).toContain('{"A?":"B","A":9}');
    expect(out).toContain('"b":{"A":[9]}');
  });

  it("grows the covering count for a longer value", () => {
    const html = compact("{{nome}}\\n", 9);
    const out = applyCanvaPersonalization(html, { ...SAMPLE, name: "Herquilóide" });
    expect(out).toContain('"A":["Herquilóide\\n"]');
    expect(out).toContain('"B":[12]'); // 9 + (11 - 8)
  });

  it("adjusts a single count once per token in the same element", () => {
    const html = compact("{{nome}} {{acompanhante}}\\n", 25);
    const out = applyCanvaPersonalization(html, {
      ...SAMPLE,
      name: "Ana", // 8 -> 3  (delta -5)
      companion: "Bo", // 16 -> 2 (delta -14)
    });
    expect(out).toContain('"A":["Ana Bo\\n"]');
    expect(out).toContain('"B":[6]'); // 25 - 5 - 14
  });
});

describe("applyCanvaPersonalization — Canva run-length (D) metadata", () => {
  // Faithful "export_website" text element: text in "A", element char count in
  // "B", a style palette in "C", and per-run char lengths in
  // "D":[lead, ...runLengths] mapping character ranges to styles. Both "B" AND
  // the run in "D" that covers the token must grow/shrink with the value, or the
  // characters beyond the old run render in the default font and the line's
  // position breaks.
  const el = (text: string, b: number, d: string) =>
    `"C":{"A":["${text}"],"B":[${b}],` +
    `"C":[{"C":"F,0","G":"85px","M":"#445129","c":"center"},{"BG":"none"},{"D":true}],` +
    `"D":[${d}],"E":{}}`;

  const farAttributed =
    `"A":[{"A?":"A","A":"x"}],` +
    `"B":[{"A?":"A","A":{"color":{"B":"#000"}}},{"A?":"B","A":9}],"b":{"A":[9]}`;

  it("grows the covering run in D (token as its own element) and updates B", () => {
    // {{nome}}\n → 9 chars; run0=8 (the token), run1=1 (the newline).
    const html = el("{{nome}}\\n", 9, "0,8,1");
    const out = applyCanvaPersonalization(html, null); // {{nome}} → Convidado(a) (12)
    expect(out).toContain('"A":["Convidado(a)\\n"]');
    expect(out).toContain('"B":[13]'); // 9 + (12 - 8)
    expect(out).toContain('"D":[0,12,1]'); // run0: 8 → 12, newline run untouched
  });

  it("shrinks the covering run in D for a shorter value", () => {
    const html = el("{{nome}}\\n", 9, "0,8,1");
    const out = applyCanvaPersonalization(html, { ...SAMPLE, name: "Ana" });
    expect(out).toContain('"A":["Ana\\n"]');
    expect(out).toContain('"B":[4]'); // 9 + (3 - 8)
    expect(out).toContain('"D":[0,3,1]');
  });

  it("adjusts the correct run when the token is not at the element start", () => {
    // "Olá {{nome}}\n": run0=4 ("Olá "), run1=8 (token), run2=1 (newline).
    const html = el("Olá {{nome}}\\n", 13, "0,4,8,1");
    const out = applyCanvaPersonalization(html, { ...SAMPLE, name: "Ana" });
    expect(out).toContain('"A":["Olá Ana\\n"]');
    expect(out).toContain('"B":[8]'); // 13 + (3 - 8)
    expect(out).toContain('"D":[0,4,3,1]'); // only run1 changes
  });

  it("never touches an unrelated element's B or D", () => {
    const html = el("{{nome}}\\n", 9, "0,8,1") + "," + farAttributed;
    const out = applyCanvaPersonalization(html, null);
    expect(out).toContain('"D":[0,12,1]');
    expect(out).toContain('{"A?":"B","A":9}');
    expect(out).toContain('"b":{"A":[9]}');
  });
});
