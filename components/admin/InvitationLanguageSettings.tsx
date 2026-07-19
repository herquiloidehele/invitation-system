"use client";

import type { AppLocale } from "@/i18n/locales";
import { normalizeInvitationLocales } from "@/lib/invitation-translations";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface InvitationLanguageSettingsProps {
  enabled: boolean;
  enabledLocales: AppLocale[];
  activeLocale: AppLocale;
  onEnabledChange: (enabled: boolean) => void;
  onEnabledLocalesChange: (locales: AppLocale[]) => void;
  onActiveLocaleChange: (locale: AppLocale) => void;
}

const LOCALES: Array<{
  locale: AppLocale;
  label: string;
  detail: string;
}> = [
  { locale: "pt", label: "Português", detail: "Idioma principal" },
  { locale: "en", label: "English", detail: "Inglês" },
  { locale: "es", label: "Español", detail: "Espanhol" },
];

export function InvitationLanguageSettings({
  enabled,
  enabledLocales,
  activeLocale,
  onEnabledChange,
  onEnabledLocalesChange,
  onActiveLocaleChange,
}: InvitationLanguageSettingsProps) {
  const normalizedLocales = normalizeInvitationLocales(enabledLocales);
  const invalid = enabled && normalizedLocales.length < 2;

  const setLocaleEnabled = (locale: AppLocale, selected: boolean) => {
    if (locale === "pt") return;
    const next = normalizeInvitationLocales(
      selected
        ? [...normalizedLocales, locale]
        : normalizedLocales.filter((item) => item !== locale),
    );
    if (!next.includes(activeLocale)) onActiveLocaleChange("pt");
    onEnabledLocalesChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="invitation-language-switcher">
            Activar seletor de idiomas
          </Label>
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            Permite aos convidados escolher entre os idiomas que preparares.
            Português continua a ser o conteúdo principal.
          </p>
        </div>
        <Switch
          id="invitation-language-switcher"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {LOCALES.map(({ locale, label, detail }) => {
          const locked = locale === "pt";
          return (
            <div
              key={locale}
              className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-[0.6875rem] text-muted-foreground">
                  {detail}
                </p>
              </div>
              <Switch
                aria-label={`Activar ${label}`}
                checked={normalizedLocales.includes(locale)}
                disabled={locked}
                onCheckedChange={(selected) =>
                  setLocaleEnabled(locale, selected)
                }
              />
            </div>
          );
        })}
      </div>

      {invalid && (
        <p className="text-xs font-medium text-destructive">
          Ative pelo menos um idioma adicional.
        </p>
      )}

      {enabled && normalizedLocales.length > 1 && (
        <div className="border-t pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Idioma em edição</p>
              <p className="text-xs text-muted-foreground">
                Campos vazios usam automaticamente o texto em Português.
              </p>
            </div>
            <div
              className="inline-flex rounded-lg border bg-muted/60 p-1"
              aria-label="Idioma em edição"
            >
              {normalizedLocales.map((locale) => (
                <button
                  key={locale}
                  type="button"
                  aria-pressed={activeLocale === locale}
                  className={`min-h-8 rounded-md px-3 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    activeLocale === locale
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => onActiveLocaleChange(locale)}
                >
                  {locale}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
