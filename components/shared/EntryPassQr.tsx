"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";

interface EntryPassQrProps {
  /** The URL/text encoded into the QR. */
  value: string;
  /** Human label shown under the QR. */
  caption?: string;
  /** Title above the QR, e.g. "O teu passe de entrada". */
  title?: string;
  /** Label for the download button. */
  downloadLabel?: string;
  /** File name (without extension) for the downloaded PNG. */
  downloadFileName?: string;
  /** Module (foreground) color. Defaults to black for scan reliability. */
  fgColor?: string;
  /** Background color. Defaults to white. */
  bgColor?: string;
  /** Rendered pixel size. Defaults to 220. */
  size?: number;
  /** Hide the download button (e.g. for an admin preview). */
  hideDownload?: boolean;
}

export default function EntryPassQr({
  value,
  caption,
  title,
  downloadLabel = "Descarregar",
  downloadFileName = "entry-pass",
  fgColor = "#111111",
  bgColor = "#ffffff",
  size = 220,
  hideDownload = false,
}: EntryPassQrProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${downloadFileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (!value) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      {title ? (
        <p className="text-xs uppercase tracking-wide opacity-70">{title}</p>
      ) : null}
      <QRCodeCanvas
        ref={canvasRef}
        value={value}
        size={size}
        marginSize={2}
        level="M"
        fgColor={fgColor}
        bgColor={bgColor}
        className="rounded-lg"
      />
      {caption ? <p className="text-sm font-medium">{caption}</p> : null}
      {hideDownload ? null : (
        <button
          type="button"
          onClick={handleDownload}
          className="mt-1 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm"
        >
          <Download size={15} />
          {downloadLabel}
        </button>
      )}
    </div>
  );
}
