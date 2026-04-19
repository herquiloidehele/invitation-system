"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  traceHeartPath,
  loadImage,
  generateGlitterTexture,
} from "./GlitterEffect";

interface ScratchHeartProps {
  width: number;
  height: number;
  heartColor: string;
  glitterColors: string[];
  textureUrl?: string; // optional real glitter texture image
  onReveal: () => void;
  children: React.ReactNode;
}

const SCRATCH_RADIUS = 26;
const REVEAL_THRESHOLD = 0.50;
const SAMPLE_INTERVAL = 6;

/**
 * CSS clip-path for the heart shape (matches our SVG heart path).
 * Used for the shimmer overlay and the content clip.
 */
const HEART_CLIP_PATH =
  "path('M 50 88 C 25 70, 0 50, 0 30 C 0 12, 12 0, 27 0 C 37 0, 45 6, 50 18 C 55 6, 63 0, 73 0 C 88 0, 100 12, 100 30 C 100 50, 75 70, 50 88 Z')";

export default function ScratchHeart({
  width,
  height,
  heartColor,
  glitterColors,
  textureUrl,
  onReveal,
  children,
}: ScratchHeartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartPathRef = useRef<Path2D | null>(null);
  const textureRef = useRef<HTMLCanvasElement | HTMLImageElement | null>(null);
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isScratching = useRef(false);
  const scratchCount = useRef(0);
  const revealedRef = useRef(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2;
  const cw = width * dpr;
  const ch = height * dpr;

  // Create scratch tracking canvas
  useEffect(() => {
    const sc = document.createElement("canvas");
    sc.width = cw;
    sc.height = ch;
    scratchCanvasRef.current = sc;
  }, [cw, ch]);

  // Initialize: load texture, draw heart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = cw;
    canvas.height = ch;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d")!;
    const heartPath = traceHeartPath(ctx, cw, ch);
    heartPathRef.current = heartPath;

    const drawHeart = (texture: HTMLCanvasElement | HTMLImageElement) => {
      textureRef.current = texture;
      ctx.save();
      ctx.clip(heartPath);
      // Draw the texture to fill the heart
      ctx.drawImage(texture, 0, 0, cw, ch);
      ctx.restore();
      setCanvasReady(true);
    };

    if (textureUrl) {
      loadImage(textureUrl).then(drawHeart).catch(() => {
        // Fallback to procedural
        drawHeart(generateGlitterTexture(cw, ch, glitterColors));
      });
    } else {
      drawHeart(generateGlitterTexture(cw, ch, glitterColors));
    }
  }, [cw, ch, width, height, textureUrl, glitterColors, heartColor]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const texture = textureRef.current;
    const heartPath = heartPathRef.current;
    const sc = scratchCanvasRef.current;
    if (!canvas || !texture || !heartPath) return;

    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, cw, ch);

    // Draw textured heart
    ctx.save();
    ctx.clip(heartPath);
    ctx.drawImage(texture, 0, 0, cw, ch);
    ctx.restore();

    // Cut out scratched areas
    if (sc) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.drawImage(sc, 0, 0);
      ctx.globalCompositeOperation = "source-over";
    }
  }, [cw, ch]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * dpr,
      y: (clientY - rect.top) * dpr,
    };
  };

  const scratch = useCallback(
    (x: number, y: number) => {
      const sc = scratchCanvasRef.current;
      if (!sc || revealedRef.current) return;
      const ctx = sc.getContext("2d")!;
      const r = SCRATCH_RADIUS * dpr;

      // Draw a soft-edged scratch circle
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.7, "rgba(255,255,255,1)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      redraw();

      scratchCount.current++;
      if (scratchCount.current % SAMPLE_INTERVAL === 0) {
        checkReveal();
      }
    },
    [dpr, redraw]
  );

  const checkReveal = () => {
    const canvas = canvasRef.current;
    if (!canvas || revealedRef.current) return;

    const ctx = canvas.getContext("2d")!;
    const data = ctx.getImageData(0, 0, cw, ch).data;

    // Count non-transparent pixels remaining in the heart area
    let totalPixels = 0;
    let visiblePixels = 0;

    // Sample every 8th pixel for performance
    for (let i = 3; i < data.length; i += 32) {
      totalPixels++;
      if (data[i] > 10) {
        visiblePixels++;
      }
    }

    // The heart covers roughly 60-65% of the bounding box
    // So we check what fraction of original heart pixels remain
    const heartCoverage = 0.62;
    const originalHeartPixels = totalPixels * heartCoverage;
    const scratchedRatio =
      originalHeartPixels > 0
        ? 1 - visiblePixels / originalHeartPixels
        : 0;

    if (scratchedRatio >= REVEAL_THRESHOLD) {
      revealedRef.current = true;
      setRevealed(true);

      // Animate the canvas fade out
      const c = canvasRef.current;
      if (c) {
        c.style.transition = "opacity 0.8s ease-out";
        c.style.opacity = "0";
      }
      onReveal();
    }
  };

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    isScratching.current = true;
    const pos = getPos(e);
    scratch(pos.x, pos.y);
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isScratching.current || revealedRef.current) return;
    e.preventDefault();
    const pos = getPos(e);
    scratch(pos.x, pos.y);
  };

  const handleEnd = () => {
    isScratching.current = false;
  };

  // Scale the clip-path percentages for CSS
  const clipPathStyle = `path('M ${width * 0.5} ${height * 0.88} C ${width * 0.25} ${height * 0.7}, 0 ${height * 0.5}, 0 ${height * 0.3} C 0 ${height * 0.12}, ${width * 0.12} 0, ${width * 0.27} 0 C ${width * 0.37} 0, ${width * 0.45} ${height * 0.06}, ${width * 0.5} ${height * 0.18} C ${width * 0.55} ${height * 0.06}, ${width * 0.63} 0, ${width * 0.73} 0 C ${width * 0.88} 0, ${width} ${height * 0.12}, ${width} ${height * 0.3} C ${width} ${height * 0.5}, ${width * 0.75} ${height * 0.7}, ${width * 0.5} ${height * 0.88} Z')`;

  return (
    <motion.div
      className="relative"
      style={{ width, height }}
      animate={
        canvasReady && !revealed
          ? { scale: [1, 1.02, 1] }
          : undefined
      }
      transition={
        canvasReady && !revealed
          ? { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
          : undefined
      }
    >
      {/* Bottom layer: content to reveal (clipped to heart shape) */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          width,
          height,
          clipPath: clipPathStyle,
        }}
      >
        {children}
      </div>

      {/* Scratchable glitter heart canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 touch-none"
        style={{ width, height, cursor: "pointer" }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />

      {/* Shimmer overlay — CSS animated gradient sweeping over the heart */}
      {canvasReady && !revealed && (
        <div
          className="pointer-events-none absolute inset-0 z-20 animate-shimmer"
          style={{
            clipPath: clipPathStyle,
            background:
              "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
          }}
        />
      )}
    </motion.div>
  );
}
