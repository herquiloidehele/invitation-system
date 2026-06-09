"use client";

import MediaUpload from "@/components/admin/MediaUpload";
import { deriveCents } from "@/lib/currency/config";
import {
  OVERRIDE_CURRENCIES,
  type OverrideCurrency,
  type PriceOverrideEntry,
  type PriceOverrides,
} from "@/lib/currency/template-price";

export type LandingMetadata = {
  priceFromCents: number | null;
  discountPriceFromCents: number | null;
  currency: string | null;
  priceOverrides: PriceOverrides | null;
  landingModelName: string | null;
  landingImageUrl: string | null;
  landingDescription: string | null;
};

export function LandingMetadataFieldset({
  value,
  onChange,
}: {
  value: LandingMetadata;
  onChange: (next: LandingMetadata) => void;
}) {
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

  return (
    <fieldset className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <legend className="px-2 text-sm font-semibold">Landing page</legend>

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
              priceFromCents: raw === "" ? null : Math.round(Number(raw) * 100),
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
          Preços noutras moedas (vazio = conversão automática a partir do preço
          base)
        </p>
        <div className="grid grid-cols-[3rem_1fr_1fr] gap-2 text-xs text-neutral-400">
          <span></span>
          <span>Desde</span>
          <span>Promo</span>
        </div>
        {OVERRIDE_CURRENCIES.map((currency) => {
          const entry = value.priceOverrides?.[currency] ?? null;
          const fromMajor = entry?.fromCents != null ? entry.fromCents / 100 : "";
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
                  updateOverride(currency, "discountCents", event.target.value)
                }
                className="rounded-md border border-neutral-300 px-2 py-1"
              />
            </div>
          );
        })}
      </div>

      <label className="block text-sm">
        Nome do modelo (título do cartão)
        <input
          type="text"
          value={value.landingModelName ?? ""}
          onChange={(event) =>
            update({ landingModelName: event.target.value || null })
          }
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2"
          placeholder="Modelo Editorial"
        />
      </label>

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

      <label className="block text-sm">
        Descrição curta
        <textarea
          value={value.landingDescription ?? ""}
          onChange={(event) =>
            update({ landingDescription: event.target.value || null })
          }
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2"
          rows={2}
        />
      </label>
    </fieldset>
  );
}
