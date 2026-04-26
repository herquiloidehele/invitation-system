"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import type { ImageSettingsMap, TemplateTheme } from "@/lib/types";
import { getImageStyle } from "@/lib/image-settings";
import { getCoverBackgroundStyle } from "@/lib/envelope-cover-background";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EnvelopeCoverProps {
  theme: TemplateTheme;
  onOpen: () => void;
  onAnimationComplete?: () => void;
  /** Enable the diagonal shimmer highlight animation. Defaults to true. */
  shimmer?: boolean;
  /** Color or image URL used as the full envelope cover background. */
  coverBackground?: string;
  monogram?: string;
  /** Per-image position & zoom overrides map. */
  imageSettings?: ImageSettingsMap;
  /** Optional hex color used to recolor the top flap image silhouette. */
  topFlapTintColor?: string;
  /** Optional hex color used to recolor the bottom flap image silhouette. */
  bottomFlapTintColor?: string;
}

/* ------------------------------------------------------------------ */
/*  Timing constants (seconds)                                         */
/*  Slow cinematic feel ~5 s. Simplified without side-flaps / letter.  */
/* ------------------------------------------------------------------ */

const T = {
  /** Top flap swings open (3D rotation) */
  flapOpen: { dur: 5, del: 0 },
  bottomFlap: { dur: 15, del: 0 },
  sceneFade: { dur: 2, del: 2 },
} as const;

/** Milliseconds from tap until onAnimationComplete fires */
const TOTAL_MS = T.flapOpen.dur * 1000;

/** Smooth ease-out bezier for a natural, gentle deceleration */
const TOP_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const BOTTOM_EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];

/** Stop the flap around a natural mid-open position instead of fully flipping. */
const TOP_FLAP_OPEN_ANGLE = 40;
const TOP_FLAP_PERSPECTIVE = 1300;

function topFlapTransform(
  rotateX: number,
  yPercent = 0,
  zPx = 0,
  ty = "0px",
): string {
  return `perspective(${TOP_FLAP_PERSPECTIVE}px) translate3d(0, ${yPercent}%, ${zPx}px) rotateX(${rotateX}deg) translateY(${ty})`;
}

function topFlapShadowTransform(yPercent = 0, scaleX = 1, scaleY = 1): string {
  return `translate3d(0, ${yPercent}%, 0) scale(${scaleX}, ${scaleY})`;
}

function isValidHex(value: string | undefined): value is string {
  return !!value && /^#[0-9a-fA-F]{6}$/.test(value);
}

/* ------------------------------------------------------------------ */
/*  Envelope body (the back panel visible behind the flaps)            */
/* ------------------------------------------------------------------ */

function EnvelopeBody({ style }: { style: React.CSSProperties }) {
  return <div className="absolute inset-0" style={style} />;
}

/* ------------------------------------------------------------------ */
/*  Flap components                                                    */
/* ------------------------------------------------------------------ */

/**
 * Build the inline style for a tint overlay element. The overlay is a solid
 * colored block, mask-clipped to the image's alpha channel so the color only
 * paints where the flap is opaque, then blended over the underlying <Image>
 * via `mix-blend-mode`. This preserves all internal texture, shading and
 * folds of the source image while shifting its hue.
 *
 * `multiply` is used because it darkens-with-color: white pixels in the
 * source pass through unchanged, mid-tones pick up the tint, and shadows
 * stay dark. This matches how dye/ink visually "paints" paper and is the
 * correct choice for tinting a printed-paper-style asset.
 */
