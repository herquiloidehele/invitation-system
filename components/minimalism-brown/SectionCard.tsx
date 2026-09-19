"use client";

import type { CSSProperties, ReactNode } from "react";
import type { TemplateTheme } from "@/lib/types";
import { mbTokens } from "@/lib/minimalism-brown";

const PAPER = "/images/themes/minimalism-brown/paper.webp";

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
  style,
}: {
  theme: TemplateTheme;
  children: ReactNode;
  radius?: number;
  /** The reference textures the schedule card; others take the flat fill. */
  textured?: boolean;
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
        {textured && (
          <span
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${PAPER})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.5,
              mixBlendMode: "multiply",
            }}
          />
        )}
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: t.card.pad }}>
        {children}
      </div>
    </div>
  );
}
