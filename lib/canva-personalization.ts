/**
 * Per-guest personalization of a proxied Canva invitation document.
 *
 * Pure + isomorphic (runs in the browser when encoding the `pz` param, and in
 * the Node proxy route when decoding + applying). No React/Next/Prisma.
 *
 * Canva "export_website" HTML stores visible text and link URLs as contiguous
 * strings in a pre-hydration JSON state blob, so designer-placed tokens and a
 * `/confirmar/` link can be string-replaced before the document is served.
 */

export interface CanvaPersonalization {
  name: string;
  companion: string;
  tableLabel: string;
  totalGuests: string;
  token: string;
  nameSlug: string;
}

/** Fallback rendered for {{nome}} when there is no guest (generic/preview). */
const NAME_FALLBACK = "Convidado(a)";

/** Upper bound on the encoded payload length (defensive — public route). */
const MAX_PZ_LENGTH = 4096;

// --- base64url (isomorphic) ------------------------------------------------

function toBase64Url(input: string): string {
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(unescape(encodeURIComponent(input)))
      : Buffer.from(input, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof atob !== "undefined") {
    return decodeURIComponent(escape(atob(b64)));
  }
  return Buffer.from(b64, "base64").toString("utf8");
}

// --- encode / decode -------------------------------------------------------

export function encodeCanvaPersonalization(p: CanvaPersonalization): string {
  const arr = [
    p.name,
    p.companion,
    p.tableLabel,
    p.totalGuests,
    p.token,
    p.nameSlug,
  ];
  return toBase64Url(JSON.stringify(arr));
}

export function decodeCanvaPersonalization(
  pz: string | null | undefined,
): CanvaPersonalization | null {
  if (!pz || pz.length > MAX_PZ_LENGTH) return null;
  try {
    const arr = JSON.parse(fromBase64Url(pz));
    if (!Array.isArray(arr) || arr.length !== 6) return null;
    const [name, companion, tableLabel, totalGuests, token, nameSlug] = arr;
    if (typeof name !== "string" || typeof token !== "string") return null;
    return {
      name,
      companion: String(companion ?? ""),
      tableLabel: String(tableLabel ?? ""),
      totalGuests: String(totalGuests ?? ""),
      token,
      nameSlug: String(nameSlug ?? ""),
    };
  } catch {
    return null;
  }
}

// --- apply -----------------------------------------------------------------

/**
 * Escapes a value for safe injection inside a JSON string in an inline
 * document context: JSON-string-escape, then neutralize angle brackets so a
 * value can never break out of an inline `<script>`/state context.
 */
function escapeForCanvaState(value: string): string {
  return JSON.stringify(value)
    .slice(1, -1)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");
}

