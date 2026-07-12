import type { CSSProperties } from "react";

import type { ObjectFit } from "@/lib/types";

interface VideoPosterLayerProps {
  posterUrl?: string;
  visible: boolean;
  mediaFit?: ObjectFit;
  zIndex?: number;
}

export default function VideoPosterLayer({
  posterUrl,
  visible,
  mediaFit = "cover",
  zIndex = 1,
}: VideoPosterLayerProps) {
  if (!posterUrl) return null;

  const style: CSSProperties = {
    objectFit: mediaFit,
    opacity: visible ? 1 : 0,
    transition: "opacity 200ms ease-out",
    zIndex,
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-video-poster-overlay
      src={posterUrl}
      alt=""
      aria-hidden
      draggable={false}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={style}
    />
  );
}
