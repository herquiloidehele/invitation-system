"use client";

import { Languages } from "lucide-react";

import type { AppLocale } from "@/i18n/locales";
import { Button } from "@/components/ui/button";

const LOCALE_LABELS: Record<AppLocale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
};

/**
 * Persistent reminder that the form is editing a translation.
 *
 * The editing locale can be changed from the live preview's language switcher,
 * but the control that shows it lives inside the collapsed "Idiomas" accordion.
 * Without this, the form silently switches to English and every locked control
 * (add a hero text, add an FAQ…) looks broken for no visible reason.
 *
 * Renders nothing for Portuguese, which is the canonical record.
 */
export function EditingLocaleNotice({
  activeLocale,
  onReset,
}: {
  activeLocale: AppLocale;
  onReset: () => void;
}) {
  if (activeLocale === "pt") return null;

  return (
    <div
      role="status"
      className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 py-1 pl-3 pr-1 text-amber-900"
    >
      <Languages className="size-3.5 shrink-0" aria-hidden />
      <span className="text-xs font-medium whitespace-nowrap">
        A editar em {LOCALE_LABELS[activeLocale]}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="h-6 rounded-full px-2 text-xs text-amber-900 hover:bg-amber-100 hover:text-amber-950"
      >
        Voltar a Português
      </Button>
    </div>
  );
}
