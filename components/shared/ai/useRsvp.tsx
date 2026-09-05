"use client";

import { useCallback, useMemo, useState } from "react";

import { isRsvpClosed } from "@/lib/rsvp-config";
import { storeGuestPassToken } from "@/lib/entry-pass";
import {
  buildRsvpFields,
  buildRsvpPayload,
  emptyRsvpValues,
  validateRsvpValues,
} from "@/lib/ai-rsvp";
import type { RsvpApi, RsvpValues } from "@/lib/ai-rsvp-types";
import { hasSubmittedRsvp, markRsvpSubmitted } from "@/lib/rsvp-submitted";
import { usePlatformContext } from "./PlatformContext";

/**
 * Headless RSVP: field descriptor + editable values + validation + a real
 * submit to POST /api/rsvp. Composes the existing pure rsvp-config and
 * rsvp-custom-fields logic; the generated bundle owns all markup.
 */
export function useRsvp(): RsvpApi {
  const { invitation, guest } = usePlatformContext();
  const slug = invitation.slug;
  const rsvp = invitation.rsvp;

  const fields = useMemo(() => buildRsvpFields(rsvp), [rsvp]);

  const [values, setValues] = useState<RsvpValues>(() => ({
    ...emptyRsvpValues(),
    name: guest?.name ?? "",
  }));
  const [errors, setErrors] = useState<RsvpApi["errors"]>({});
  const [status, setStatus] = useState<RsvpApi["status"]>(() =>
    isRsvpClosed(rsvp)
      ? "closed"
      : hasSubmittedRsvp(slug)
        ? "already_submitted"
        : "idle",
  );

  const setValue = useCallback<RsvpApi["setValue"]>((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setCustom = useCallback((fieldId: string, value: unknown) => {
    setValues((prev) => ({
      ...prev,
      custom: { ...prev.custom, [fieldId]: value },
    }));
  }, []);

  // Plain function, not useCallback: it closes over `values` (changes every
  // keystroke) so memoization would buy nothing, and the bundle calls
  // `rsvp.submit()` on click where identity stability is irrelevant.
  const submit: RsvpApi["submit"] = async () => {
    const validation = validateRsvpValues(values, fields);
    if (!validation.ok) {
      setErrors(validation.errors);
      return { ok: false, checkInToken: null };
    }
    setErrors({});
    setStatus("submitting");

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildRsvpPayload({ slug, values, fields, guestToken: guest?.token }),
        ),
      });
      if (!res.ok) {
        setStatus("error");
        return { ok: false, checkInToken: null };
      }
      const json = (await res.json().catch(() => ({}))) as {
        checkInToken?: string | null;
      };
      markRsvpSubmitted(slug);
      if (json.checkInToken) storeGuestPassToken(slug, json.checkInToken);
      setStatus("success");
      return { ok: true, checkInToken: json.checkInToken ?? null };
    } catch {
      setStatus("error");
      return { ok: false, checkInToken: null };
    }
  };

  return { fields, values, setValue, setCustom, errors, status, submit };
}
