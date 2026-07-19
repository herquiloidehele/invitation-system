"use client";

import { useState } from "react";

import MediaUpload from "@/components/admin/MediaUpload";
import { deriveCents } from "@/lib/currency/config";
import {
  OVERRIDE_CURRENCIES,
  type OverrideCurrency,
  type PriceOverrideEntry,
  type PriceOverrides,
} from "@/lib/currency/template-price";
import type { LandingCustomizationLevel } from "@/lib/landing-customization";
import {
  applyLandingTranslationDraft,
  buildLandingTranslationDraft,
  type LandingTranslations,
} from "@/lib/landing-translations";
import type { AppLocale } from "@/i18n/locales";

const EDITING_LOCALES = ["pt", "en", "es"] as const;
const EDITING_LOCALE_LABELS: Record<AppLocale, string> = {
  pt: "PT",
  en: "EN",
  es: "ES",
};

export type LandingMetadata = {
  priceFromCents: number | null;
  discountPriceFromCents: number | null;
  currency: string | null;
  priceOverrides: PriceOverrides | null;
  landingModelName: string | null;
  landingImageUrl: string | null;
  landingDescription: string | null;
  landingSubtitle: string | null;
  landingTranslations: LandingTranslations | null;
  landingCustomizationLevel: LandingCustomizationLevel;
};

