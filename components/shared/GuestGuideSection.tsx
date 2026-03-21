"use client";

import { motion } from "framer-motion";
import {
  BellOff,
  Cake,
  Camera,
  Car,
  CheckCircle2,
  Church,
  Clock,
  Coffee,
  Flower,
  Heart,
  HeartHandshake,
  MapPin,
  MessageCircleOff,
  Moon,
  Music,
  PartyPopper,
  Phone,
  Smile,
  Sparkles,
  Star,
  Sun,
  UserX,
  Utensils,
  Wine,
  type LucideProps,
} from "lucide-react";

import type { GuestGuide, GuestGuideItem, TemplateTheme } from "@/lib/types";

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
// Icon map — all icons available for guest-guide items
// ---------------------------------------------------------------------------

type LucideComponent = React.ComponentType<LucideProps>;

const ICON_MAP: Record<string, LucideComponent> = {
  BellOff,
  Cake,
  Camera,
  Car,
  CheckCircle2,
  Church,
  Clock,
  Coffee,
  Flower,
  FlowerOff: Flower, // backwards-compat alias
  Heart,
  HeartHandshake,
  MapPin,
  MessageCircleOff,
  Moon,
  Music,
  PartyPopper,
  Phone,
  Smile,
  Sparkles,
  Star,
  Sun,
  UserX,
  Utensils,
  Wine,
};

// ---------------------------------------------------------------------------
// GuideIcon — renders either a Lucide icon or a custom image
// ---------------------------------------------------------------------------

interface GuideIconProps {
  item: GuestGuideItem;
  size: number;
  color: string;
}

function GuideIcon({ item, size, color }: GuideIconProps) {
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

  const IconComp = item.iconName ? ICON_MAP[item.iconName] : undefined;
  if (IconComp) {
    return <IconComp size={size} color={color} strokeWidth={1.5} />;
  }

  return <Star size={size} color={color} strokeWidth={1.5} />;
}

// ---------------------------------------------------------------------------
// GuestGuideItem card
// ---------------------------------------------------------------------------

interface GuideItemCardProps {
  item: GuestGuideItem;
  theme: TemplateTheme;
  isPreview?: boolean;
}

function GuideItemCard({ item, theme, isPreview = false }: GuideItemCardProps) {
  return (
    <motion.div
      {...(isPreview
        ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
        : { variants: fadeInUp })}
      className="flex flex-col items-center gap-2 text-center"
      style={{
        background: theme.cardBg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 14,
        padding: "18px 12px",
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.03)",
      }}
    >
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ width: 48, height: 48, background: `${theme.accent}14` }}
      >
        <GuideIcon item={item} size={22} color={theme.accent} />
      </div>

      <span
        style={{
          fontFamily: theme.bodyFont,
          fontSize: 12,
          fontWeight: 500,
          color: theme.textPrimary,
          lineHeight: 1.4,
        }}
      >
        {item.label}
      </span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// GuestGuideSection — the full invitation-page section
// ---------------------------------------------------------------------------

interface GuestGuideSectionProps {
  guestGuide: GuestGuide;
  theme: TemplateTheme;
  /** When true, all animations use `animate` instead of `whileInView` so
   *  the section is always fully visible (no scroll-trigger dependency).
   *  Use this in the admin live preview. */
  isPreview?: boolean;
}

export default function GuestGuideSection({
  guestGuide,
  theme,
  isPreview = false,
}: GuestGuideSectionProps) {
  return (
    <>
      {/* Section header */}
      <div className="flex flex-col items-center mb-6">
        <span
          style={{
            fontFamily: theme.uiFont,
            fontSize: 10,
            fontWeight: 400,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: theme.textSecondary,
          }}
        >
          Manual do
        </span>
        <span
          style={{
            fontFamily: theme.scriptFont ?? theme.displayFont,
            fontSize: 28,
            color: theme.primary,
            lineHeight: 1.2,
            marginTop: 2,
          }}
        >
          Bom Convidado
        </span>

        <motion.div
          className="flex items-center gap-2 mt-3"
          initial={{ opacity: 0, scaleX: 0 }}
          {...(isPreview
            ? { animate: { opacity: 1, scaleX: 1 } }
            : {
                whileInView: { opacity: 1, scaleX: 1 },
                viewport: { once: true },
              })}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div
            style={{ width: 28, height: 1, background: theme.decorativeColor }}
          />
          <Heart
            size={10}
            color={theme.accent}
            fill={theme.accent}
            strokeWidth={0}
          />
          <div
            style={{ width: 28, height: 1, background: theme.decorativeColor }}
          />
        </motion.div>
      </div>

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
            isPreview={isPreview}
          />
        ))}
      </motion.div>
    </>
  );
}
