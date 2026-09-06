/**
 * Decode a `data:image/png;base64,...` URL into raw bytes, or null when it is
 * not a base64 PNG data URL or carries no payload. The console sends the crop
 * as a PNG data URL; the API route writes the bytes to a temp file rather than
 * passing them on the worker's argv (which has a per-argument size limit).
 */
export function decodePngDataUrl(dataUrl: string): Buffer | null {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
  if (!m) return null;
  try {
    const buf = Buffer.from(m[1], "base64");
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
}
