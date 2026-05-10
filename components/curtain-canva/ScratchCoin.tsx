"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";

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
  baseColor?: string;
  accentColor?: string;
  ariaLabel?: string;
  className?: string;
}

const SAMPLE_INTERVAL = 8;

/**
 * Lighten or darken a hex/rgb color by `percent` (-100 → 100).
 * Returns an `rgb()` string. Falls back to the input if parsing fails.
 */
function shadeColor(input: string, percent: number): string {
  const trim = input.trim();
  let r: number, g: number, b: number;
  const hex = trim.startsWith("#") ? trim.slice(1) : null;
  if (hex && (hex.length === 3 || hex.length === 6)) {
    const expanded =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    r = parseInt(expanded.slice(0, 2), 16);
    g = parseInt(expanded.slice(2, 4), 16);
    b = parseInt(expanded.slice(4, 6), 16);
  } else {
    const m = trim.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (!m) return input;
    r = parseInt(m[1], 10);
    g = parseInt(m[2], 10);
    b = parseInt(m[3], 10);
  }
  const factor = 1 + percent / 100;
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `rgb(${clamp(r * factor)}, ${clamp(g * factor)}, ${clamp(b * factor)})`;
}

/**
 * A round canvas-scratch surface. Generalized from the existing ScratchHeart.
 * Generates a brushed-gold coin via radial gradient + sparkle dots, then lets
 * the user scratch it off to reveal `revealedContent` underneath.
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
  baseColor = "#C9A961",
  accentColor = "#F4E4A1",
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

  const drawCoin = useCallback(() => {
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

    // Clip to circle so all paint stays within the coin
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // 1. Base radial fill: lighter near top-left specular spot, deeper at the edge
    const baseGrad = ctx.createRadialGradient(
      cx - r * 0.35,
      cy - r * 0.4,
      r * 0.05,
      cx,
      cy,
      r * 1.05,
    );
    baseGrad.addColorStop(0, accentColor);
    baseGrad.addColorStop(0.55, baseColor);
    // Rim shade — only mildly darker than the base, so the coin reads as
    // a polished gold disc rather than a shadowed olive token.
    baseGrad.addColorStop(1, shadeColor(baseColor, -10));
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, cw, ch);

    // 2. Brushed-metal concentric striations — short radial lines emanating
    //    from the center, drawn at varying alphas to simulate spun metal.
    //    The light striations dominate; the dark ones are kept very subtle
    //    so they don't darken the overall hue.
    ctx.save();
    ctx.translate(cx, cy);
    const totalStrokes = 220;
    for (let i = 0; i < totalStrokes; i++) {
      const angle = (i / totalStrokes) * Math.PI * 2;
      const innerR = r * 0.08;
      const outerR = r * 0.96;
      const alpha = 0.06 + Math.random() * 0.1;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      ctx.stroke();
    }
    // Darker striations interleaved for depth — kept faint.
    for (let i = 0; i < totalStrokes / 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const innerR = r * 0.1;
      const outerR = r * (0.8 + Math.random() * 0.18);
      const alpha = 0.02 + Math.random() * 0.04;
      ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Soft specular highlight (top-left)
    const specGrad = ctx.createRadialGradient(
      cx - r * 0.35,
      cy - r * 0.45,
      0,
      cx - r * 0.35,
      cy - r * 0.45,
      r * 0.6,
    );
    specGrad.addColorStop(0, "rgba(255, 255, 255, 0.7)");
    specGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.25)");
    specGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = specGrad;
    ctx.fillRect(0, 0, cw, ch);

    // 4. Edge vignette — gentler than before so the rim doesn't read as
    //    a heavy black ring on light page backgrounds.
    const vignette = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.16)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, cw, ch);

    // 5. Inner ring just inside the perimeter for definition. Subtler than
    //    before so the overall coin stays bright.
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = Math.max(1, r * 0.02);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.95, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }, [cw, ch, size, baseColor, accentColor, dpr]);

  // Initialize the coin painting after the canvas mounts.
  useEffect(() => {
    drawCoin();
  }, [drawCoin]);

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
