"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  generateGlitterTexture,
  GOLDEN_GLITTER_PALETTE,
  loadImage,
} from "@/lib/scratch-texture";

interface ScratchCoinProps {
  /**
   * Outer square size in CSS pixels. Default 140.
   * Ignored when `fillParent` is true (the coin sizes itself to the parent).
   */
  size?: number;
  /**
   * When true, the coin fills its parent's bounding box (parent must set
   * width and height). The component measures the parent on mount and on
   * resize and re-paints the canvas at the new size.
   */
  fillParent?: boolean;
  /** Content rendered behind the coin, revealed as the user scratches. */
  revealedContent: ReactNode;
  /** Brush radius in CSS pixels. Default 28. */
  brushRadius?: number;
  /** Fraction (0-1) of the coin that must be scratched before auto-reveal. Default 0.5. */
  revealThreshold?: number;
  onRevealed?: () => void;
  /**
   * Glitter palette used to generate the procedural texture. Defaults to
   * the same palette ScratchHeart uses (`GOLDEN_GLITTER_PALETTE`) so the
   * coin and heart materials are visually consistent.
   */
  glitterColors?: string[];
  /**
   * Optional URL of a real glitter texture image. If loading fails, the
   * coin falls back to the procedural texture.
   */
  textureUrl?: string;
  ariaLabel?: string;
  className?: string;
}

const SAMPLE_INTERVAL = 8;

/**
 * A round canvas-scratch surface with a glitter material identical to the
 * save-the-date `ScratchHeart`. Renders the procedural glitter texture
 * (or an optional real image) clipped to a circle, lit with a soft
 * specular highlight, and given depth via an SVG inner shadow ring.
 *
 * Keyboard fallback: focusable; Enter or Space immediately reveals.
 * Reduced-motion: clears the canvas instantly instead of fading.
 */
