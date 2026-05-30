/**
 * Compression helpers for the Canva reverse proxy.
 *
 * Canva publishes its HTML documents with `Content-Encoding: br` (Brotli)
 * over the wire. The proxy fetches them, decompresses transparently (via
 * undici's automatic content decoding inside `fetch`), rewrites the
 * `<base href>` so subresources continue to resolve through the proxy,
 * and then needs to re-emit a compressed response to the browser. The
 * upstream `Content-Encoding` header is stripped (see the route handler)
 * because the body has already been decoded; this module is what puts
 * compression back on the wire.
 *
 * Why this matters: a representative Canva HTML document is ~3 MB of
 * inline serialized state and compresses to ~90 KB with Brotli (q=4) in
 * under 10 ms on a modern Node runtime. Without re-compression, every
 * iframe load downloads the full 3 MB — which on a typical mobile
 * connection translates directly into a 2-5 second blank screen.
 */

import {
  brotliCompress as brotliCompressCb,
  constants as zlibConstants,
  createBrotliCompress,
  createGzip,
  gzip as gzipCb,
} from "node:zlib";
import { promisify } from "node:util";
import type { Transform } from "node:stream";

/**
 * Encodings supported by this module (and by every browser the project
 * targets). The order here is also the order of preference when a client
 * advertises multiple encodings.
 */
export type SupportedEncoding = "br" | "gzip";

const PREFERENCE_ORDER: ReadonlyArray<SupportedEncoding> = ["br", "gzip"];

const brotliCompressAsync = promisify(brotliCompressCb);
const gzipAsync = promisify(gzipCb);

/**
 * Brotli quality 4 is the sweet spot for transient HTML compression:
 * ~5 ms to compress 3 MB of repetitive HTML on Node 22, with a
 * compression ratio nearly identical to the default quality 11 for this
 * kind of payload. Quality 11 takes ~300 ms — too slow for a per-request
 * proxy. Quality 1 is twice as fast but ~60% larger output.
 */
const BROTLI_PARAMS = {
  [zlibConstants.BROTLI_PARAM_QUALITY]: 4,
} as const;

/** Gzip level 6 is the canonical "balanced" setting (~9× reduction). */
const GZIP_LEVEL = 6;

/**
 * Parses a single `Accept-Encoding` token like `"br;q=0.5"` into its
 * encoding name (lowercased) and effective q-value. Missing q defaults
 * to 1 per RFC 9110. Malformed q-values are treated as 0 (rejected) to
 * fail closed.
 */
function parseToken(token: string): { name: string; q: number } {
  const [rawName, ...params] = token.split(";").map((s) => s.trim());
  const name = rawName.toLowerCase();
  let q = 1;
  for (const param of params) {
    const m = /^q\s*=\s*([0-9]*\.?[0-9]+)$/i.exec(param);
    if (m) {
      const parsed = Number(m[1]);
      q = Number.isFinite(parsed) ? parsed : 0;
    }
  }
  return { name, q };
}

/**
 * Picks the best supported `Content-Encoding` for the given
 * `Accept-Encoding` request header. Returns `null` to mean "send the
 * response uncompressed".
 *
 * Honoured rules from RFC 9110:
 *   - q=0 explicitly disqualifies an encoding (or, with `*;q=0`, anything
 *     not explicitly listed).
 *   - `*` matches any encoding the server supports — we treat it as
 *     "accept all" (best supported wins).
 *   - Comparisons are case-insensitive.
 */
export function pickCompressionEncoding(
  acceptEncoding: string | null | undefined,
): SupportedEncoding | null {
  if (!acceptEncoding) return null;

  const tokens = acceptEncoding
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map(parseToken);

  // Build a per-encoding effective q. If the same encoding appears more
  // than once we keep the first occurrence (browsers never do this, but
  // be defensive).
  const explicit = new Map<string, number>();
  let wildcard: number | null = null;
  for (const { name, q } of tokens) {
    if (name === "*") {
      if (wildcard === null) wildcard = q;
      continue;
    }
    if (!explicit.has(name)) explicit.set(name, q);
  }

  function effectiveQ(encoding: SupportedEncoding): number {
    if (explicit.has(encoding)) return explicit.get(encoding)!;
    if (wildcard !== null) return wildcard;
    return 0;
  }

  let best: { enc: SupportedEncoding; q: number } | null = null;
  for (const enc of PREFERENCE_ORDER) {
    const q = effectiveQ(enc);
    if (q <= 0) continue;
    if (!best || q > best.q) {
      best = { enc, q };
    }
  }
  return best ? best.enc : null;
}

/**
 * Compresses a string or Buffer using the requested encoding.
 *
 * Used for HTML responses, which the proxy buffers anyway (in order to
 * rewrite the `<base>` tag). The output is always a `Buffer` so callers
 * can set `content-length` deterministically or hand it off to
 * `new NextResponse(body, ...)` without re-encoding.
 */
export async function compressBuffer(
  input: string | Buffer,
  encoding: SupportedEncoding,
): Promise<Buffer> {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  if (encoding === "br") {
    return brotliCompressAsync(buf, { params: BROTLI_PARAMS });
  }
  if (encoding === "gzip") {
    return gzipAsync(buf, { level: GZIP_LEVEL });
  }
  // Exhaustiveness check — `encoding` is a literal union, so this is
  // unreachable in well-typed code, but we throw to surface bugs from
  // any caller that bypassed the type system (e.g. JS, dynamic input).
  const unknown: never = encoding;
  throw new Error(`Unsupported compression encoding: ${String(unknown)}`);
}

/**
 * Creates a Node `Transform` stream for the given encoding. Used to
 * pipe non-HTML proxied bodies (scripts, stylesheets) through
 * compression without buffering the full payload server-side.
 *
 * Brotli's streaming path uses the same quality knob as the buffered
 * helper above. Gzip uses Node's default streaming gzip with the same
 * compression level.
 */
export function createCompressionTransform(
  encoding: SupportedEncoding,
): Transform {
  if (encoding === "br") {
    return createBrotliCompress({ params: BROTLI_PARAMS });
  }
  if (encoding === "gzip") {
    return createGzip({ level: GZIP_LEVEL });
  }
  const unknown: never = encoding;
  throw new Error(`Unsupported compression encoding: ${String(unknown)}`);
}

/**
 * Content types for which re-compressing through the proxy is worth it.
 *
 * Skip already-compressed binary formats (images, audio, video, woff2
 * fonts) — they will not shrink meaningfully and re-compression just
 * wastes CPU. Keep text-y types and JS/JSON, which compress 5-30×.
 */
export function isCompressibleContentType(contentType: string): boolean {
  if (!contentType) return false;
  const ct = contentType.toLowerCase().split(";")[0].trim();
  if (!ct) return false;
  if (ct.startsWith("text/")) return true;
  if (ct === "application/json") return true;
  if (ct === "application/ld+json") return true;
  if (ct === "application/xml") return true;
  if (ct === "application/javascript") return true;
  if (ct === "application/x-javascript") return true;
  if (ct === "application/manifest+json") return true;
  if (ct === "image/svg+xml") return true;
  if (ct.endsWith("+json") || ct.endsWith("+xml")) return true;
  return false;
}
