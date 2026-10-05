// CARTO's basemaps need an API key (free tier at carto.com/basemaps/apikey):
// keyless requests are answered with an "API KEY REQUIRED" watermark tile.
// With a key we use CARTO's minimal light/dark styles; without one we fall back
// to the standard OpenStreetMap tiles, which need no key.

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://carto.com/attributions">CARTO</a>';

export interface MapTiles {
  url: string;
  /** Spread into Leaflet's tile layer options — only keys that apply are set. */
  options: { attribution: string; subdomains?: string; maxNativeZoom?: number };
  /** The source has no dark style, so the tiles are colour-inverted instead. */
  invert: boolean;
}

export function resolveMapTiles(dark: boolean, cartoKey?: string): MapTiles {
  const key = cartoKey?.trim();

  if (!key) {
    return {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: { attribution: OSM_ATTRIBUTION, maxNativeZoom: 19 },
      invert: dark,
    };
  }

  const style = dark ? "dark_all" : "light_all";
  return {
    url: `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(key)}`,
    options: {
      attribution: `${OSM_ATTRIBUTION} ${CARTO_ATTRIBUTION}`,
      subdomains: "abcd",
    },
    invert: false,
  };
}
