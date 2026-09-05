"use client";

import { QRCodeCanvas } from "qrcode.react";
import type { ReactElement } from "react";

import type { QrCodeProps } from "@/lib/ai-primitive-types";

/**
 * QR primitive over `qrcode.react`. The bundle passes the payload (e.g. the
 * value from `useEntryPass()`); the host owns the canvas rendering.
 */
export default function QrCode({
  value,
  size = 180,
  fgColor = "#000000",
  bgColor = "#ffffff",
  className,
}: QrCodeProps): ReactElement {
  return (
    <QRCodeCanvas
      value={value}
      size={size}
      level="M"
      marginSize={2}
      fgColor={fgColor}
      bgColor={bgColor}
      className={className}
    />
  );
}
