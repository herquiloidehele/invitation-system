/**
 * Cache policy for everything we store in S3.
 *
 * Why: S3 sends no `Cache-Control` of its own. Without one a browser falls back
 * to heuristic freshness (a fraction of the object's age), so guest media gets
 * revalidated — or refetched outright — far more often than it needs to be, on
 * every repeat visit and on the second element that wants the same file.
 *
 * `immutable` is safe here because every key we write is unique to its content:
 * uploads are `uploads/{folder}/{timestamp}-{name}`, AI bundles are keyed by
 * revision id, critique screenshots carry a per-run stamp. We never rewrite a
 * key in normal operation — the one exception is the deliberate maintenance
 * sweep in `scripts/backfill-video-faststart.ts`, which notes the consequence.
 *
 * Kept free of `@aws-sdk` and `node:` imports so client components can share the
 * same constant as the server rather than restating it.
 */

/** One year, and never revalidate — see the note on unique keys above. */
export const MEDIA_CACHE_CONTROL = "public, max-age=31536000, immutable";

/**
 * Request headers for a browser-side PUT to a presigned upload URL.
 *
 * `Cache-Control` has to be sent by the uploading client: the AWS presigner
 * silently drops a `CacheControl` set on the signed `PutObjectCommand` (it is
 * neither signed nor hoisted into the query string), so the only way the header
 * reaches the stored object is on the PUT itself. It is *not* a signed header,
 * so adding it cannot invalidate the signature.
 */
export function mediaUploadHeaders(
  contentType: string,
): Record<string, string> {
  return {
    "Content-Type": contentType,
    "Cache-Control": MEDIA_CACHE_CONTROL,
  };
}