function flapTintOverlayStyle(
  src: string,
  tintColor: string | undefined,
  imgStyle?: React.CSSProperties,
): React.CSSProperties | null {
  if (!tintColor) return null;
  const objectPosition =
    typeof imgStyle?.objectPosition === "string"
      ? imgStyle.objectPosition
      : "center bottom";
  return {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundColor: tintColor,
    // Use the flap image as an alpha mask so the color is clipped to the
    // exact silhouette of the flap (no spill into transparent areas).
    WebkitMaskImage: `url("${src}")`,
    maskImage: `url("${src}")`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "cover",
    maskSize: "cover",
    WebkitMaskPosition: objectPosition,
    maskPosition: objectPosition,
    // For raster images (PNG/WebP) the default mask-mode is `match-source`
    // which uses the image's alpha channel — exactly what we want. We don't
    // set `maskMode: "alpha"` explicitly because the prefixed Webkit version
    // is missing from React's CSSProperties typings, and the default already
    // does the right thing.
    // Blend the color onto the underlying <Image> rather than covering it.
    mixBlendMode: "multiply",
    backfaceVisibility: "hidden",
    transform: "translateZ(0)",
  };
}

function TopFlap({
  opening,
  image,
  imgStyle,
  tintColor,
}: {
  opening: boolean;
  image: string;
  imgStyle?: React.CSSProperties;
  /** Hex color used to paint the flap while preserving its texture. */
  tintColor?: string;
}) {
  const overlayStyle = flapTintOverlayStyle(image, tintColor, imgStyle);
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="absolute top-0 left-0 w-full pointer-events-none"
        style={{
          zIndex: 19,
          transformOrigin: "top center",
          willChange: "transform, opacity",
          opacity: 0,
          height: "calc(50% + 10vh)",
        }}
        initial={{
          opacity: 0,
          transform: topFlapShadowTransform(0, 1, 1),
        }}
        animate={
          opening
            ? {
                opacity: 1,
                transform: topFlapShadowTransform(18, 1, 1),
              }
            : {
                opacity: 0,
                transform: topFlapShadowTransform(0, 1, 1),
              }
        }
        transition={{
          duration: T.flapOpen.dur,
          delay: T.flapOpen.del,
          ease: TOP_EASE,
        }}
      >
        <Image
          src={image}
          width={500}
          height={500}
          alt=""
          className="w-full h-full object-cover object-bottom"
          style={{
            filter: "brightness(0) blur(28px)",
            opacity: 0.75,
            transform: "translateZ(0)",
            height: "calc(100%)",
            width: "100vw",
            ...imgStyle,
          }}
        />
      </motion.div>

      <motion.div
        className="absolute top-0 left-0 w-full"
        style={{
          zIndex: 20,
          transformOrigin: "top center",
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
          willChange: "transform",
          height: "calc(50% + 13vh)",
          // `isolate` creates a new stacking context so the mix-blend-mode
          // overlay only blends with the flap image beneath it, not with the
          // envelope body / cover background behind the whole flap.
          isolation: "isolate",
        }}
        initial={{
          transform: topFlapTransform(0),
        }}
        animate={
          opening
            ? {
                transform: topFlapTransform(
                  TOP_FLAP_OPEN_ANGLE,
                  -2,
                  24,
                  "-30px",
                ),
              }
            : {
                transform: topFlapTransform(0),
              }
        }
        transition={{
          duration: T.flapOpen.dur,
          delay: T.flapOpen.del,
          ease: TOP_EASE,
        }}
      >
        <Image
          src={image}
          width={500}
          height={500}
          alt={"Top Envelop Flap"}
          className={"w-full h-full object-cover object-bottom"}
          style={{
            backfaceVisibility: "hidden",
            transform: "translateZ(0)",
            ...imgStyle,
          }}
        />
        {overlayStyle && <div aria-hidden="true" style={overlayStyle} />}
      </motion.div>
    </>
  );
}

