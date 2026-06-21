import type { CSSProperties } from "react";

interface FloralDividerProps {
  /** Stems, leaves & blossom center — pass theme.primary (gold). */
  primary?: string;
  /** Blossom petals & buds — pass theme.secondary (rose). */
  secondary?: string;
  width?: number;
  className?: string;
  style?: CSSProperties;
}

/** Single almond leaf, tip at origin, pointing +x. Reused via transforms. */
const LEAF = "M0 0C2.4 -3 7.6 -3.2 10.6 0C7.6 3.2 2.4 3 0 0Z";

// Leaves & buds defined on the LEFT half only; each is mirrored across x=120
// at render so the ornament is perfectly symmetric.
const LEAVES = [
  { x: 90, y: 19.5, r: 202, s: 1 },
  { x: 70, y: 14.5, r: 150, s: 1.18 },
  { x: 52, y: 17, r: 205, s: 0.92 },
  { x: 40, y: 13.5, r: 150, s: 0.68 },
];
const BUDS = [
  { x: 80, y: 12.6 },
  { x: 58, y: 22 },
];

/**
 * Delicate botanical divider — a central blossom flanked by leafy sprigs.
 * The signature floral motif for the elegant-floral template; replaces the
 * heart divider so the page actually reads as "floral". Purely decorative.
 */
export default function FloralDivider({
  primary = "currentColor",
  secondary = primary,
  width = 230,
  className,
  style,
}: FloralDividerProps) {
  const cx = 120;
  const cy = 20;
  const petals = [0, 1, 2, 3, 4].map((i) => {
    const deg = -90 + i * 72;
    const a = (deg * Math.PI) / 180;
    const d = 4.4;
    return { x: cx + d * Math.cos(a), y: cy + d * Math.sin(a), deg };
  });
  const h = Math.round((width * 40) / 240);

  return (
    <div
      className={className}
      style={{ display: "flex", justifyContent: "center", ...style }}
      aria-hidden
    >
      <svg
        width={width}
        height={h}
        viewBox="0 0 240 40"
        fill="none"
        role="presentation"
      >
        {/* stems */}
        <path
          d="M120 20C96 20 72 19 38 13.5"
          stroke={primary}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M120 20C144 20 168 19 202 13.5"
          stroke={primary}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* leaves — left set + mirror */}
        {LEAVES.map((l, i) => (
          <g key={i} fill={primary} opacity="0.82">
            <path
              d={LEAF}
              transform={`translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})`}
            />
            <path
              d={LEAF}
              transform={`translate(${240 - l.x} ${l.y}) rotate(${180 - l.r}) scale(${l.s})`}
            />
          </g>
        ))}

        {/* small buds — left set + mirror */}
        {BUDS.map((b, i) => (
          <g key={i} fill={secondary} opacity="0.85">
            <circle cx={b.x} cy={b.y} r="1.8" />
            <circle cx={240 - b.x} cy={b.y} r="1.8" />
          </g>
        ))}

        {/* central blossom */}
        {petals.map((p, i) => (
          <ellipse
            key={i}
            cx={p.x}
            cy={p.y}
            rx="4.7"
            ry="2.7"
            fill={secondary}
            transform={`rotate(${p.deg} ${p.x} ${p.y})`}
          />
        ))}
        <circle cx={cx} cy={cy} r="2.4" fill={primary} />
      </svg>
    </div>
  );
}
