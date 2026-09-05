import type { CSSProperties, ReactElement } from "react";

export interface MediaProps {
  src: string;
  alt?: string;
  /** Explicit intrinsic size. Ignored when `fill` is set. */
  width?: number;
  height?: number;
  /** Fill a positioned parent instead of using intrinsic width/height. */
  fill?: boolean;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  /** Border radius in px, or true for a pill/circle-ish 9999px. */
  rounded?: number | boolean;
  className?: string;
  style?: CSSProperties;
}

export interface QrCodeProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
}

export interface FontProps {
  /** A Google or admin-uploaded font family name to load on demand. */
  family: string;
}

/** JSX-usable component signatures exposed on the platform. */
export type MediaComponent = (props: MediaProps) => ReactElement;
export type QrCodeComponent = (props: QrCodeProps) => ReactElement;
export type FontComponent = (props: FontProps) => ReactElement | null;
