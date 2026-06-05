import { describe, expect, it } from "vitest";

import en from "../messages/en.json";
import es from "../messages/es.json";
import pt from "../messages/pt.json";

type JsonObject = Record<string, unknown>;

function collectLeafPaths(
  obj: unknown,
  prefix: string[] = [],
  out: string[] = [],
): string[] {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj as JsonObject)) {
      collectLeafPaths(value, [...prefix, key], out);
    }
  } else {
    out.push(prefix.join("."));
  }
  return out;
}

describe("messages parity across locales", () => {
  const ptPaths = new Set(collectLeafPaths(pt));
  const enPaths = new Set(collectLeafPaths(en));
  const esPaths = new Set(collectLeafPaths(es));

  it("EN has every key PT has", () => {
    const missing = [...ptPaths].filter((p) => !enPaths.has(p));
    expect(missing).toEqual([]);
  });

  it("ES has every key PT has", () => {
    const missing = [...ptPaths].filter((p) => !esPaths.has(p));
    expect(missing).toEqual([]);
  });

  it("EN has no keys PT lacks", () => {
    const extra = [...enPaths].filter((p) => !ptPaths.has(p));
    expect(extra).toEqual([]);
  });

  it("ES has no keys PT lacks", () => {
    const extra = [...esPaths].filter((p) => !ptPaths.has(p));
    expect(extra).toEqual([]);
  });
});
