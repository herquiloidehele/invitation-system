import type { ImageLayerSectionKey } from "./types";

export interface ImageLayerSectionMeta {
  key: ImageLayerSectionKey;
  label: string;
}

/** Section registry shared by the renderers and the editor (UI language: pt-PT). */
export const IMAGE_LAYER_SECTIONS: ImageLayerSectionMeta[] = [
  { key: "hero", label: "Hero" },
  { key: "saveTheDate", label: "Save the Date" },
  { key: "sectionImage1", label: "Imagem 1" },
  { key: "sectionImage2", label: "Imagem 2" },
  { key: "sectionImage3", label: "Imagem 3" },
  { key: "sectionImage4", label: "Imagem 4" },
  { key: "ourStory", label: "A nossa história" },
  { key: "coupleGallery", label: "Galeria" },
  { key: "schedule", label: "Programa" },
  { key: "location", label: "Localização" },
  { key: "dressCode", label: "Traje" },
  { key: "giftRegistry", label: "Presentes" },
  { key: "guestGuide", label: "Guia do convidado" },
  { key: "faqs", label: "Perguntas frequentes" },
  { key: "places", label: "Lugares" },
  { key: "countdown", label: "Contagem decrescente" },
  { key: "footer", label: "Rodapé" },
];

export function imageLayerSectionLabel(key: ImageLayerSectionKey): string {
  return IMAGE_LAYER_SECTIONS.find((s) => s.key === key)?.label ?? key;
}
