// The single seam for IP→country resolution. Swap the provider here (Cloudflare
// cf-ipcountry, MaxMind, …) without touching callers. Edge-runtime safe.

const GEO_TIMEOUT_MS = 600;

/** First hop of an `x-forwarded-for` header, or null. */
export function clientIpFromForwardedFor(xff: string | null | undefined): string | null {
  if (!xff) return null;
  const first = xff.split(",")[0]?.trim();
  return first && first.length > 0 ? first : null;
}

/** Resolve an ISO 3166-1 alpha-2 country for an IP, or null on any failure. */
export async function lookupCountry(ip: string | null): Promise<string | null> {
  if (!ip) return null;

  const base = process.env.GEOIP_API_URL ?? "https://ipapi.co";
  const token = process.env.GEOIP_API_TOKEN;
  const url = `${base}/${encodeURIComponent(ip)}/country/${token ? `?key=${token}` : ""}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "brindeal-currency/1.0" },
    });
    if (!res.ok) return null;
    const code = (await res.text()).trim().toUpperCase();
    return /^[A-Z]{2}$/.test(code) ? code : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
