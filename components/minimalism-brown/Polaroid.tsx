"use client";

import type { CSSProperties } from "react";
import type { TemplateTheme } from "@/lib/types";
import { mbTokens } from "@/lib/minimalism-brown";

const FRAME = {
  src: "/images/themes/minimalism-brown/frame-avatar.webp",
  w: 1094,
  h: 1554,
};

/**
 * Geometry of the frame's photo window, measured from the artwork's alpha
 * channel rather than eyeballed. The printed frame is tilted, so an
 * axis-aligned photo would poke past two of its corners; seating the photo on
 * the same rotation makes it sit inside the window exactly.
 */
/**
 * Geometry of the frame's photo window, taken from the reference's own markup
 * (`left-[11.5%] top-[8%] w-[72%] h-[77%] rotate-[-4.78deg] bg-white`) rather
 * than inferred. The printed frame is tilted, so the photo carries the same
 * rotation and sits on white, exactly as the original does.
 */
const APERTURE = {
  leftPct: 11.5,
  topPct: 8,
  widthPct: 72,
  heightPct: 77,
  tiltDeg: -4.78,
};

interface PolaroidProps {
  src?: string | null;
  alt?: string;
  theme: TemplateTheme;
  /** Rendered width of the whole frame. */
  width?: number | string;
  /** 0–100 focal point, matching the platform's imageSettings convention. */
  positionX?: number;
  positionY?: number;
  style?: CSSProperties;
}

/**
 * Taped polaroid with a wax seal — the hero's photo treatment.
 *
 * The photo sits behind the frame artwork (which carries the tape and seal in
 * its own transparency), so no extra elements are needed to reproduce them.
 * With no `src` the window fills with a themed tint instead of showing a
 * broken image.
 */
export default function Polaroid({
  src,
  alt = "",
  theme,
  width = "min(88%, 400px)",
  positionX = 50,
  positionY = 50,
  style,
}: PolaroidProps) {
  const t = mbTokens(theme);
  const hasPhoto = Boolean(src && src.trim());

  return (
    <div
      style={{
        position: "relative",
        width,
        aspectRatio: `${FRAME.w} / ${FRAME.h}`,
        marginInline: "auto",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${APERTURE.leftPct}%`,
          top: `${APERTURE.topPct}%`,
          width: `${APERTURE.widthPct}%`,
          height: `${APERTURE.heightPct}%`,
          transform: `rotate(${APERTURE.tiltDeg}deg)`,
          overflow: "hidden",
          // Beneath the frame, matching the reference's z-10 / z-20 pairing.
          // Painting the photo on top instead lets it spill over the printed
          // white border, which is what makes the mat look mis-cut.
          zIndex: 10,
          backgroundColor: "#FFFFFF",
        }}
      >
        {hasPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src as string}
            alt={alt}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: `${positionX}% ${positionY}%`,
              display: "block",
            }}
          />
        )}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        alt=""
        src={FRAME.src}
        width={FRAME.w}
        height={FRAME.h}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
          zIndex: 20,
          // No colour filter: the reference leaves its artwork untouched, and
          // tinting it turns the frame's white mat cream.
          filter: t.frameShadow,
        }}
      />
    </div>
  );
}
