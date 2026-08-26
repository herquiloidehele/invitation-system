"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";

interface EntryPassQrProps {
  /** The URL/text encoded into the QR. */
  value: string;
  /** Human label shown under the QR (e.g. guest name + party size). */
  caption?: string;
  /** Title above the QR, e.g. "O teu passe de entrada". */
  title?: string;
  /** Label for the download button, e.g. "Descarregar". */
  downloadLabel?: string;
  /** File name (without extension) for the downloaded PNG. */
  downloadFileName?: string;
  /** Foreground/background colors; default black on white for scan reliability. */
  colorDark?: string;
  colorLight?: string;
}

export default function EntryPassQr({
  value,
  caption,
  title,
  downloadLabel = "Descarregar",
  downloadFileName = "entry-pass",
  colorDark = "#111111",
  colorLight = "#ffffff",
}: EntryPassQrProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      const canvas = canvasRef.current;
      if (!canvas || !value) return;
      const QRCode = (await import("qrcode")).default;
      await QRCode.toCanvas(canvas, value, {
        width: 220,
        margin: 2,
        color: { dark: colorDark, light: colorLight },
        errorCorrectionLevel: "M",
      });
      if (!cancelled) setReady(true);
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [value, colorDark, colorLight]);

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

  return (
    <div className="flex flex-col items-center gap-2">
      {title ? (
        <p className="text-xs uppercase tracking-wide opacity-70">{title}</p>
      ) : null}
      <canvas
        ref={canvasRef}
        className="rounded-lg"
        aria-label={caption ?? "QR code"}
      />
      {caption ? <p className="text-sm font-medium">{caption}</p> : null}
      <button
        type="button"
        onClick={handleDownload}
        disabled={!ready}
        className="mt-1 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
      >
        <Download size={15} />
        {downloadLabel}
      </button>
    </div>
  );
}
