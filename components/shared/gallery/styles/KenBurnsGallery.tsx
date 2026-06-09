"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import GalleryPhoto from "../GalleryPhoto";
import type { GalleryStyleProps } from "../types";

const SLIDE_MS = 5000;

export default function KenBurnsGallery({
  images,
  theme,
  accent,
}: GalleryStyleProps) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || images.length <= 1) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % images.length),
      SLIDE_MS,
    );
    return () => clearInterval(id);
  }, [reduce, images.length]);

  const current = images[index];
  const advance = () =>
    images.length > 1 && setIndex((i) => (i + 1) % images.length);

  return (
    <div
      onClick={advance}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "4 / 5",
        maxWidth: 460,
        margin: "0 auto",
        overflow: "hidden",
        borderRadius: 18,
        cursor: images.length > 1 ? "pointer" : "default",
        background: theme.bg,
      }}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: reduce ? 1 : 1.12 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.2 },
            scale: { duration: SLIDE_MS / 1000 + 1.2, ease: "linear" },
          }}
          style={{ position: "absolute", inset: 0 }}
        >
          <GalleryPhoto
            image={current}
            sizes="(max-width: 500px) 100vw, 460px"
            priority
          />
        </motion.div>
      </AnimatePresence>

      {current?.caption && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "40px 20px 18px",
            background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
            color: "#fff",
            pointerEvents: "none",
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: theme.uiFont,
              fontSize: 15,
              fontStyle: "italic",
            }}
          >
            {current.caption}
          </p>
        </div>
      )}

      {images.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 0,
            right: 0,
            display: "flex",
            gap: 6,
            justifyContent: "center",
          }}
        >
          {images.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === index ? 16 : 6,
                height: 6,
                borderRadius: 999,
                background: i === index ? accent : "rgba(255,255,255,0.6)",
                transition: "all .3s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
