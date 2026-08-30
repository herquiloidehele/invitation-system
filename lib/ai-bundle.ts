/** S3 prefix for published AI invitation bundles. */
const BUNDLE_PREFIX = "ai-bundles";

/**
 * Object key for a published bundle. Immutable once written — rollback points
 * an invitation at a different key, it never overwrites one.
 *
 * The public URL is built by passing this key to `publicUrlForKey` in
 * `lib/s3.ts`, which owns the bucket/region URL convention. This module stays
 * pure and env-free so it can be unit tested.
 */
export function buildBundleObjectKey(
  invitationId: string,
  revisionId: string,
): string {
  return `${BUNDLE_PREFIX}/${invitationId}/${revisionId}.js`;
}
