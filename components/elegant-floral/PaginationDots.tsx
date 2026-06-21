import type { CSSProperties } from "react";

interface PaginationDotsProps {
  count: number;
  active: number;
  color?: string;
  /** When provided, dots become buttons that jump to the given index. */
  onSelect?: (index: number) => void;
  className?: string;
  style?: CSSProperties;
}

/** Row of carousel pagination dots; the active dot is filled and slightly larger. */
export default function PaginationDots({
  count,
  active,
  color = "currentColor",
  onSelect,
  className,
  style,
}: PaginationDotsProps) {
  if (count <= 1) return null;

  const dotStyle = (i: number): CSSProperties => ({
    display: "block",
    width: i === active ? 9 : 7,
    height: i === active ? 9 : 7,
    borderRadius: 9999,
    background: color,
    opacity: i === active ? 1 : 0.35,
    transition: "opacity 0.2s, width 0.2s, height 0.2s",
  });

  return (
    <div
      className={className}
      style={{ display: "flex", justifyContent: "center", gap: 8, ...style }}
      aria-hidden={!onSelect}
    >
      {Array.from({ length: count }).map((_, i) =>
        onSelect ? (
          <button
            key={i}
            type="button"
            aria-label={`Foto ${i + 1}`}
            onClick={() => onSelect(i)}
            style={{
              padding: 6,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              lineHeight: 0,
            }}
          >
            <span style={dotStyle(i)} />
          </button>
        ) : (
          <span key={i} style={dotStyle(i)} />
        ),
      )}
    </div>
  );
}
