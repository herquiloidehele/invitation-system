/**
 * Stock photo search across Pexels, Unsplash and Pixabay.
 *
 * The normalizers are pure and cover the whole shape mismatch between the three
 * APIs; everything that touches the network sits in thin wrappers around them.
 * The AI builder reaches this module through the in-process MCP tools in
 * `worker/lib/stock-tools.ts` — the API keys never leave the worker process.
 */

export type StockProvider = "pexels" | "unsplash" | "pixabay";

export interface StockImage {
  provider: StockProvider;
  /** Provider-native id, stringified. Unique only within a provider. */
  id: string;
  /** What the photo shows, for picking without looking. */
  description: string;
  width: number;
  height: number;
  /** A small preview, downloaded into the workspace so the agent can look. */
  thumbUrl: string;
  /** The version mirrored to S3 when the agent commits to an image. */
  fullUrl: string;
  /** Photographer + provider, recorded as a comment in the generated source. */
  credit: string;
  /** The photo's page on the provider, for a human to check the licence. */
  pageUrl: string;
  /** Unsplash only: the endpoint its API guidelines require pinging on use. */
  downloadLocation?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Pexels: `GET /v1/search` → `{ photos: [{ src: {...} }] }`. */
export function normalizePexels(json: unknown): StockImage[] {
  const photos = asArray(asRecord(json)?.photos);
  const out: StockImage[] = [];
  for (const entry of photos) {
    const photo = asRecord(entry);
    if (!photo) continue;
    const src = asRecord(photo.src) ?? {};
    const fullUrl = str(src.large2x) || str(src.large) || str(src.original);
    const thumbUrl = str(src.medium) || str(src.small) || str(src.tiny) || fullUrl;
    if (!fullUrl) continue;
    const photographer = str(photo.photographer) || "Unknown";
    const pageUrl = str(photo.url);
    out.push({
      provider: "pexels",
      id: String(photo.id ?? ""),
      description: str(photo.alt) || `Photo by ${photographer}`,
      width: num(photo.width),
      height: num(photo.height),
      thumbUrl,
      fullUrl,
      credit: `Photo by ${photographer} on Pexels (${pageUrl})`,
      pageUrl,
    });
  }
  return out;
}

/** Unsplash: `GET /search/photos` → `{ results: [{ urls: {...} }] }`. */
export function normalizeUnsplash(json: unknown): StockImage[] {
  const results = asArray(asRecord(json)?.results);
  const out: StockImage[] = [];
  for (const entry of results) {
    const photo = asRecord(entry);
    if (!photo) continue;
    const urls = asRecord(photo.urls) ?? {};
    const links = asRecord(photo.links) ?? {};
    const user = asRecord(photo.user) ?? {};
    // `raw` and `full` are multi-megabyte originals; `regular` is 1080px wide,
    // which already exceeds what a phone-sized invitation ever displays.
    const fullUrl = str(urls.regular) || str(urls.full) || str(urls.raw);
    const thumbUrl = str(urls.small) || str(urls.thumb) || fullUrl;
    if (!fullUrl) continue;
    const photographer = str(user.name) || "Unknown";
    const pageUrl = str(links.html);
    out.push({
      provider: "unsplash",
      id: str(photo.id),
      description:
        str(photo.description) ||
        str(photo.alt_description) ||
        `Photo by ${photographer}`,
      width: num(photo.width),
      height: num(photo.height),
      thumbUrl,
      fullUrl,
      credit: `Photo by ${photographer} on Unsplash (${pageUrl})`,
      pageUrl,
      downloadLocation: str(links.download_location) || undefined,
    });
  }
  return out;
}

/** Pixabay: `GET /api/` → `{ hits: [{ largeImageURL, tags, ... }] }`. */
export function normalizePixabay(json: unknown): StockImage[] {
  const hits = asArray(asRecord(json)?.hits);
  const out: StockImage[] = [];
  for (const entry of hits) {
    const hit = asRecord(entry);
    if (!hit) continue;
    const fullUrl = str(hit.largeImageURL) || str(hit.webformatURL);
    const thumbUrl = str(hit.webformatURL) || str(hit.previewURL) || fullUrl;
    if (!fullUrl) continue;
    const uploader = str(hit.user) || "Unknown";
    const pageUrl = str(hit.pageURL);
    out.push({
      provider: "pixabay",
      id: String(hit.id ?? ""),
      description: str(hit.tags) || `Photo by ${uploader}`,
      width: num(hit.imageWidth),
      height: num(hit.imageHeight),
      thumbUrl,
      fullUrl,
      credit: `Photo by ${uploader} on Pixabay (${pageUrl})`,
      pageUrl,
    });
  }
  return out;
}

/**
 * Merge per-provider result lists round-robin, so a provider that returns
 * plenty cannot crowd the others out of the candidate list the agent sees.
 */
export function interleaveByProvider(
  lists: StockImage[][],
  limit: number,
): StockImage[] {
  const out: StockImage[] = [];
  const seen = new Set<string>();
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest && out.length < limit; i += 1) {
    for (const list of lists) {
      if (out.length >= limit) break;
      const image = list[i];
      if (!image) continue;
      const key = `${image.provider}:${image.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(image);
    }
  }
  return out;
}

export type StockOrientation = "landscape" | "portrait" | "square";

/** The env var each provider's key lives in. */
const KEY_ENV: Record<StockProvider, string> = {
  pexels: "PEXELS_API_KEY",
  unsplash: "UNSPLASH_ACCESS_KEY",
  pixabay: "PIXABAY_API_KEY",
};

const PROVIDERS: StockProvider[] = ["pexels", "unsplash", "pixabay"];

/**
 * The providers that can actually be queried. A missing key is a configuration
 * state, not an error: search degrades to whoever is configured, so a local
 * environment with one key still works.
 */
export function configuredProviders(
  env: Record<string, string | undefined>,
): StockProvider[] {
  return PROVIDERS.filter((p) => (env[KEY_ENV[p]] ?? "").trim().length > 0);
}

export interface ProviderRequest {
  url: string;
  headers: Record<string, string>;
}

/** Build one provider's search request. Pure, so the auth and orientation
 * dialects are testable without touching the network. */
export function providerRequest(
  provider: StockProvider,
  args: {
    query: string;
    limit: number;
    key: string;
    orientation?: StockOrientation;
  },
): ProviderRequest {
  const { query, limit, key, orientation } = args;
  if (provider === "pexels") {
    const params = new URLSearchParams({
      query,
      per_page: String(limit),
    });
    // Pexels speaks landscape/portrait/square — the same words this module uses.
    if (orientation) params.set("orientation", orientation);
    return {
      url: `https://api.pexels.com/v1/search?${params}`,
      headers: { Authorization: key },
    };
  }
  if (provider === "unsplash") {
    const params = new URLSearchParams({
      query,
      per_page: String(limit),
      content_filter: "high",
    });
    if (orientation) {
      params.set(
        "orientation",
        orientation === "square" ? "squarish" : orientation,
      );
    }
    return {
      url: `https://api.unsplash.com/search/photos?${params}`,
      headers: { Authorization: `Client-ID ${key}` },
    };
  }
  const params = new URLSearchParams({
    key,
    q: query,
    image_type: "photo",
    safesearch: "true",
    // Pixabay rejects a per_page below 3.
    per_page: String(Math.max(3, limit)),
  });
  // Pixabay has only horizontal/vertical; a square request stays unfiltered.
  if (orientation === "landscape") params.set("orientation", "horizontal");
  if (orientation === "portrait") params.set("orientation", "vertical");
  return { url: `https://pixabay.com/api/?${params}`, headers: {} };
}

