// Browser-side calls to the public intake API. Every call resolves (never
// throws) so the wizard can show inline state; public pages have no Toaster.

export type IntakeApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      error: string;
      body: Record<string, unknown>;
    };

async function call<T>(url: string, init: RequestInit): Promise<IntakeApiResult<T>> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: { "content-type": "application/json", ...init.headers },
    });
    const body = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: typeof body.error === "string" ? body.error : "generic",
        body,
      };
    }
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, status: 0, error: "network", body: {} };
  }
}

export function createIntakeRequest(payload: {
  productKind: string;
  demoSlug: string;
  locale: string;
  contactName: string;
  contactWhatsapp: string;
  website: string;
}) {
  return call<{ token: string; path: string; reference: string }>(
    "/api/intakes",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function saveIntakeRequest(
  token: string,
  payload: { contact?: unknown; answers?: unknown; lastStep?: string },
  { keepalive = false }: { keepalive?: boolean } = {},
) {
  return call<{ ok: true; answersUpdatedAt: string | null }>(
    `/api/intakes/${encodeURIComponent(token)}`,
    { method: "PATCH", body: JSON.stringify(payload), keepalive },
  );
}

export function submitIntakeRequest(token: string) {
  return call<{ ok: true; submittedAt: string }>(
    `/api/intakes/${encodeURIComponent(token)}/submit`,
    { method: "POST", body: "{}" },
  );
}

/** Translation key for an API error code. */
export function apiErrorKey(error: string, status: number): string {
  if (error === "network" || status === 0) return "errors.network";
  if (status === 429) return "errors.rateLimited";
  if (status === 409) return "errors.readOnly";
  return "errors.generic";
}
