import type { ObjectFit } from "@/lib/types";

/** All valid hero `object-fit` values, in display order (default first). */
const OBJECT_FIT_VALUES: readonly ObjectFit[] = [
  "cover",
  "contain",
  "fill",
  "scale-down",
  "none",
];

/** Portuguese-labelled options for the admin dropdowns. Single source of truth. */
export const HERO_MEDIA_FIT_OPTIONS: { value: ObjectFit; label: string }[] = [
  { value: "cover", label: "Preencher (cortar)" },
  { value: "contain", label: "Conter (sem cortar)" },
  { value: "fill", label: "Esticar" },
  { value: "scale-down", label: "Reduzir se necessário" },
  { value: "none", label: "Tamanho original" },
];

/** Type guard: true only for the five valid `object-fit` values. */
export function isObjectFit(value: unknown): value is ObjectFit {
  return (
    typeof value === "string" &&
    (OBJECT_FIT_VALUES as readonly string[]).includes(value)
  );
}

/** Resolve a stored/raw value to a valid fit, defaulting to "cover". */
export function resolveHeroMediaFit(value?: string | null): ObjectFit {
  return isObjectFit(value) ? value : "cover";
}
