import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, verifyJwt } from "@/lib/auth";
import { publicUrlForKey as defaultPublicUrlForKey } from "@/lib/s3";

/** True when the current request carries a valid admin JWT. */
export async function isAdminRequest(): Promise<boolean> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;
  return (await verifyJwt(token)) !== null;
}

/**
 * Decide how to render a specific revision as a preview. Draft revisions load
 * from the auth-gated workspace proxy; published revisions load from their
 * immutable S3 bundle. Returns null if the revision is missing or belongs to a
 * different invitation (never leak another invitation's bundle).
 */
export function resolvePreviewRenderState(args: {
  revision: {
    id: string;
    invitationId: string;
    bundleKey: string | null;
  } | null;
  invitationId: string;
  publicUrlForKey?: (key: string) => string;
}): { renderMode: "ai"; aiBundleUrl: string } | null {
  const { revision, invitationId } = args;
  if (!revision || revision.invitationId !== invitationId) return null;
  const toUrl = args.publicUrlForKey ?? defaultPublicUrlForKey;
  const aiBundleUrl = revision.bundleKey
    ? toUrl(revision.bundleKey)
    : `/api/admin/ai/builds/${revision.id}/bundle.js`;
  return { renderMode: "ai", aiBundleUrl };
}
