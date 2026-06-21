import type { CSSProperties } from "react";

interface HeartDividerProps {
  /** Stroke/fill color. Pass the theme's secondary/decorative color. */
  color?: string;
  width?: number | string;
  className?: string;
  style?: CSSProperties;
}

const HEART_PATH =
  "M9,15 C9,15 1,9.8 1,4.9 C1,2.4 2.9,0.8 5,0.8 C6.6,0.8 8.2,1.8 9,3.4 C9.8,1.8 11.4,0.8 13,0.8 C15.1,0.8 17,2.4 17,4.9 C17,9.8 9,15 9,15 Z";

/** Thin line with a centered heart and small end hearts — the Canva section divider. */
export default function HeartDivider({
  color = "currentColor",
  width = 240,
  className,
  style,
}: HeartDividerProps) {
  return (
    <div
      className={className}
      style={{ display: "flex", justifyContent: "center", color, ...style }}
      aria-hidden
    >
      <svg
        width={width}
        height={20}
        viewBox="0 0 240 20"
        fill="none"
        role="presentation"
      >
        <g transform="translate(2,5) scale(0.5)" fill={color}>
          <path d={HEART_PATH} />
        </g>
        <g transform="translate(229,5) scale(0.5)" fill={color}>
          <path d={HEART_PATH} />
        </g>
        <line x1="16" y1="10" x2="104" y2="10" stroke={color} strokeWidth="1" />
        <line x1="136" y1="10" x2="224" y2="10" stroke={color} strokeWidth="1" />
        <g transform="translate(110,2) scale(1.05)" fill={color}>
          <path d={HEART_PATH} />
        </g>
      </svg>
    </div>
  );
}
