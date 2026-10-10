import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/i18n/locales";

type JsonObject = Record<string, unknown>;

function loadMessages(locale: string): JsonObject {
  return JSON.parse(
    readFileSync(`messages/${locale}.json`, "utf8"),
  ) as JsonObject;
}

/** Every string in the file, keyed by its dotted path (array indexes included). */
function collectLeaves(
  value: unknown,
  prefix: string[] = [],
  out: Map<string, unknown> = new Map(),
): Map<string, unknown> {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectLeaves(item, [...prefix, String(index)], out),
    );
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value as JsonObject)) {
      collectLeaves(child, [...prefix, key], out);
    }
  } else {
    out.set(prefix.join("."), value);
  }
  return out;
}

/**
 * The names a message interpolates: top-level ICU arguments (`{count, plural…}`
 * counts once, its branch bodies are skipped) and rich-text tags (`<open>`).
 * Translating or dropping one of these throws at render time.
 */
function collectPlaceholders(message: string): string[] {
  const names = new Set<string>();
  let depth = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message[i];
    if (char === "{") {
      if (depth === 0) {
        const name = /^\s*(\w+)/.exec(message.slice(i + 1))?.[1];
        if (name) names.add(`{${name}}`);
      }
      depth++;
    } else if (char === "}") {
      depth--;
    }
  }
  for (const [, tag] of message.matchAll(/<(\w+)>/g)) names.add(`<${tag}>`);
  return [...names].sort();
}

const source = collectLeaves(loadMessages(DEFAULT_LOCALE));
const translatedLocales = SUPPORTED_LOCALES.filter(
  (locale) => locale !== DEFAULT_LOCALE,
);

describe("placeholder extraction", () => {
  it("reads arguments and tags but not plural branch bodies", () => {
    expect(
      collectPlaceholders("{count, plural, one {# adulto} other {# adultos}}"),
    ).toEqual(["{count}"]);
    expect(
      collectPlaceholders("Toque em <menu></menu> e <open>Abrir</open>"),
    ).toEqual(["<menu>", "<open>"]);
    expect(collectPlaceholders("Por mais {price} em {days} dias")).toEqual([
      "{days}",
      "{price}",
    ]);
  });
});

describe.each(translatedLocales)("messages/%s.json", (locale) => {
  it("has every key Portuguese has", () => {
    const translated = collectLeaves(loadMessages(locale));
    expect([...source.keys()].filter((key) => !translated.has(key))).toEqual(
      [],
    );
  });

  it("has no keys Portuguese lacks", () => {
    const translated = collectLeaves(loadMessages(locale));
    expect([...translated.keys()].filter((key) => !source.has(key))).toEqual(
      [],
    );
  });

  it("leaves no message blank", () => {
    const translated = collectLeaves(loadMessages(locale));
    const blank = [...translated]
      .filter(([key]) => typeof source.get(key) === "string")
      .filter(([key, value]) => {
        const original = source.get(key) as string;
        return (
          original.trim() !== "" &&
          (typeof value !== "string" || value.trim() === "")
        );
      })
      .map(([key]) => key);
    expect(blank).toEqual([]);
  });

  it("keeps the placeholders of every Portuguese message", () => {
    const translated = collectLeaves(loadMessages(locale));
    const mismatched = [...source]
      .filter(([, value]) => typeof value === "string")
      .filter(([key, value]) => {
        const other = translated.get(key);
        return (
          typeof other === "string" &&
          collectPlaceholders(other).join() !==
            collectPlaceholders(value as string).join()
        );
      })
      .map(([key]) => key);
    expect(mismatched).toEqual([]);
  });
});

describe("language names", () => {
  it.each(SUPPORTED_LOCALES)(
    "messages/%s.json names every supported language",
    (locale) => {
      const names = (loadMessages(locale).Locale ?? {}) as JsonObject;
      expect(Object.keys(names).sort()).toEqual([...SUPPORTED_LOCALES].sort());
    },
  );

  it("names Italian in its own language everywhere", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const names = loadMessages(locale).Locale as JsonObject;
      expect(names.it).toBe("Italiano");
    }
  });
});