const NORMALIZERS: Record<StockProvider, (json: unknown) => StockImage[]> = {
  pexels: normalizePexels,
  unsplash: normalizeUnsplash,
  pixabay: normalizePixabay,
};

export interface ProviderStatus {
  provider: StockProvider;
  status: "ok" | "error";
  note?: string;
}

export interface StockSearchResult {
  images: StockImage[];
  providers: ProviderStatus[];
}

/**
 * Search every configured provider in parallel and merge the results.
 *
 * One provider failing never fails the search — the agent gets whatever came
 * back plus a per-provider status line, which is far more useful mid-build than
 * an exception.
 */
export async function searchStockImages(args: {
  query: string;
  orientation?: StockOrientation;
  /** Total images returned across providers. */
  limit?: number;
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<StockSearchResult> {
  const env = args.env ?? process.env;
  const limit = args.limit ?? 12;
  const doFetch = args.fetchImpl ?? fetch;
  const timeoutMs = args.timeoutMs ?? 8000;
  const providers = configuredProviders(env);
  if (providers.length === 0) return { images: [], providers: [] };

  // Over-fetch per provider so the round-robin merge has something to pick from
  // even when one provider returns little.
  const perProvider = Math.max(3, Math.ceil(limit / providers.length) + 2);

  const settled = await Promise.all(
    providers.map(async (provider): Promise<[ProviderStatus, StockImage[]]> => {
      const req = providerRequest(provider, {
        query: args.query,
        limit: perProvider,
        key: (env[KEY_ENV[provider]] ?? "").trim(),
        orientation: args.orientation,
      });
      try {
        const response = await doFetch(req.url, {
          headers: req.headers,
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!response.ok) {
          return [
            { provider, status: "error", note: `HTTP ${response.status}` },
            [],
          ];
        }
        const images = NORMALIZERS[provider](await response.json());
        return [{ provider, status: "ok" }, images];
      } catch (err) {
        const note = err instanceof Error ? err.message : String(err);
        return [{ provider, status: "error", note }, []];
      }
    }),
  );

  return {
    images: interleaveByProvider(
      settled.map(([, images]) => images),
      limit,
    ),
    providers: settled.map(([status]) => status),
  };
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** File extension for a downloaded image, defaulting to jpg. */
export function extensionForContentType(contentType: string): string {
  return EXTENSIONS[contentType.split(";")[0].trim().toLowerCase()] ?? "jpg";
}

/** Only characters that are safe in an S3 key and in a URL path segment. */
function slug(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "");
}

/**
 * Where a mirrored image lives in the bucket. Deterministic, so re-picking the
 * same photo overwrites rather than accumulating copies. Nothing indexes these
 * objects — the generated source holds the only reference.
 */
export function stockObjectKey(
  invitationId: string,
  image: Pick<StockImage, "provider" | "id">,
  contentType: string,
): string {
  const ext = extensionForContentType(contentType);
  return `ai-stock/${slug(invitationId)}/${image.provider}-${slug(image.id)}.${ext}`;
}

/** 20 MB — comfortably above a 1280px JPEG, far below anything worth mirroring. */
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

/** Download one image, refusing anything oversized or not actually an image. */
export async function fetchImageBytes(
  url: string,
  opts: { fetchImpl?: typeof fetch; maxBytes?: number; timeoutMs?: number } = {},
): Promise<{ buffer: Buffer; contentType: string }> {
  const doFetch = opts.fetchImpl ?? fetch;
  const maxBytes = opts.maxBytes ?? MAX_IMAGE_BYTES;
  const response = await doFetch(url, {
    signal: AbortSignal.timeout(opts.timeoutMs ?? 15000),
  });
  if (!response.ok) {
    throw new Error(`Download failed with HTTP ${response.status}: ${url}`);
  }
  const header = response.headers.get("content-type") ?? "";
  const contentType = header.split(";")[0].trim().toLowerCase() || "image/jpeg";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Response is not an image (${contentType}): ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > maxBytes) {
    throw new Error(
      `Image too large (${buffer.byteLength} bytes, cap ${maxBytes}): ${url}`,
    );
  }
  return { buffer, contentType };
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Pixel dimensions of a downloaded JPEG or PNG, read straight from the header.
 *
 * These matter: what a provider reports is the size of the ORIGINAL, while what
 * gets mirrored is a resized derivative. Handing the agent the original's
 * numbers invites `<Media width={4014}>` over a 1080px file, and next/image
 * would then ask sharp to upscale it — an avoidable multi-hundred-megabyte
 * decode on a 1 GB container.
 *
 * Returns null for anything it cannot read; callers fall back to the provider's
 * numbers rather than pretending to know.
 */
export function imageDimensions(
  buffer: Buffer,
): { width: number; height: number } | null {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  // Walk the segment chain to the start-of-frame, which carries the size.
  let offset = 2;
  while (offset + 9 <= buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    // Standalone markers carry no length payload.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 && // define Huffman table
      marker !== 0xc8 && // JPEG extensions
      marker !== 0xcc; // define arithmetic coding conditioning
    if (isStartOfFrame) {
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5),
      };
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) return null;
    offset += 2 + length;
  }
  return null;
}
