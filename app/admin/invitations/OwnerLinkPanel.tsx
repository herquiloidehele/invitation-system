"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OwnerLinkPanelProps {
  ownerUrl: string;
}

export function OwnerLinkPanel({ ownerUrl }: OwnerLinkPanelProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(ownerUrl);
      setCopied(true);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Link do casal</p>
          <p className="text-xs text-muted-foreground">
            Partilhe este link com o casal para ver as confirmações — sem login
            necessário.
          </p>
        </div>
        <a
          href={ownerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Abrir link"
        >
          <ExternalLink className="size-4" />
        </a>
      </div>
      <div className="flex gap-2">
        <Input
          readOnly
          value={ownerUrl}
          className="font-mono text-xs h-8 bg-background"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 h-8"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? "Copiado!" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}