function BottomFlap({
  opening,
  image,
  imgStyle,
  tintColor,
}: {
  opening: boolean;
  image: string;
  imgStyle?: React.CSSProperties;
  /** Hex color used to paint the flap while preserving its texture. */
  tintColor?: string;
}) {
  const overlayBase = flapTintOverlayStyle(image, tintColor, {
    ...imgStyle,
    objectPosition:
      typeof imgStyle?.objectPosition === "string"
        ? imgStyle.objectPosition
        : "center top",
  });
  // The bottom-flap image is rendered with extra height (calc(100% + 10vh)),
  // so the overlay needs to match that height (not just `inset: 0`) to align
  // with the underlying <Image>.
  const overlayStyle: React.CSSProperties | null = overlayBase
    ? { ...overlayBase, height: "calc(100% + 10vh)", inset: "auto 0 0 0" }
    : null;
  return (
    <motion.div
      className="absolute bottom-0 left-0 w-full origin-top flex items-end"
      style={{
        height: "calc(50% + 10vh)",
        // Same isolation trick as TopFlap: the overlay should only blend
        // with the flap image, not with content behind the envelope.
        isolation: "isolate",
        position: "absolute",
      }}
      initial={{
        bottom: 0,
      }}
      animate={{
        bottom: opening ? "-8.5%" : 0,
      }}
      transition={{
        duration: T.bottomFlap.dur,
        delay: T.bottomFlap.del,
        ease: BOTTOM_EASE,
      }}
    >
      <Image
        src={image}
        width={500}
        height={500}
        alt={"Top Envelop Flap"}
        className={"w-full h-full object-cover object-top"}
        style={{
          height: "calc(100% + 10vh)",
          ...imgStyle,
        }}
      />
      {overlayStyle && <div aria-hidden="true" style={overlayStyle} />}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function EnvelopeCover({
  theme,
  onOpen,
  onAnimationComplete,
  shimmer = true,
  coverBackground,
  imageSettings,
  topFlapTintColor,
  bottomFlapTintColor,
}: EnvelopeCoverProps) {
  const [opening, setOpening] = useState(false);

  const handleTap = useCallback(() => {
    if (opening) return;
    setOpening(true);
    onOpen();
    if (onAnimationComplete) {
      setTimeout(onAnimationComplete, TOTAL_MS);
    }
  }, [opening, onOpen, onAnimationComplete]);

  const topFlapStyle = getImageStyle(imageSettings, "envelopeTopFlap");
  const bottomFlapStyle = getImageStyle(imageSettings, "envelopeBottomFlap");
  const coverBackgroundStyle = getCoverBackgroundStyle(
    coverBackground,
    theme.envelope.base,
  );

  // Validate hex tints — only pass through well-formed colors so a malformed
  // override can't break the render.
  const validTop = isValidHex(topFlapTintColor) ? topFlapTintColor : undefined;
  const validBottom = isValidHex(bottomFlapTintColor)
    ? bottomFlapTintColor
    : undefined;

  return (
    <motion.div
      className="absolute inset-0 z-[100] cursor-pointer overflow-hidden"
      style={{
        ...coverBackgroundStyle,
        transformStyle: "preserve-3d",
      }}
      onClick={handleTap}
      /* Exit animation: fast fade-out so there's no gap before the invitation */
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <EnvelopeBody style={coverBackgroundStyle} />

      {/* Shimmer highlight — diagonal sweep across envelope */}
      {shimmer && !opening && (
        <motion.div
          className="absolute inset-0 z-[6] pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 55%, transparent 60%)",
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        />
      )}

      <TopFlap
        opening={opening}
        image={theme.envelope.topFlap}
        imgStyle={topFlapStyle}
        tintColor={validTop}
      />

      <BottomFlap
        opening={opening}
        image={theme.envelope.bottomFlap}
        imgStyle={bottomFlapStyle}
        tintColor={validBottom}
      />

      {/* Slow opacity fade covering the last phase of the animation.
          This is the actual "scene fade" — it makes the envelope gradually
          become transparent, revealing the invitation page behind it. */}
      {opening && (
        <motion.div
          className="absolute inset-0 z-40"
          style={{ backgroundColor: theme.bg }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: T.sceneFade.dur,
            delay: T.sceneFade.del,
            ease: "easeIn",
          }}
        />
      )}
    </motion.div>
  );
}
