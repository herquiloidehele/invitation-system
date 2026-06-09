"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import GalleryPhoto from "../GalleryPhoto";
import type { GalleryStyleProps } from "../types";

const ROT = [-8, 6, -3, 9, -5];

export default function PolaroidGallery({ images, theme }: GalleryStyleProps) {
  // `order[0]` is the card on top of the stack.
  const [order, setOrder] = useState(() => images.map((_, i) => i));
  const sendToBack = () => setOrder((o) => [...o.slice(1), o[0]]);

  return (
    <div
      style={{ position: "relative", height: 380, maxWidth: 320, margin: "0 auto" }}
    >
      {order.map((imgIdx, stackPos) => {
        const img = images[imgIdx];
        const isTop = stackPos === 0;
        return (
          <motion.div
            key={imgIdx}
            drag={isTop}
            dragSnapToOrigin
            onDragEnd={(_, info) => {
              if (Math.hypot(info.offset.x, info.offset.y) > 120) sendToBack();
            }}
            animate={{
              rotate: ROT[imgIdx % ROT.length],
              scale: 1 - stackPos * 0.04,
              y: stackPos * 8,
              zIndex: order.length - stackPos,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: 240,
              height: 300,
              background: "#fafafa",
              padding: "10px 10px 40px",
              borderRadius: 4,
              boxShadow: "0 10px 26px rgba(0,0,0,0.3)",
              cursor: isTop ? "grab" : "default",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: "#000",
              }}
            >
              <GalleryPhoto image={img} sizes="240px" />
            </div>
            {img.caption && (
              <p
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  margin: 0,
                  fontFamily: theme.uiFont,
                  fontSize: 14,
                  color: "#444",
                }}
              >
                {img.caption}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
