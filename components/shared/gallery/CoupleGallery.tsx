"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type {
  CoupleGalleryStyle,
  InvitationData,
  TemplateTheme,
} from "@/lib/types";
import { resolveTextStyles } from "@/lib/text-styles";
import { useCustomText } from "@/lib/custom-texts";
import {
  resolveGalleryImages,
  shouldRenderCoupleGallery,
} from "@/lib/couple-gallery";
import { EditableText } from "@/components/shared/EditableText";
import GalleryLightbox from "./GalleryLightbox";
import KenBurnsGallery from "./styles/KenBurnsGallery";
import CoverflowGallery from "./styles/CoverflowGallery";
import PolaroidGallery from "./styles/PolaroidGallery";
import FilmstripGallery from "./styles/FilmstripGallery";
import GridGallery from "./styles/GridGallery";
import type { GalleryStyleProps } from "./types";

export default function CoupleGallery({
  invitation,
  theme,
  isPreview = false,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
  isPreview?: boolean;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const t = useCustomText(invitation.customTexts);

  if (!shouldRenderCoupleGallery(invitation)) return null;

  const gallery = invitation.coupleGallery!;
  const images = resolveGalleryImages(gallery);
  const ts = resolveTextStyles(theme, invitation.textStyles);

  const styleProps: GalleryStyleProps = {
    images,
    theme,
    accent: ts.accent,
    isPreview,
    onOpenLightbox: setLightboxIndex,
  };

  const title = gallery.title?.trim() || t("sectionTitle_gallery");

  return (
    <motion.section
      className="px-4 pb-10"
      initial="hidden"
      {...(isPreview
        ? { animate: "visible" }
        : {
            whileInView: "visible",
            viewport: { once: false, margin: "-60px" },
          })}
      variants={{
        hidden: { opacity: 0, y: 28 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
      }}
    >
      <div className="flex flex-col items-center">
        <span style={ts.sectionTitles}>
          <EditableText elementKey="sectionTitles">{title}</EditableText>
        </span>
        <div
          className="mt-3 mb-6"
          style={{ width: 28, height: 1, background: ts.accent, opacity: 0.25 }}
        />
      </div>

      {renderStyle(gallery.style, styleProps)}

      <GalleryLightbox
        images={images}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </motion.section>
  );
}

function renderStyle(style: CoupleGalleryStyle, props: GalleryStyleProps) {
  switch (style) {
    case "coverflow":
      return <CoverflowGallery {...props} />;
    case "polaroid":
      return <PolaroidGallery {...props} />;
    case "filmstrip":
      return <FilmstripGallery {...props} />;
    case "grid":
      return <GridGallery {...props} />;
    case "kenburns":
    default:
      return <KenBurnsGallery {...props} />;
  }
}
