"use client";

import { useCallback, useState, type CSSProperties } from "react";
import { Check, Copy } from "lucide-react";

interface CopyableValueProps {
  value: string;
  className?: string;
  style?: CSSProperties;
  copiedLabel?: string;
  copyLabel?: string;
  iconSize?: number;
}

export function CopyableValue({
  value,
  className,
  style,
  copiedLabel = "Copiado",
  copyLabel = "Copiar",
  iconSize = 14,
}: CopyableValueProps) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? copiedLabel : copyLabel}
      className={className}
      style={style}
    >
      {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}
