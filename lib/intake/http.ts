import { NextResponse } from "next/server";

import { clientIpFromForwardedFor } from "@/lib/currency/geo-lookup";
import type { IntakeIssue } from "./catalog";
import { createRateLimiter } from "./rate-limit";

// Shared plumbing for the public intake routes.

export const MAX_INTAKE_BODY_BYTES = 64 * 1024;

export const intakeCreateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60 * 60 * 1000,
});
export const intakeWriteLimiter = createRateLimiter({
  limit: 120,
  windowMs: 10 * 60 * 1000,
});
export const intakeSubmitLimiter = createRateLimiter({
  limit: 20,
  windowMs: 60 * 60 * 1000,
});

export type ReadJsonResult =
  | { ok: true; body: unknown }
  | { ok: false; response: NextResponse };

/** Read a JSON body with a size cap; answers 413/400 on failure. */
export async function readJsonBody(request: Request): Promise<ReadJsonResult> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_INTAKE_BODY_BYTES) {
    return { ok: false, response: jsonError("payload_too_large", 413) };
  }
  const text = await request.text();
  if (text.length > MAX_INTAKE_BODY_BYTES) {
    return { ok: false, response: jsonError("payload_too_large", 413) };
  }
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, response: jsonError("invalid_json", 400) };
  }
}

export function jsonError(
  error: string,
  status: number,
  extra: Record<string, unknown> = {},
): NextResponse {
  return NextResponse.json({ error, ...extra }, { status });
}

export function invalidBody(issues: IntakeIssue[]): NextResponse {
  return jsonError("invalid_body", 400, { issues });
}

export function tooManyRequests(): NextResponse {
  return jsonError("rate_limited", 429);
}

export function requestIp(request: Request): string | null {
  return clientIpFromForwardedFor(request.headers.get("x-forwarded-for"));
}

/**
 * Public origin for links the admin sends to customers. Mirrors the edit
 * page's owner-link logic: Railway forwards the public host and protocol.
 */
export function originFromHeaders(headers: {
  get(name: string): string | null;
}): string {
  const host =
    headers.get("x-forwarded-host") ?? headers.get("host") ?? "localhost:3000";
  const proto =
    headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
