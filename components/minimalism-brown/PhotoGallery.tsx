"use client";

import { useState } from "react";
import type { InvitationData, TemplateTheme } from "@/lib/types";
import {
  resolveGalleryImages,
  shouldRenderCoupleGallery,
} from "@/lib/couple-gallery";
import { useCustomText } from "@/lib/custom-texts";
import { mbTokens, mixWithTransparent } from "@/lib/minimalism-brown";
import GalleryLightbox from "@/components/shared/gallery/GalleryLightbox";
import SectionTitle from "./SectionTitle";
import { Reveal, RevealGroup, RevealItem, mbPop } from "./motion";

/** Tiles shown before the rest collapse into the "+N" overlay. */
const VISIBLE_TILES = 4;

/**
 * Photo grid with a "+N" overflow tile, opening the shared lightbox.
 *
 * The grid is bespoke to this template; the viewer is the platform's existing
 * GalleryLightbox so keyboard handling and navigation stay in one place.
 */
export default function PhotoGallery({
  invitation,
  theme,
}: {
  invitation: InvitationData;
  theme: TemplateTheme;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const ct = useCustomText(invitation.customTexts);
  const t = mbTokens(theme);

  if (!shouldRenderCoupleGallery(invitation)) return null;
  const images = resolveGalleryImages(invitation.coupleGallery);
  if (images.length === 0) return null;

  const tiles = images.slice(0, VISIBLE_TILES);
  const overflow = images.length - tiles.length;
  const title =
    invitation.coupleGallery?.title?.trim() || ct("sectionTitle_gallery");

  return (
    /* The lightbox must sit outside the Reveal: framer-motion leaves a
       transform on that element, and a transformed ancestor makes
       `position: fixed` resolve against it instead of the viewport — the
       full-screen overlay would be trapped inside this section's box. */
    <section style={{ marginTop: t.gap.section, paddingInline: 24 }}>
      <Reveal>
      <SectionTitle theme={theme} textStyles={invitation.textStyles}>
        {title}
      </SectionTitle>

      <RevealGroup
        style={{
          marginTop: t.gap.block,
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}
      >
        {tiles.map((img, i) => {
          const isLast = i === tiles.length - 1 && overflow > 0;
          return (
            <RevealItem key={`${img.src}-${i}`} variant={mbPop}>
            <button
              type="button"
              onClick={() => setLightboxIndex(i)}
              aria-label={
                isLast
                  ? `${title} — +${overflow}`
                  : `${title} — ${i + 1}/${images.length}`
              }
              style={{
                position: "relative",
                padding: 0,
                border: "none",
                cursor: "pointer",
                width: "100%",
                aspectRatio: "1 / 1",
                transition: "transform 180ms ease",
                overflow: "hidden",
                borderRadius: 0,
                backgroundColor: mixWithTransparent(theme.primary, 5),
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt=""
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: `${img.positionX}% ${img.positionY}%`,
                  display: "block",
                }}
              />
              {isLast && (
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: "rgba(0,0,0,0.55)",
                    color: "#FFFFFF",
                    fontFamily: theme.uiFont,
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  +{overflow}
                </span>
              )}
            </button>
            </RevealItem>
          );
        })}
      </RevealGroup>
      </Reveal>

      <GalleryLightbox
        images={images}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </section>
  );
}
