import type { CSSProperties } from "react";

interface FloralAccentProps {
  src: string;
  alt?: string;
  /** Blend the white asset background into the cream page. Default "multiply". */
  blend?: CSSProperties["mixBlendMode"];
  className?: string;
  style?: CSSProperties;
}

/**
 * Decorative watercolor floral image. Non-interactive; "multiply" blends the
 * asset's near-white background into the cream page so no rectangle shows.
 */
export default function FloralAccent({
  src,
  alt = "",
  blend = "multiply",
  className,
  style,
}: FloralAccentProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      aria-hidden={alt === ""}
      className={className}
      style={{
        display: "block",
        objectFit: "contain",
        pointerEvents: "none",
        userSelect: "none",
        mixBlendMode: blend,
        ...style,
      }}
    />
  );
}
