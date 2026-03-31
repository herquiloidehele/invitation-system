import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// POST /api/admin/resolve-location
//
// Accepts a Google Maps link (short or full), follows redirects to resolve it,
// extracts coordinates and place name from the final URL, then reverse-geocodes
// via Nominatim to get a human-readable address.
//
// Returns a partial LocationInfo object that the client uses to auto-fill fields.
// ---------------------------------------------------------------------------

/** Hosts we accept as valid Google Maps links. */
const ALLOWED_HOSTS = [
  "maps.app.goo.gl",
  "goo.gl",
  "google.com",
  "www.google.com",
  "maps.google.com",
  "www.google.com.br",
  "google.com.br",
];

function isGoogleMapsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (ALLOWED_HOSTS.some((h) => host === h || host.endsWith("." + h))) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Follow redirects manually so we can capture the final URL.
 * Google short links may redirect through several intermediate URLs.
 */
async function resolveRedirects(
  url: string,
  maxRedirects = 10,
): Promise<string> {
  let current = url;
  for (let i = 0; i < maxRedirects; i++) {
    const res = await fetch(current, {
      redirect: "manual",
      headers: {
        // Use a browser-like UA so Google doesn't serve a consent page
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const location = res.headers.get("location");
    if (
      location &&
      (res.status === 301 ||
        res.status === 302 ||
        res.status === 303 ||
        res.status === 307 ||
        res.status === 308)
    ) {
      // Handle relative redirects
      current = location.startsWith("http")
        ? location
        : new URL(location, current).href;
      continue;
    }

    // No more redirects — check if the response body contains a meta/JS redirect
    // Google Maps sometimes returns a page with a JS redirect in the body
    if (res.status === 200) {
      const body = await res.text();
      // Look for window.location or meta refresh patterns
      const metaMatch = body.match(
        /content=["']\d+;\s*url=(https:\/\/www\.google\.[^"']+)["']/i,
      );
      if (metaMatch) {
        current = metaMatch[1];
        continue;
      }
      // Look for: window.location.replace("...") or window.location='...'
      const jsMatch = body.match(
        /window\.location(?:\.replace)?\s*\(\s*["'](https:\/\/www\.google\.[^"']+)["']\s*\)/,
      );
      if (jsMatch) {
        current = jsMatch[1];
        continue;
      }
      // Also check for a <a href="..."> pointing to maps
      const hrefMatch = body.match(
        /href=["'](https:\/\/www\.google\.[^"']*\/maps[^"']*)["']/,
      );
      if (hrefMatch) {
        current = hrefMatch[1];
        continue;
      }
    }

    break;
  }
  return current;
}

interface ParsedLocation {
  latitude: number;
  longitude: number;
  placeName?: string;
  googleMapsUrl: string;
}

/**
 * Parse the resolved Google Maps URL to extract coordinates and place name.
 *
 * Common URL patterns:
 *   /maps/place/Place+Name/@LAT,LNG,ZOOMz/...
 *   /maps/@LAT,LNG,ZOOMz/...
 *   /maps?q=LAT,LNG
 *   /maps/search/QUERY/@LAT,LNG,...
 */
function parseGoogleMapsUrl(url: string): ParsedLocation | null {
  try {
    const parsed = new URL(url);
    const fullUrl = parsed.href;

    // Try to extract coordinates from /@LAT,LNG pattern
    const atMatch = fullUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);

    // Try to extract from ?q=LAT,LNG pattern
    const qParam = parsed.searchParams.get("q");
    const qMatch = qParam?.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);

    // Try to extract from ?ll=LAT,LNG pattern
    const llParam = parsed.searchParams.get("ll");
    const llMatch = llParam?.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);

    const coordMatch = atMatch || qMatch || llMatch;
    if (!coordMatch) return null;

    const latitude = parseFloat(coordMatch[1]);
    const longitude = parseFloat(coordMatch[2]);

    if (isNaN(latitude) || isNaN(longitude)) return null;
    if (latitude < -90 || latitude > 90) return null;
    if (longitude < -180 || longitude > 180) return null;

    // Try to extract place name from /place/... segment
    let placeName: string | undefined;
    const placeMatch = fullUrl.match(/\/place\/([^/@]+)/);
    if (placeMatch) {
      placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    }

    return {
      latitude,
      longitude,
      placeName,
      googleMapsUrl: fullUrl,
    };
  } catch {
    return null;
  }
}

interface NominatimResult {
  display_name: string;
  name?: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

/**
 * Reverse-geocode coordinates via Nominatim (OpenStreetMap) to get
 * a formatted address. Free, no API key needed.
 */
async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<{ address: string; name?: string } | null> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: "json",
      addressdetails: "1",
      "accept-language": "pt",
    });

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
      {
        headers: {
          "User-Agent": "InvitationSystem/1.0 (contact@example.com)",
        },
      },
    );

    if (!res.ok) return null;

    const data: NominatimResult = await res.json();

    // Build a clean address from the structured parts
    const a = data.address;
    const parts: string[] = [];

    if (a.road) {
      parts.push(a.house_number ? `${a.road}, ${a.house_number}` : a.road);
    }
    if (a.suburb) parts.push(a.suburb);
    const city = a.city || a.town || a.village || a.municipality;
    if (city) parts.push(city);
    if (a.state) parts.push(a.state);
    if (a.postcode) parts.push(a.postcode);
    if (a.country) parts.push(a.country);

    const address = parts.length > 0 ? parts.join(", ") : data.display_name;

    return { address, name: data.name || undefined };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "O campo 'url' é obrigatório." },
        { status: 400 },
      );
    }

    const trimmedUrl = url.trim();

    if (!isGoogleMapsUrl(trimmedUrl)) {
      return NextResponse.json(
        {
          error:
            "O link fornecido não é um URL válido do Google Maps. Use um link como: https://maps.app.goo.gl/... ou https://google.com/maps/...",
        },
        { status: 400 },
      );
    }

    // 1. Resolve the short URL to the full Google Maps URL
    const resolvedUrl = await resolveRedirects(trimmedUrl);

    // 2. Parse coordinates and place name from the resolved URL
    const parsed = parseGoogleMapsUrl(resolvedUrl);

    if (!parsed) {
      return NextResponse.json(
        {
          error:
            "Não foi possível extrair coordenadas do link. Verifique se o link é válido e aponta para um local específico.",
        },
        { status: 422 },
      );
    }

    // 3. Reverse-geocode to get the address
    const geo = await reverseGeocode(parsed.latitude, parsed.longitude);

    // 4. Build the response
    const wazeUrl = `https://waze.com/ul?ll=${parsed.latitude},${parsed.longitude}&navigate=yes`;

    const result = {
      name: parsed.placeName || geo?.name || "",
      address: geo?.address || "",
      googleMapsUrl: parsed.googleMapsUrl,
      wazeUrl,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[resolve-location] Error:", error);
    return NextResponse.json(
      {
        error:
          "Ocorreu um erro ao processar o link. Tente novamente mais tarde.",
      },
      { status: 500 },
    );
  }
}
