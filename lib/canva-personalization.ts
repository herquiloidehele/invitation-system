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
 * The character sequence that closes an element's text array and opens its
 * length-metadata `"B"` array. A bare `"` can only appear here as JSON
 * structure (any `"` inside text is escaped as `\"`), so this is a reliable
 * anchor for finding the length field that belongs to the token's own element.
 */
const LEN_FIELD_MARKER = '],"B":[';

function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && ch >= "0" && ch <= "9";
}

/**
 * Canva counts an escape sequence (`\n`, `\t`, `\"`, …) as a single character,
 * so measure a decoded text string by collapsing each escape to one char.
 */
function canvaCharLength(decoded: string): number {
  return decoded.replace(/\\./g, "X").length;
}

/**
 * Returns the index just past the `{`/`[` that matches the opener at `openIdx`,
 * skipping over string contents (where brackets/braces may appear literally).
 */
function matchBracket(str: string, openIdx: number): number | null {
  const opener = str[openIdx];
  if (opener !== "{" && opener !== "[") return null;
  let depth = 0;
  let inString = false;
  for (let j = openIdx; j < str.length; j++) {
    const c = str[j];
    if (inString) {
      if (c === "\\") j++;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      depth--;
      if (depth === 0) return j + 1;
    }
  }
  return null;
}

/**
 * The token's character offset within its text element, or null if it can't be
 * resolved. `aOpen` points at the element's `"A":[` key and `aClose` at the `]`
 * that ends the text array (i.e. the `]` of `],"B":[`).
 */
function tokenOffsetInElement(
  str: string,
  aOpen: number,
  aClose: number,
  token: string,
): number | null {
  try {
    const arr: unknown = JSON.parse(str.slice(aOpen + '"A":'.length, aClose + 1));
    if (!Array.isArray(arr)) return null;
    let offset = 0;
    for (const piece of arr) {
      if (typeof piece !== "string") return null;
      const idx = piece.indexOf(token);
      if (idx !== -1) return offset + canvaCharLength(piece.slice(0, idx));
      offset += canvaCharLength(piece);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Given a `"D":[lead, ...runLengths]` array (`nums`) and a character `offset`,
 * returns the index in `nums` of the run that covers `offset`, or -1 when there
 * are no runs. `nums[0]` is a leading style marker, not a length.
 */
function coveringRunIndex(nums: number[], offset: number): number {
  if (nums.length < 2) return -1;
  let cum = 0;
  for (let k = 1; k < nums.length; k++) {
    if (offset < cum + nums[k]) return k;
    cum += nums[k];
  }
  return nums.length - 1;
}

/**
 * Bumps the length metadata of the text element that contains a token by
 * `delta`, never reaching across into an unrelated element.
 *
 * Canva "export_website" HTML serializes each text element as JSON:
 *
 *   `{"A":[text…],"B":[total],"C":[styles…],"D":[lead,…runLengths],"E":…}`
 *
 * `"B"` is the element's character count and `"D"` maps character ranges to the
 * styles in `"C"` via consecutive run lengths. A value that differs in length
 * from its token must update BOTH the total AND the single run that covers the
 * token — otherwise the extra/missing characters fall outside the styled run
 * and render in the default font with broken positioning.
 *
 * An older shape uses an attributed run list instead
 * (`"A":[{"A?":"A","A":"text"}],"B":[…,{"A?":"B","A":retain},…],"b":{"A":[total]}`);
 * we dispatch on what the `],"B":[` marker opens (a digit → JSON element, a `{`
 * → attributed). Anything else is left untouched (plain replace).
 */
function patchCanvaLengthsAfterToken(
  str: string,
  token: string,
  tokenStart: number,
  tokenEnd: number,
  delta: number,
): string {
  if (delta === 0) return str;

  const marker = str.indexOf(LEN_FIELD_MARKER, tokenEnd);
  if (marker === -1) return str;
  const bStart = marker + LEN_FIELD_MARKER.length;
  const charBeforeClose = str[marker - 1];
  const firstBChar = str[bStart];

  // Attributed: `"A":[{…}],"B":[{…}]` — closes on an object, `"B"` holds ops.
  if (charBeforeClose === "}" && firstBChar === "{") {
    return patchCanvaAttributedLengths(str, tokenEnd, delta);
  }

  // JSON element: `"A":["…"],"B":[N],…,"D":[lead,…runs]` — closes on a string
  // and `"B"` holds a single count. Bump the total AND the covering run in "D".
  if (charBeforeClose !== '"' || !isDigit(firstBChar)) return str;

  let bEnd = bStart;
  while (isDigit(str[bEnd])) bEnd++;
  const newTotal = Math.max(0, parseInt(str.slice(bStart, bEnd), 10) + delta);

  let out = str;
  // Patch "D" first (it sits after "B", so its indices stay valid while we then
  // patch "B" which is earlier in the string). Scope everything to this element.
  const aOpen = str.lastIndexOf('"A":[', marker);
  const objStart = aOpen === -1 ? -1 : str.lastIndexOf("{", aOpen);
  const objEnd = objStart === -1 ? null : matchBracket(str, objStart);
  if (aOpen !== -1 && objEnd !== null) {
    // Styles store `"D"` as a scalar, so `"D":[` is unique to the element.
    const dKey = str.indexOf('"D":[', bEnd);
    if (dKey !== -1 && dKey < objEnd) {
      const dArrOpen = dKey + '"D":'.length;
      const dArrEnd = matchBracket(str, dArrOpen);
      if (dArrEnd !== null && dArrEnd <= objEnd) {
        const offset = tokenOffsetInElement(str, aOpen, marker, token);
        if (offset !== null) {
          const nums = str
            .slice(dArrOpen + 1, dArrEnd - 1)
            .split(",")
            .map((n) => parseInt(n, 10));
          const runIdx = coveringRunIndex(nums, offset);
          if (runIdx !== -1 && nums.every((n) => Number.isFinite(n))) {
            nums[runIdx] = Math.max(0, nums[runIdx] + delta);
            out =
              str.slice(0, dArrOpen) +
              `[${nums.join(",")}]` +
              str.slice(dArrEnd);
          }
        }
      }
    }
  }

  return out.slice(0, bStart) + String(newTotal) + out.slice(bEnd);
}

/**
 * Bumps the first `{"A?":"B","A":N}` retain at/after `fromIdx`, then the first
 * `"b":{"A":[total]}` after it, by `delta`. Synchronous, so the shared
 * `lastIndex` on the module-level regexes is safe.
 */
function patchCanvaAttributedLengths(
  str: string,
  fromIdx: number,
  delta: number,
): string {
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
 * Replaces a token with its value inside Canva's serialized text state. Canva
 * keeps the visible text in an `"A"` array, the element's character count in
 * `"B"`, its style palette in `"C"`, and per-run character lengths in `"D"`. A
 * plain replace changes the text length without updating those counts, so the
 * value spills past its styled run and renders in the default font/size (and
 * breaks the line's positioning) — or, if the total no longer matches, Canva
 * rejects the whole state as `invalid state`.
 *
 * For each occurrence we bump the element total and the covering run by the
 * char-length delta (both sit after the token, so they're patched before the
 * text is spliced in), then replace the text. If the surrounding structure
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
    result = patchCanvaLengthsAfterToken(
      result,
      token,
      i,
      i + token.length,
      delta,
    );
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
