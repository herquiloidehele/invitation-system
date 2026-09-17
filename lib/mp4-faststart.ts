/**
 * Detects whether an MP4 is laid out for streaming ("faststart"), i.e. whether
 * its `moov` atom — the index a player needs before it can decode anything —
 * sits *before* the `mdat` media payload.
 *
 * Why this matters: when `moov` trails `mdat`, a browser cannot start playback
 * from the leading bytes. Chrome reads the head, gives up, ABORTS that request,
 * issues a second range request for the tail to find `moov`, then issues a
 * third request for the body it abandoned. The same clip is therefore fetched
 * in three pieces — two extra round trips of latency before the first frame,
 * plus wasted bytes, which is worst exactly where it hurts most (mobile links).
 * A faststart file is fetched in one request.
 *
 * Pure byte inspection so it stays trivially testable: MP4 is a flat sequence
 * of top-level boxes (4-byte big-endian size, 4-char ASCII type), so finding
 * whichever of `moov` / `mdat` comes first only needs to walk their headers.
 */

/** Bytes of the file head to inspect — the boxes preceding `moov`/`mdat`
 *  (`ftyp`, `free`, `wide`, …) are tiny, so this is generous. */
export const MP4_FASTSTART_PROBE_BYTES = 64 * 1024;

/** Smallest legal top-level box: a 4-byte size plus a 4-char type. */
const BOX_HEADER_BYTES = 8;
/** `size === 1` means the real size follows as a 64-bit value. */
const LARGE_SIZE_HEADER_BYTES = 16;

function boxType(head: Uint8Array, offset: number): string {
  return String.fromCharCode(
    head[offset + 4],
    head[offset + 5],
    head[offset + 6],
    head[offset + 7],
  );
}

/**
 * True when `moov` is reached before `mdat` within `head` (the start of an MP4
 * file). Anything undecidable — a truncated head, a malformed box size, a file
 * whose layout can't be established inside the probe window — reports `false`,
 * so callers normalise rather than ship a clip that might stream badly.
 */
export function isFaststartMp4(head: Uint8Array): boolean {
  const view = new DataView(head.buffer, head.byteOffset, head.byteLength);
  let offset = 0;

  while (offset + BOX_HEADER_BYTES <= head.byteLength) {
    const type = boxType(head, offset);
    if (type === "moov") return true;
    if (type === "mdat") return false;

    let size = view.getUint32(offset);
    let headerSize = BOX_HEADER_BYTES;
    if (size === 1) {
      if (offset + LARGE_SIZE_HEADER_BYTES > head.byteLength) return false;
      // JS numbers hold 2^53 exactly, far beyond any real box.
      size =
        view.getUint32(offset + 8) * 2 ** 32 + view.getUint32(offset + 12);
      headerSize = LARGE_SIZE_HEADER_BYTES;
    } else if (size === 0) {
      // Box runs to end-of-file, so nothing follows it — and it isn't `moov`.
      return false;
    }
    // A size that can't even cover its own header is malformed; bail out rather
    // than risk looping on a zero/negative step.
    if (size < headerSize) return false;

    offset += size;
  }

  return false;
}
