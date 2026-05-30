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
