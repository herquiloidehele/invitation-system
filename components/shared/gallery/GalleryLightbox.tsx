"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import GalleryPhoto from "./GalleryPhoto";
import type { ResolvedGalleryImage } from "@/lib/couple-gallery";

export default function GalleryLightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: ResolvedGalleryImage[];
  /** null = closed. */
  index: number | null;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((index + 1) % images.length);
      if (e.key === "ArrowLeft")
        onNavigate((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {index !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={iconBtn({ top: 18, right: 18 })}
          >
            <X size={28} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index - 1 + images.length) % images.length);
            }}
            aria-label="Anterior"
            style={iconBtn({ left: 12 })}
          >
            <ChevronLeft size={34} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index + 1) % images.length);
            }}
            aria-label="Próxima"
            style={iconBtn({ right: 12 })}
          >
            <ChevronRight size={34} />
          </button>

          <motion.div
            key={index}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) onNavigate((index + 1) % images.length);
              else if (info.offset.x > 80)
                onNavigate((index - 1 + images.length) % images.length);
            }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "88vw",
              maxWidth: 640,
              height: "78vh",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <GalleryPhoto image={images[index]} sizes="88vw" priority />
            {images[index]?.caption && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: "30px 18px 16px",
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                  color: "#fff",
                }}
              >
                <p style={{ margin: 0, fontSize: 15 }}>{images[index].caption}</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function iconBtn(pos: React.CSSProperties): React.CSSProperties {
  return {
    position: "absolute",
    background: "transparent",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    zIndex: 2,
    ...pos,
  };
}