const CANVA_RETAIN_RE = /\{"A\?":"B","A":(\d+)\}/g;
const CANVA_TOTAL_RE = /"b":\{"A":\[(\d+)/g;

/**
 * Bumps the first `{"A?":"B","A":N}` retain at/after `fromIdx`, then the first
 * `"b":{"A":[total]}` after it, by `delta`. No-op when `delta` is 0 or the
 * structure isn't present (plain-text contexts). Synchronous, so the shared
 * `lastIndex` on the module-level regexes is safe.
 */
function patchCanvaLengthsAfterToken(
  str: string,
  fromIdx: number,
  delta: number,
): string {
  if (delta === 0) return str;

  CANVA_RETAIN_RE.lastIndex = fromIdx;
  const retainMatch = CANVA_RETAIN_RE.exec(str);
  if (!retainMatch) return str;
  const newRetain = Math.max(0, parseInt(retainMatch[1], 10) + delta);
  str =
    str.slice(0, retainMatch.index) +
    `{"A?":"B","A":${newRetain}}` +
    str.slice(retainMatch.index + retainMatch[0].length);

  CANVA_TOTAL_RE.lastIndex = retainMatch.index;
  const totalMatch = CANVA_TOTAL_RE.exec(str);
  if (totalMatch) {
    const newTotal = Math.max(0, parseInt(totalMatch[1], 10) + delta);
    str =
      str.slice(0, totalMatch.index) +
      `"b":{"A":[${newTotal}` +
      str.slice(totalMatch.index + totalMatch[0].length);
  }
  return str;
}

/**
 * Replaces a token with its value inside Canva's run-length-encoded attributed
 * text. Canva keeps the visible text in an `"A"` run but its per-character
 * styling lives in a sibling `"B"` array as alternating {set-style} and
 * {"A?":"B","A":N} "retain N chars" ops, with the element length in
 * `"b":{"A":[total]}`. A plain replace changes the text length without updating
 * those counts, so a value longer than the token spills past its styled retain
 * and renders in the default font/size (and breaks the line's positioning).
 *
 * For each occurrence we replace the text AND bump the covering retain + the
 * element total by the char-length delta. If the surrounding RLE structure
 * isn't found, we degrade to a plain replace.
 */
function replaceCanvaTextToken(
  html: string,
  token: string,
  rawValue: string,
): string {
  const escaped = escapeForCanvaState(rawValue);
  // Canva counts characters, not JSON-escaped bytes — use the raw value's
  // length for the delta but inject the escaped form as text.
  const delta = rawValue.length - token.length;
  let result = html;
  let from = 0;
  for (;;) {
    const i = result.indexOf(token, from);
    if (i === -1) break;
    result = patchCanvaLengthsAfterToken(result, i + token.length, delta);
    result = result.slice(0, i) + escaped + result.slice(i + token.length);
    from = i + escaped.length;
  }
  return result;
}

/**
 * Matches a URL or path containing `/confirmar/`, bounded by characters that
 * never appear inside a URL in the Canva state JSON (quotes, whitespace,
 * backslash, angle/paren/brace brackets). The match includes any existing
 * query/fragment so we can splice params in correctly.
 */
const CONFIRM_URL_RE =
  /(?:https?:\/\/[^\s"'\\<>(){}]*\/confirmar\/[^\s"'\\<>(){}]*|\/[^\s"'\\<>(){}]*\/confirmar\/[^\s"'\\<>(){}]*|\/confirmar\/[^\s"'\\<>(){}]*)/g;

function appendGuestParamsToConfirmLinks(
  html: string,
  token: string,
  nameSlug: string,
): string {
  const extra = `g=${encodeURIComponent(token)}&n=${encodeURIComponent(nameSlug)}`;
  return html.replace(CONFIRM_URL_RE, (urlStr) => {
    const hashIdx = urlStr.indexOf("#");
    const hash = hashIdx === -1 ? "" : urlStr.slice(hashIdx);
    const beforeHash = hashIdx === -1 ? urlStr : urlStr.slice(0, hashIdx);
    const sep = beforeHash.includes("?") ? "&" : "?";
    return `${beforeHash}${sep}${extra}${hash}`;
  });
}

/**
 * Replaces the four text tokens (with fallbacks when `p` is null) and, when a
 * guest is present, appends `g`/`n` to `/confirmar/` links.
 */
export function applyCanvaPersonalization(
  html: string,
  p: CanvaPersonalization | null,
): string {
  const values: Record<string, string> = p
    ? {
        "{{nome}}": p.name,
        "{{acompanhante}}": p.companion,
        "{{mesa}}": p.tableLabel,
        "{{num_total}}": p.totalGuests,
      }
    : {
        "{{nome}}": NAME_FALLBACK,
        "{{acompanhante}}": "",
        "{{mesa}}": "",
        "{{num_total}}": "",
      };

  let out = html;
  for (const [token, raw] of Object.entries(values)) {
    out = replaceCanvaTextToken(out, token, raw);
  }
  if (p && p.token) {
    out = appendGuestParamsToConfirmLinks(out, p.token, p.nameSlug);
  }
  return out;
}
