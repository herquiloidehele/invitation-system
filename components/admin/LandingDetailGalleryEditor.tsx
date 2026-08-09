"use client";

import Image from "next/image";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import MediaUpload from "@/components/admin/MediaUpload";
import {
  appendLandingDetailImage,
  moveLandingDetailImage,
  removeLandingDetailImage,
} from "@/lib/landing-product-details";

export function LandingDetailGalleryEditor({
  value,
  onChange,
}: {
  value: string[] | null;
  onChange: (next: string[] | null) => void;
}) {
  const images = value ?? [];
  const commit = (next: string[]) => onChange(next.length ? next : null);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-neutral-800">
          Galeria da página de detalhes
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">
          Estas imagens aparecem primeiro. Se estiver vazio, usamos as imagens
          já associadas ao modelo.
        </p>
      </div>

      {images.length ? (
        <div className="space-y-2">
          {images.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-2"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100 outline outline-1 -outline-offset-1 outline-black/10">
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">
                Imagem {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    commit(moveLandingDetailImage(images, index, -1))
                  }
                  disabled={index === 0}
                  aria-label={`Mover imagem ${index + 1} para cima`}
                  className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                >
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    commit(moveLandingDetailImage(images, index, 1))
                  }
                  disabled={index === images.length - 1}
                  aria-label={`Mover imagem ${index + 1} para baixo`}
                  className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                >
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    commit(removeLandingDetailImage(images, index))
                  }
                  aria-label={`Remover imagem ${index + 1}`}
                  className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <MediaUpload
        kind="image"
        maxSizeMB={5}
        onUpload={(url) => commit(appendLandingDetailImage(images, url))}
        onClear={() => {}}
        label="Adicionar imagem à galeria"
      />
    </div>
  );
}
