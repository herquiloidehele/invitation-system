import type { TemplateTheme } from "@/lib/types";
import type { ResolvedGalleryImage } from "@/lib/couple-gallery";

export interface GalleryStyleProps {
  images: ResolvedGalleryImage[];
  theme: TemplateTheme;
  /** Resolved accent color (from text styles). */
  accent: string;
  /** True in the admin live preview. */
  isPreview: boolean;
  /** Host's autoplay choice, already resolved against the per-style default.
   *  Only the styles that advance on their own (kenburns, coverflow) use it. */
  autoplay: boolean;
  /** Open the shared full-screen lightbox at the given index. */
  onOpenLightbox?: (index: number) => void;
}
