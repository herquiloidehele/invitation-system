"use client";

import { createElement, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

import {
  getLucideIconComponent,
  resolveLucideIconName,
} from "@/lib/lucide-icons";
import { sanitizeAndNormalizeSvg } from "@/lib/svg-icons";
import type { GuestGuide, GuestGuideItem, InvitationStyles } from "@/lib/types";
import type { ResolvedTextStyles } from "@/lib/text-styles";
import { EditableText } from "./EditableText";

// ---------------------------------------------------------------------------
// Animation constants — kept local, only what this section needs
// ---------------------------------------------------------------------------

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// ---------------------------------------------------------------------------
// GuideIcon — renders either a Lucide icon or a custom image
// ---------------------------------------------------------------------------

interface GuideIconProps {
  item: GuestGuideItem;
  size: number;
  color: string;
}

function InlineSvgIcon({
  url,
  size,
  color,
}: {
  url: string;
  size: number;
  color: string;
}) {
  const [markup, setMarkup] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSvg() {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch SVG icon");
        }

        const svgText = await response.text();
        const sanitized = sanitizeAndNormalizeSvg(svgText);

        if (!cancelled) {
          setMarkup(sanitized);
        }
      } catch {
        if (!cancelled) {
          setMarkup(null);
        }
      }
    }

    setMarkup(null);
    void loadSvg();

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!markup) {
    return <Star size={size} color={color} strokeWidth={1.5} />;
  }

  return (
    <span
      style={{ width: size, height: size, color, display: "inline-flex" }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

function GuideIcon({ item, size, color }: GuideIconProps) {
  if (item.iconType === "svg" && item.iconUrl) {
    return <InlineSvgIcon url={item.iconUrl} size={size} color={color} />;
  }

  if (item.iconType === "image" && item.iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.iconUrl}
        alt={item.label}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  }

  const resolvedIconName = resolveLucideIconName(item.iconName);
  const IconComp = resolvedIconName
    ? getLucideIconComponent(resolvedIconName)
    : undefined;
  if (IconComp) {
    return createElement(IconComp, {
      size,
      color,
      strokeWidth: 1.5,
    });
  }

  return <Star size={size} color={color} strokeWidth={1.5} />;
}

// ---------------------------------------------------------------------------
// GuestGuideItem card
// ---------------------------------------------------------------------------

interface GuideItemCardProps {
  item: GuestGuideItem;
  theme: InvitationStyles;
  ts?: ResolvedTextStyles;
  cardBg?: string;
  cardBorder?: string;
  cardBorderRadius?: number;
  isPreview?: boolean;
}

function GuideItemCard({
  item,
  theme,
  ts,
  cardBg,
  cardBorder,
  cardBorderRadius,
  isPreview,
}: GuideItemCardProps) {
  return (
    <motion.div
      {...(isPreview
        ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
        : { variants: fadeInUp })}
      className="flex flex-col items-center gap-2 text-center"
      style={{
        background: cardBg || theme.cardBg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: cardBorderRadius ?? 14,
        padding: "18px 12px",
        border: `1px solid ${cardBorder || theme.cardBorder}`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.03)",
      }}
    >
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ width: 48, height: 48, background: `${theme.accent}14` }}
      >
        <GuideIcon item={item} size={22} color={theme.accent} />
      </div>

      <EditableText elementKey="guideItemLabel">
        <span
          style={{
            fontFamily: ts?.bodyFont ?? theme.bodyFont,
            fontSize: 12,
            fontWeight: 500,
            color: ts?.textPrimary ?? theme.textPrimary,
            lineHeight: 1.4,
            ...(ts?.guideItemLabel ?? {}),
          }}
        >
          {item.label}
        </span>
      </EditableText>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// GuestGuideSection — the full invitation-page section
// ---------------------------------------------------------------------------

export interface GuestGuideSectionProps {
  guestGuide: GuestGuide;
  theme: InvitationStyles;
  /** Resolved text styles — when provided, text elements use these instead of raw theme values */
  ts?: ResolvedTextStyles;
  /** Per-section card background override. Falls back to theme.cardBg. */
  cardBg?: string;
  /** Per-section card border override. Falls back to theme.cardBorder. */
  cardBorder?: string;
  /** Per-section card border-radius override. Falls back to 14. */
  cardBorderRadius?: number;
  /** When true, all animations use `animate` instead of `whileInView` so
   *  the section is always fully visible (no scroll-trigger dependency).
   *  Use this in the admin live preview. */
  isPreview?: boolean;
}

export default function GuestGuideSection({
  guestGuide,
  theme,
  ts,
  cardBg,
  cardBorder,
  cardBorderRadius,
  isPreview = false,
}: GuestGuideSectionProps) {
  const effectiveCardBg = cardBg || theme.cardBg;
  const effectiveCardBorder = cardBorder || theme.cardBorder;
  return (
    <>
      {/* 2-column grid of items */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        variants={staggerContainer}
        initial="hidden"
        {...(isPreview
          ? { animate: "visible" }
          : {
              whileInView: "visible",
              viewport: { once: false, margin: "-40px" },
            })}
      >
        {guestGuide.items.map((item) => (
          <GuideItemCard
            key={item.id}
            item={item}
            theme={theme}
            ts={ts}
            cardBg={effectiveCardBg}
            cardBorder={effectiveCardBorder}
            cardBorderRadius={cardBorderRadius}
            isPreview={isPreview}
          />
        ))}
      </motion.div>
    </>
  );
}
