"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import GalleryPhoto from "../GalleryPhoto";
import type { GalleryStyleProps } from "../types";

/** Matches the Ken Burns cadence so a page using both doesn't feel disjointed. */
const SLIDE_MS = 2000;

export default function CoverflowGallery({
  images,
  theme,
  accent,
  autoplay,
}: GalleryStyleProps) {
  const [index, setIndex] = useState(Math.floor(images?.length / 2));
  const reduce = useReducedMotion();
  // Once the reader has taken control, stop advancing under them — the same
  // courtesy the opening auto-scroll extends.
  const touched = useRef(false);

  const go = (dir: number) => {
    touched.current = true;
    setIndex((i) => Math.min(images.length - 1, Math.max(0, i + dir)));
  };
  const jumpTo = (i: number) => {
    touched.current = true;
    setIndex(i);
  };

  useEffect(() => {
    if (!autoplay || reduce || images.length <= 1) return;
    const id = setInterval(() => {
      if (touched.current) return;
      // Wraps, unlike the manual arrows, which clamp at the ends.
      setIndex((i) => (i + 1) % images.length);
    }, SLIDE_MS);
    return () => clearInterval(id);
  }, [autoplay, reduce, images.length]);

  return (
    <div style={{ width: "100%", overflow: "hidden", padding: "10px 0 4px" }}>
      <div
        style={{
          position: "relative",
          height: 320,
          perspective: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {images.map((img, i) => {
          const offset = i - index;
          if (Math.abs(offset) > 2) return null;
          return (
            <motion.div
              key={i}
              drag={offset === 0 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.4}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(1);
                else if (info.offset.x > 60) go(-1);
              }}
              onClick={() => offset !== 0 && jumpTo(i)}
              animate={{
                x: offset * 130,
                rotateY: offset === 0 ? 0 : offset < 0 ? 38 : -38,
                scale: offset === 0 ? 1 : 0.82,
                opacity: offset === 0 ? 1 : 0.55,
                zIndex: 10 - Math.abs(offset),
              }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              style={{
                position: "absolute",
                width: 210,
                height: 290,
                borderRadius: 14,
                overflow: "hidden",
                cursor: "pointer",
              }}
            >
              <GalleryPhoto image={img} sizes="220px" />
            </motion.div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          justifyContent: "center",
          marginTop: 10,
        }}
      >
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => jumpTo(i)}
            aria-label={`Foto ${i + 1}`}
            style={{
              width: i === index ? 16 : 6,
              height: 6,
              borderRadius: 999,
              border: "none",
              padding: 0,
              background: i === index ? accent : `${theme.textSecondary}66`,
              cursor: "pointer",
              transition: "all .3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}
