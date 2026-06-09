"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import GalleryPhoto from "../GalleryPhoto";
import type { GalleryStyleProps } from "../types";

export default function CoverflowGallery({
  images,
  theme,
  accent,
}: GalleryStyleProps) {
  const [index, setIndex] = useState(Math.floor(images?.length / 2));
  const go = (dir: number) =>
    setIndex((i) => Math.min(images.length - 1, Math.max(0, i + dir)));

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
              onClick={() => offset !== 0 && setIndex(i)}
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
            onClick={() => setIndex(i)}
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
