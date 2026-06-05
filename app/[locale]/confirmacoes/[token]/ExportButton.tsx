"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ExportButtonProps {
  token: string;
  filename: string;
}

export function ExportButton({ token, filename }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("OwnerConfirmations");

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/export/rsvps/${token}`);
      if (!res.ok) {
        throw new Error(
          t("exportErrorStatus", { status: String(res.status) }),
        );
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("exportErrorUnknown"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleExport}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 hover:border-stone-300 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin text-stone-500" />
        ) : (
          <Download className="size-4 text-stone-500" />
        )}
        {loading ? t("exportLoading") : t("exportButton")}
      </button>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