export default function ScratchCoin({
  size: sizeProp = 140,
  fillParent = false,
  revealedContent,
  brushRadius = 28,
  revealThreshold = 0.5,
  onRevealed,
  glitterColors = GOLDEN_GLITTER_PALETTE,
  textureUrl,
  ariaLabel = "Scratch to reveal",
  className,
}: ScratchCoinProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isScratching = useRef(false);
  const scratchCount = useRef(0);
  const revealedRef = useRef(false);
  const [revealed, setRevealed] = useState(false);
  const [measuredSize, setMeasuredSize] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  // Unique filter id per instance so multiple coins on a page don't collide
  // when their inner-shadow filters are referenced via `url(#...)`.
  const reactId = useId();
  const innerShadowFilterId = `coin-inner-shadow-${reactId.replace(/:/g, "")}`;

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const size = fillParent ? (measuredSize ?? sizeProp) : sizeProp;
  const cw = size * dpr;
  const ch = size * dpr;

  // Measure the wrapper when fillParent is on (and re-measure on resize).
  useEffect(() => {
    if (!fillParent) return;
    const el = wrapperRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const next = Math.max(20, Math.min(rect.width, rect.height));
      setMeasuredSize((prev) =>
        prev !== null && Math.abs(prev - next) < 1 ? prev : next,
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fillParent]);

  /**
   * Paints the coin: clip to a circle, draw the glitter texture, then add
   * a soft specular highlight on top. The rim/inner-shadow is rendered as
   * an SVG sibling so we can avoid any black strokes on the canvas itself.
   */
  const drawCoin = useCallback(
    (texture: HTMLCanvasElement | HTMLImageElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = cw;
      canvas.height = ch;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const cx = cw / 2;
      const cy = ch / 2;
      const r = Math.min(cw, ch) / 2;

      // Clip to circle so the texture stays within the coin
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      // 1. Glitter texture (same procedural material as ScratchHeart).
      ctx.drawImage(texture, 0, 0, cw, ch);

      // 2. Soft specular highlight — single bright bloom up and to the left
      //    so the coin reads as polished metal catching light.
      const specGrad = ctx.createRadialGradient(
        cx - r * 0.3,
        cy - r * 0.35,
        0,
        cx - r * 0.3,
        cy - r * 0.35,
        r * 0.7,
      );
      specGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
      specGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.15)");
      specGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = specGrad;
      ctx.fillRect(0, 0, cw, ch);

      ctx.restore();
    },
    [cw, ch, size],
  );

  // Initialize: build (or load) the texture, then paint the coin.
  useEffect(() => {
    if (cw === 0 || ch === 0) return;
    let cancelled = false;
    const paint = (texture: HTMLCanvasElement | HTMLImageElement) => {
      if (cancelled) return;
      drawCoin(texture);
    };
    if (textureUrl) {
      loadImage(textureUrl)
        .then(paint)
        .catch(() => paint(generateGlitterTexture(cw, ch, glitterColors)));
    } else {
      paint(generateGlitterTexture(cw, ch, glitterColors));
    }
    return () => {
      cancelled = true;
    };
    // glitterColors identity is stable in normal usage; we intentionally
    // depend on the array reference so callers can pass a memoized palette.
  }, [cw, ch, drawCoin, textureUrl, glitterColors]);

  const fireReveal = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setRevealed(true);
    const canvas = canvasRef.current;
    if (canvas) {
      if (reduceMotion) {
        canvas.style.opacity = "0";
      } else {
        canvas.style.transition = "opacity 0.3s ease-out";
        canvas.style.opacity = "0";
      }
    }
    onRevealed?.();
  }, [onRevealed, reduceMotion]);

  const checkReveal = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealedRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, cw, ch).data;

    let sampled = 0;
    let visible = 0;
    // Sample every 8th pixel's alpha for performance
    for (let i = 3; i < data.length; i += 32) {
      sampled++;
      if (data[i] > 10) visible++;
    }
    // Coin covers ~78.5% of the bounding square (πr² / (2r)² = π/4)
    const coinCoverage = Math.PI / 4;
    const originalCoinSamples = sampled * coinCoverage;
    const scratched =
      originalCoinSamples > 0 ? 1 - visible / originalCoinSamples : 0;
    if (scratched >= revealThreshold) fireReveal();
  }, [cw, ch, revealThreshold, fireReveal]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    };
  };

  const scratchAt = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas || revealedRef.current) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const r = brushRadius * dpr;

      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(0.7, "rgba(0,0,0,1)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      scratchCount.current++;
      if (scratchCount.current % SAMPLE_INTERVAL === 0) {
        checkReveal();
      }
    },
    [brushRadius, dpr, checkReveal],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isScratching.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = getPos(e);
    scratchAt(x, y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isScratching.current || revealedRef.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    scratchAt(x, y);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isScratching.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    checkReveal();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fireReveal();
    }
  };

  const wrapperStyle: React.CSSProperties = fillParent
    ? { width: "100%", height: "100%" }
    : { width: size, height: size };

  return (
    <motion.div
      ref={wrapperRef}
      className={`relative ${fillParent ? "block" : "inline-block"} ${className ?? ""}`}
      style={wrapperStyle}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      animate={
        !revealed && !reduceMotion ? { scale: [1, 1.03, 1] } : undefined
      }
      transition={
        !revealed && !reduceMotion
          ? { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
          : undefined
      }
    >
      {/* Post-reveal plate: a subtle grey filled circle with a thin ring.
          Sits behind the revealed content and fades in once the coin is
          scratched off, giving the date/text a quiet surface to live on. */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: "rgba(0, 0, 0, 0.04)",
          boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.08)",
          opacity: revealed ? 1 : 0,
          transition: reduceMotion ? "none" : "opacity 0.35s ease-out",
        }}
      />

      {/* Revealed content (sits behind the canvas) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {revealedContent}
      </div>

      {/* SVG inner-shadow overlay — same trick as ScratchHeart, masked to a
          circle. Adds depth at the rim without painting any visible black
          strokes onto the gold material. Hidden after the reveal. */}
      {!revealed && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <filter
              id={innerShadowFilterId}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feComponentTransfer in="SourceAlpha">
                <feFuncA type="table" tableValues="1 0" />
              </feComponentTransfer>
              <feGaussianBlur stdDeviation="3" />
              <feOffset dx="0" dy="0.6" result="offsetblur" />
              <feFlood floodColor="rgba(50,50,50,0.22)" result="color" />
              <feComposite in2="offsetblur" operator="in" />
              <feComposite in2="SourceAlpha" operator="in" />
            </filter>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="50"
            fill="black"
            filter={`url(#${innerShadowFilterId})`}
          />
        </svg>
      )}

      {/* Coin canvas (scratch surface). Hidden until we have a measured size
          when fillParent is on (avoids a brief 0-sized paint). */}
      {(!fillParent || measuredSize !== null) && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 touch-none"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            cursor: revealed ? "default" : "pointer",
            // Soft drop-shadow so the coin reads as a 3D object on the page
            filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.18))",
            // After the coin is scratched the canvas fades to opacity 0 but
            // stays in the DOM (so its lazy paint/teardown doesn't cause a
            // flicker). Turning off pointer events lets the revealed content
            // below (including any EditableText inside it) receive clicks.
            pointerEvents: revealed ? "none" : undefined,
          }}
          onPointerDown={revealed ? undefined : onPointerDown}
          onPointerMove={revealed ? undefined : onPointerMove}
          onPointerUp={revealed ? undefined : onPointerUp}
          onPointerCancel={revealed ? undefined : onPointerUp}
        />
      )}
    </motion.div>
  );
}
