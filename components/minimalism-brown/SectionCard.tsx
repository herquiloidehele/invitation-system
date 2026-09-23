"use client";

import type { CSSProperties, ReactNode } from "react";
import type { TemplateTheme } from "@/lib/types";
import { mbTokens } from "@/lib/minimalism-brown";

const PAPER = "/images/themes/minimalism-brown/paper.webp";

/**
 * The paper grain, as its own layer.
 *
 * Absolutely positioned, so the surface using it needs `position: relative`
 * and `overflow: hidden` to keep the grain inside its rounded corners.
 */
export function PaperTexture({
  opacity = 0.5,
  /** `cover` suits a full-width card. On a small tile it stretches the grain
   *  until it reads as a flat wash, so pass the width a section card would
   *  have and the texture keeps the same frequency everywhere. */
  size = "cover",
}: {
  opacity?: number;
  size?: string;
}) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url(${PAPER})`,
        backgroundSize: size,
        backgroundPosition: "center",
        opacity,
        mixBlendMode: "multiply",
        pointerEvents: "none",
      }}
    />
  );
}

/**
 * The warm card the reference puts behind its major sections.
 *
 * Built the way the original is: the card is an `absolute inset-0` layer
 * painted *behind* the content, and the wrapper keeps `overflow: visible`.
 * Wrapping the content in a clipping box instead — which is what this
 * component did first — cuts off every sprig and leaf that is supposed to
 * spill past the card's edge. Only the texture layer clips, so it stays inside
 * the rounded corners.
 */
export default function SectionCard({
  theme,
  children,
  radius,
  textured = true,
  padding,
  style,
}: {
  theme: TemplateTheme;
  children: ReactNode;
  radius?: number;
  /** The reference textures the schedule card; others take the flat fill. */
  textured?: boolean;
  /** Inner padding; defaults to the card token. Pass a tighter one when the
   *  content brings its own inset. */
  padding?: CSSProperties["padding"];
  style?: CSSProperties;
}) {
  const t = mbTokens(theme);
  const r = radius ?? t.card.radius;

  return (
    <div
      style={{
        position: "relative",
        marginInline: t.gutter,
        ...style,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          backgroundColor: t.card.bg,
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        {textured && <PaperTexture />}
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: padding ?? t.card.pad }}>
        {children}
      </div>
    </div>
  );
}
