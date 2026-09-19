"use client";

import type { CSSProperties } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { TemplateTheme } from "@/lib/types";
import { mbTokens } from "@/lib/minimalism-brown";
import { useIdle, useMbMotion } from "./motion";

const BASE = "/images/themes/minimalism-brown";

/** Intrinsic sizes of the theme artwork. Every decorative <img> declares its
 *  own dimensions so the layers can never shift layout as they decode. */
const ART = {
  paper: { src: `${BASE}/paper.webp`, w: 1333, h: 2000 },
  house: { src: `${BASE}/house-background.webp`, w: 1188, h: 1171 },
  leaf: { src: `${BASE}/leaf-background.webp`, w: 441, h: 1254 },
  sprig: { src: `${BASE}/flower2-decoration.webp`, w: 499, h: 1159 },
} as const;

/**
 * Paper texture laid over the page ground.
 *
 * Rendered as a background-image rather than an <img> because it tiles; it
 * carries no meaning, so it is hidden from assistive tech and never
 * intercepts pointer events.
 */
export function PaperGround() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url(${ART.paper.src})`,
        // Measured from the reference: tiled down the page at full width
        // rather than stretched to cover.
        backgroundSize: "100% auto",
        backgroundRepeat: "repeat",
        backgroundPosition: "50% 0%",
        opacity: 0.4,
        mixBlendMode: "multiply",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

/**
 * Faint architectural wash behind a section — the reference floats it at 8%
 * opacity behind the hero, the venue card and the gift box. It is easy to miss
 * and doing so is exactly why those sections read flatter than the original.
 */
export function HouseBackdrop({
  width = 507,
  top = "25%",
  left = "50%",
  opacity = 0.08,
}: {
  width?: number;
  top?: number | string;
  left?: number | string;
  opacity?: number;
}) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        top,
        left,
        transform: "translate(-50%, -50%)",
        width,
        opacity,
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={ART.house.src}
        width={ART.house.w}
        height={ART.house.h}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          objectFit: "contain",
        }}
      />
    </span>
  );
}

/**
 * Large botanical watermark running the height of the page, behind content.
 *
 * Drifts at a fraction of scroll speed for depth. The parallax lives on the
 * wrapper and the idle sway on the image, because both animate `transform` and
 * would otherwise overwrite each other.
 */
export function LeafWatermark({
  side = "left",
  top = 0,
  opacity = 0.12,
  width = 220,
  index = 0,
  /** Fraction of scroll distance the layer travels. */
  depth = 0.12,
  layer = 0,
}: {
  side?: "left" | "right";
  top?: number | string;
  opacity?: number;
  width?: number;
  index?: number;
  depth?: number;
  /** 0 for the page-wide watermarks; 20 when decorating a section, which is
   *  the tier the reference uses. */
  layer?: number;
}) {
  const { reduced } = useMbMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => (reduced ? 0 : -v * depth));
  const idle = useIdle("sway", index, 11);

  const wrapper: CSSProperties = {
    position: "absolute",
    top,
    [side]: -width * 0.28,
    width,
    opacity,
    pointerEvents: "none",
    userSelect: "none",
    zIndex: layer,
  };

  return (
    <motion.div aria-hidden style={{ ...wrapper, y }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={ART.leaf.src}
        width={ART.leaf.w}
        height={ART.leaf.h}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          transform: side === "right" ? "scaleX(-1)" : undefined,
          ...idle,
        }}
      />
    </motion.div>
  );
}

/**
 * Dried-flower sprig used as a corner accent beside cards and the hero.
 *
 * The static flip/rotate has to live on a wrapper: the idle keyframes own the
 * image's own transform.
 */
export function Sprig({
  theme,
  width = 110,
  rotate = 0,
  flip = false,
  index = 0,
  /** Matches the reference's decoration tier: in front of content, never
   *  behind it, and never interactive. */
  layer = 20,
  style,
}: {
  theme: TemplateTheme;
  width?: number;
  rotate?: number;
  flip?: boolean;
  index?: number;
  layer?: number;
  style?: CSSProperties;
}) {
  const idle = useIdle("sway", index, 9);
  const transforms = [
    flip ? "scaleX(-1)" : null,
    rotate ? `rotate(${rotate}deg)` : null,
  ].filter(Boolean);

  return (
    <span
      aria-hidden
      style={{
        display: "block",
        width,
        transform: transforms.length ? transforms.join(" ") : undefined,
        pointerEvents: "none",
        userSelect: "none",
        zIndex: layer,
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={ART.sprig.src}
        width={ART.sprig.w}
        height={ART.sprig.h}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          filter: mbTokens(theme).decorShadow,
          ...idle,
        }}
      />
    </span>
  );
}

/**
 * Scroll hint under the hero — a slow double chevron that fades out for good
 * once the reader has moved.
 */
export function ScrollCue({ theme }: { theme: TemplateTheme }) {
  const { reduced } = useMbMotion();
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 140], [1, 0]);

  return (
    <motion.div
      aria-hidden
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: 18,
        opacity: reduced ? 1 : opacity,
      }}
    >
      <span
        className="mb-cue"
        style={{
          color: theme.textSecondary,
          fontSize: 18,
          lineHeight: 1,
          ...(reduced
            ? { opacity: 0.55 }
            : {
                animationName: "mb-cue",
                animationDuration: "2.1s",
                animationIterationCount: "infinite",
                animationTimingFunction: "ease-in-out",
                willChange: "transform, opacity",
              }),
        }}
      >
        ⌄
      </span>
    </motion.div>
  );
}
