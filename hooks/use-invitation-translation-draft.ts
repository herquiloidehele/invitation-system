"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from "react";

import type { AppLocale } from "@/i18n/locales";
import {
  applyInvitationTranslationDraft,
  buildInvitationTranslationDraft,
  localizeInvitation,
  normalizeInvitationTranslationIds,
  supportsInvitationTranslations,
} from "@/lib/invitation-translations";
import type { InvitationData } from "@/lib/types";

export interface InvitationTranslationDraft {
  /** Canonical record: Portuguese structure plus the translations overlay. */
  sourceForm: InvitationData;
  /** Writes straight to the canonical record — use for language settings. */
  setSourceForm: (next: SetStateAction<InvitationData>) => void;
  activeLocale: AppLocale;
  setActiveLocale: (locale: AppLocale) => void;
  /** The canonical record projected into `activeLocale` for editing. */
  form: InvitationData;
  /** Drop-in replacement for a `useState` setter over `InvitationData`. */
  setForm: (next: SetStateAction<InvitationData>) => void;
  /** The record as a guest would see it in `activeLocale` (PT fallback). */
  localizedPreview: InvitationData;
  /** Non-Portuguese locales may edit text but not structure. */
  structureLocked: boolean;
  sourcePlaceholder: (source: string | undefined, ordinary: string) => string;
}

/**
 * Owns the canonical-record / locale-draft state machine used by both admin
 * invitation forms.
 *
 * Editing in a non-Portuguese locale must never mutate the Portuguese record:
 * `form` is a derived projection, and every write funnels back through
 * `applyInvitationTranslationDraft`, which routes text into
 * `translations[locale]` and leaves structural values canonical.
 */
export function useInvitationTranslationDraft(
  initial: () => InvitationData,
): InvitationTranslationDraft {
  const [sourceForm, setSourceForm] = useState<InvitationData>(() =>
    normalizeInvitationTranslationIds(initial()),
  );

  const [activeLocale, setActiveLocaleState] = useState<AppLocale>("pt");
  // `setForm` keeps a stable identity (empty dependency array) so that the many
  // consumer callbacks holding it never go stale. It therefore cannot close
  // over `activeLocale` and reads this ref instead.
  //
  // The ref is only ever written from `setActiveLocale` — an event handler, not
  // render — and starts on the same value as the state, so the two can never
  // drift.
  const activeLocaleRef = useRef<AppLocale>("pt");

  const setActiveLocale = useCallback((locale: AppLocale) => {
    activeLocaleRef.current = locale;
    setActiveLocaleState(locale);
  }, []);

  const form = useMemo(
    () => buildInvitationTranslationDraft(sourceForm, activeLocale),
    [sourceForm, activeLocale],
  );

  const localizedPreview = useMemo(
    () =>
      supportsInvitationTranslations(sourceForm)
        ? localizeInvitation(sourceForm, activeLocale)
        : sourceForm,
    [sourceForm, activeLocale],
  );

  const setForm = useCallback((next: SetStateAction<InvitationData>) => {
    setSourceForm((source) => {
      const locale = activeLocaleRef.current;
      const current = buildInvitationTranslationDraft(source, locale);
      const draft = typeof next === "function" ? next(current) : next;
      return applyInvitationTranslationDraft(source, locale, draft);
    });
  }, []);

  const structureLocked = activeLocale !== "pt";

  const sourcePlaceholder = useCallback(
    (source: string | undefined, ordinary: string) =>
      structureLocked && source?.trim() ? source : ordinary,
    [structureLocked],
  );

  return {
    sourceForm,
    setSourceForm,
    activeLocale,
    setActiveLocale,
    form,
    setForm,
    localizedPreview,
    structureLocked,
    sourcePlaceholder,
  };
}