export function LandingMetadataFieldset({
  value,
  onChange,
}: {
  value: LandingMetadata;
  onChange: (next: LandingMetadata) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingLocale, setEditingLocale] = useState<AppLocale>("pt");

  function update(patch: Partial<LandingMetadata>) {
    onChange({ ...value, ...patch });
  }

  function updateOverride(
    currency: OverrideCurrency,
    field: "fromCents" | "discountCents",
    raw: string,
  ) {
    const cents = raw === "" ? null : Math.round(Number(raw) * 100);
    const next: PriceOverrides = { ...(value.priceOverrides ?? {}) };
    const entry: { fromCents?: number; discountCents?: number | null } = {
      ...(next[currency] ?? {}),
    };

    if (field === "fromCents") {
      if (cents == null) delete entry.fromCents;
      else entry.fromCents = cents;
    } else {
      entry.discountCents = cents;
    }

    // An entry without a positive fromCents is meaningless — drop it so the
    // currency reverts to auto-derivation.
    if (entry.fromCents == null || entry.fromCents <= 0) delete next[currency];
    else next[currency] = entry as PriceOverrideEntry;

    update({ priceOverrides: Object.keys(next).length ? next : null });
  }

  const priceEuros =
    value.priceFromCents != null ? value.priceFromCents / 100 : "";

  const discountEuros =
    value.discountPriceFromCents != null
      ? value.discountPriceFromCents / 100
      : "";

  const discountInvalid =
    value.discountPriceFromCents != null &&
    (value.priceFromCents == null ||
      value.discountPriceFromCents >= value.priceFromCents);

  const draft = buildLandingTranslationDraft(value, editingLocale);
  const portugueseDraft = buildLandingTranslationDraft(value, "pt");

  function updateLandingText(
    field: "landingModelName" | "landingSubtitle" | "landingDescription",
    nextValue: string,
  ) {
    if (editingLocale === "pt") {
      update({ [field]: nextValue || null });
      return;
    }

    update({
      landingTranslations:
        applyLandingTranslationDraft(value.landingTranslations, editingLocale, {
          ...draft,
          [field]: nextValue,
        }) ?? null,
    });
  }

  return (
    <fieldset className="rounded-lg border border-neutral-200 px-4 pb-4 pt-2">
      <legend className="px-2">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="flex items-center gap-1.5 text-sm font-semibold"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={`h-4 w-4 text-neutral-400 transition-transform ${
              open ? "rotate-90" : ""
            }`}
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
              clipRule="evenodd"
            />
          </svg>
          Landing page
        </button>
      </legend>

      {!open ? null : (
        <div className="space-y-3 pt-1">
          <div className="space-y-2">
            <span className="block text-sm font-medium">
              Nível de personalização
            </span>
            <label className="flex cursor-pointer gap-3 rounded-md border border-neutral-200 p-3 text-sm">
              <input
                type="radio"
                name="landingCustomizationLevel"
                value="fully_customizable"
                checked={
                  value.landingCustomizationLevel === "fully_customizable"
                }
                onChange={() =>
                  update({
                    landingCustomizationLevel: "fully_customizable",
                  })
                }
                className="mt-0.5"
              />
              <span>
                <strong className="block">Totalmente personalizável</strong>
                <span className="text-xs text-neutral-500">
                  A estrutura e o layout podem ser alterados.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-md border border-neutral-200 p-3 text-sm">
              <input
                type="radio"
                name="landingCustomizationLevel"
                value="pre_designed"
                checked={value.landingCustomizationLevel === "pre_designed"}
                onChange={() =>
                  update({ landingCustomizationLevel: "pre_designed" })
                }
                className="mt-0.5"
              />
              <span>
                <strong className="block">Design predefinido</strong>
                <span className="text-xs text-neutral-500">
                  O conteúdo e o estilo mudam, mas a estrutura mantém-se.
                </span>
              </span>
            </label>
          </div>

          <label className="block text-sm">
            Preço base (€)
            <input
              type="number"
              min={0}
              step={1}
              value={priceEuros}
              onChange={(event) => {
                const raw = event.target.value;
                update({
                  priceFromCents:
                    raw === "" ? null : Math.round(Number(raw) * 100),
                });
              }}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2"
              placeholder="149"
            />
          </label>

          <label className="block text-sm">
            Preço promocional (€)
            <input
              type="number"
              min={0}
              step={1}
              value={discountEuros}
              onChange={(event) => {
                const raw = event.target.value;
                update({
                  discountPriceFromCents:
                    raw === "" ? null : Math.round(Number(raw) * 100),
                });
              }}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2"
              placeholder="99"
            />
            {discountInvalid ? (
              <span className="mt-1 block text-xs text-amber-600">
                O preço promocional deve ser inferior ao preço base.
              </span>
            ) : null}
          </label>

          <div className="space-y-2 rounded-md border border-neutral-200 p-3">
            <p className="text-xs font-semibold text-neutral-600">
              Preços noutras moedas (vazio = conversão automática a partir do
              preço base)
            </p>
            <div className="grid grid-cols-[3rem_1fr_1fr] gap-2 text-xs text-neutral-400">
              <span></span>
              <span>Desde</span>
              <span>Promo</span>
            </div>
            {OVERRIDE_CURRENCIES.map((currency) => {
              const entry = value.priceOverrides?.[currency] ?? null;
              const fromMajor =
                entry?.fromCents != null ? entry.fromCents / 100 : "";
              const promoMajor =
                entry?.discountCents != null ? entry.discountCents / 100 : "";
              const suggestion =
                value.priceFromCents != null && value.priceFromCents > 0
                  ? String(deriveCents(value.priceFromCents, currency) / 100)
                  : "";
              return (
                <div
                  key={currency}
                  className="grid grid-cols-[3rem_1fr_1fr] items-center gap-2 text-sm"
                >
                  <span className="font-medium">{currency}</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={fromMajor}
                    placeholder={suggestion}
                    onChange={(event) =>
                      updateOverride(currency, "fromCents", event.target.value)
                    }
                    className="rounded-md border border-neutral-300 px-2 py-1"
                  />
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={promoMajor}
                    placeholder="—"
                    onChange={(event) =>
                      updateOverride(
                        currency,
                        "discountCents",
                        event.target.value,
                      )
                    }
                    className="rounded-md border border-neutral-300 px-2 py-1"
                  />
                </div>
              );
            })}
          </div>

          <div className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-neutral-800">
                  Texto do cartão
                </p>
                <p className="text-xs text-neutral-500">
                  Campos vazios usam o texto em Português.
                </p>
              </div>
              <div
                className="inline-flex rounded-md border border-neutral-200 bg-white p-0.5"
                aria-label="Idioma em edição"
              >
                {EDITING_LOCALES.map((locale) => (
                  <button
                    key={locale}
                    type="button"
                    onClick={() => setEditingLocale(locale)}
                    aria-pressed={editingLocale === locale}
                    className={`min-w-10 rounded px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      editingLocale === locale
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                    }`}
                  >
                    {EDITING_LOCALE_LABELS[locale]}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-sm">
              Nome do modelo (título do cartão)
              <input
                type="text"
                value={draft.landingModelName}
                onChange={(event) =>
                  updateLandingText("landingModelName", event.target.value)
                }
                className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2"
                placeholder={portugueseDraft.landingModelName}
              />
            </label>

            <label className="block text-sm">
              Subtítulo
              <input
                type="text"
                value={draft.landingSubtitle}
                onChange={(event) =>
                  updateLandingText("landingSubtitle", event.target.value)
                }
                className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2"
                placeholder={portugueseDraft.landingSubtitle}
              />
            </label>

            <label className="block text-sm">
              Descrição curta
              <textarea
                value={draft.landingDescription}
                onChange={(event) =>
                  updateLandingText("landingDescription", event.target.value)
                }
                className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2"
                placeholder={portugueseDraft.landingDescription}
                rows={2}
              />
            </label>
          </div>

          <div className="block text-sm">
            <span className="mb-1 block">Imagem destaque</span>
            <MediaUpload
              kind="image"
              maxSizeMB={5}
              value={value.landingImageUrl ?? undefined}
              onUpload={(url) => update({ landingImageUrl: url })}
              onClear={() => update({ landingImageUrl: null })}
              label="Carregar imagem destaque"
            />
          </div>
        </div>
      )}
    </fieldset>
  );
}
