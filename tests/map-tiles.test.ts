import { describe, expect, it } from "vitest";

import { resolveMapTiles } from "@/lib/map-tiles";

describe("resolveMapTiles", () => {
  it("falls back to keyless OpenStreetMap tiles when no CARTO key is set", () => {
    for (const key of [undefined, "", "   "]) {
      const tiles = resolveMapTiles(false, key);
      expect(tiles.url).toBe("https://tile.openstreetmap.org/{z}/{x}/{y}.png");
      expect(tiles.url).not.toContain("cartocdn");
      expect(tiles.options.maxNativeZoom).toBe(19);
      // an explicit `subdomains: undefined` would override Leaflet's default and crash
      expect("subdomains" in tiles.options).toBe(false);
      expect(tiles.invert).toBe(false);
    }
  });

  it("inverts the OpenStreetMap tiles for dark themes, which have no dark style", () => {
    expect(resolveMapTiles(true, undefined).invert).toBe(true);
  });

  it("uses CARTO's light and dark styles with the key appended", () => {
    const light = resolveMapTiles(false, "abc123");
    expect(light.url).toBe(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=abc123",
    );
    expect(light.options.subdomains).toBe("abcd");
    expect(light.invert).toBe(false);

    const dark = resolveMapTiles(true, "abc123");
    expect(dark.url).toContain("/dark_all/");
    expect(dark.invert).toBe(false);
  });

  it("trims and URL-encodes the key", () => {
    expect(resolveMapTiles(false, " a b&c ").url.endsWith("?key=a%20b%26c")).toBe(
      true,
    );
  });

  it("always credits OpenStreetMap, and CARTO when its tiles are used", () => {
    expect(resolveMapTiles(false, undefined).options.attribution).toContain(
      "OpenStreetMap",
    );
    const carto = resolveMapTiles(false, "abc123").options.attribution;
    expect(carto).toContain("OpenStreetMap");
    expect(carto).toContain("CARTO");
  });
});
