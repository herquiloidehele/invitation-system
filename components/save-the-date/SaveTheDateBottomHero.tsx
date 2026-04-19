"use client";

import { motion, type Variants } from "framer-motion";
import type { BottomHeroConfig, SaveTheDateThemeData } from "@/lib/save-the-date";
import type { TextStyleOverrides } from "@/lib/types";
import { EditableText } from "@/components/shared/EditableText";

interface SaveTheDateBottomHeroProps {
  config: BottomHeroConfig;
  theme: SaveTheDateThemeData;
  textStyles?: TextStyleOverrides | null;
  isPreview?: boolean;
}

const textContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.15 } },
};

const textItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

export default function SaveTheDateBottomHero({
  config,
  theme,
  textStyles,
  isPreview,
}: SaveTheDateBottomHeroProps) {
  const isVideo = config.mediaType === "video";
  const titleOverride = textStyles?.elements?.stdBottomHeroTitle;
  const descOverride = textStyles?.elements?.stdBottomHeroDescription;

  return (
    <section className="relative h-dvh w-full overflow-hidden">
      {/* Media background */}
      {isVideo ? (
        <video
          src={config.mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <img
          src={config.mediaUrl}
          alt={config.title || ""}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Top gradient fade — blends into page background */}
      <div
        className="absolute inset-x-0 top-0 z-[1] h-64 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, ${theme.bgColor} 0%, ${theme.bgColor}E6 25%, ${theme.bgColor}80 50%, transparent 100%)`,
        }}
      />

      {/* Dark scrim */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Text overlay */}
      <motion.div
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
        variants={textContainer}
        initial="hidden"
        {...(isPreview
          ? { animate: "visible" }
          : { whileInView: "visible", viewport: { once: true, margin: "-80px" } }
        )}
      >
        {config.title && (
          <motion.h2
            variants={textItem}
            className="text-3xl font-light tracking-[0.12em] uppercase sm:text-4xl md:text-5xl"
            style={{
              fontFamily: titleOverride?.fontFamily ?? theme.coupleFont,
              color: titleOverride?.color ?? "#FFFFFF",
              ...(titleOverride?.fontSize ? { fontSize: titleOverride.fontSize } : {}),
              ...(titleOverride?.fontWeight ? { fontWeight: titleOverride.fontWeight } : {}),
              ...(titleOverride?.letterSpacing ? { letterSpacing: titleOverride.letterSpacing } : {}),
            }}
          >
            <EditableText elementKey="stdBottomHeroTitle">
              {config.title}
            </EditableText>
          </motion.h2>
        )}
        {config.description && (
          <motion.p
            variants={textItem}
            className="mt-4 max-w-lg text-base font-light leading-relaxed sm:text-lg"
            style={{
              fontFamily: descOverride?.fontFamily ?? theme.coupleFont,
              color: descOverride?.color ?? "rgba(255,255,255,0.85)",
              ...(descOverride?.fontSize ? { fontSize: descOverride.fontSize } : {}),
              ...(descOverride?.fontWeight ? { fontWeight: descOverride.fontWeight } : {}),
              ...(descOverride?.letterSpacing ? { letterSpacing: descOverride.letterSpacing } : {}),
            }}
          >
            <EditableText elementKey="stdBottomHeroDescription">
              {config.description}
            </EditableText>
          </motion.p>
        )}
      </motion.div>
    </section>
  );
}
