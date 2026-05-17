"use client";

import MediaUpload from "@/components/admin/MediaUpload";

export type LandingMetadata = {
  priceFromCents: number | null;
  currency: string | null;
  landingImageUrl: string | null;
  landingSubtitle: string | null;
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

  const priceEuros =
    value.priceFromCents != null ? value.priceFromCents / 100 : "";

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
              priceFromCents:
                raw === "" ? null : Math.round(Number(raw) * 100),
            });
          }}
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2"
          placeholder="149"
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
        Subtítulo (linha 2 do cartão)
        <input
          type="text"
          value={value.landingSubtitle ?? ""}
          onChange={(event) =>
            update({ landingSubtitle: event.target.value || null })
          }
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2"
          placeholder="Quinta da Aroeira"
        />
      </label>

      <label className="block text-sm">
        Descrição curta
        <textarea
          value={value.landingDescription ?? ""}
          onChange={(event) =>
            update({ landingDescription: event.target.value || null })
          }
          maxLength={140}
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2"
          rows={2}
        />
      </label>
    </fieldset>
  );
}
