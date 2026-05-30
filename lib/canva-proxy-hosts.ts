import { z } from "zod";

/**
 * Allowlist for upstream hosts that the Canva reverse proxy is willing to
 * fetch from. Shared between `app/canva-proxy/[...path]/route.ts` and
 * `app/api/admin/canva-proxy/revalidate/route.ts` so the proxy and the cache
 * revalidation endpoint apply the same validation.
 */
export const ALLOWED_HOSTS: ReadonlyArray<string | RegExp> = [
  /^[a-z0-9-]+\.canva\.site$/i,
  /^[a-z0-9-]+\.my\.canva\.site$/i,
  "brindealstudio.com",
];

export function isHostAllowed(host: string): boolean {
  const normalized = host.toLowerCase();
  return ALLOWED_HOSTS.some((entry) =>
    typeof entry === "string"
      ? entry === normalized
      : entry.test(normalized),
  );
}

/**
 * Request body schema for `POST /api/admin/canva-proxy/revalidate`.
 *
 * - Empty object → bust the global `canva-proxy` tag.
 * - `{ host }` where `host` passes `isHostAllowed` → bust the
 *   `canva-proxy:<host>` tag only.
 */
export const canvaProxyRevalidateBodySchema = z.object({
  host: z
    .string()
    .refine(isHostAllowed, "Host not allowed")
    .optional(),
});

export type CanvaProxyRevalidateBody = z.infer<
  typeof canvaProxyRevalidateBodySchema
>;
