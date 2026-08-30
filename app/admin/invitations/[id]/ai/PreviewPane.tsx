"use client";

import { ExternalLink, Monitor, RotateCw, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function PreviewPane({
  src,
  device,
  onDeviceChange,
  onReload,
}: {
  src: string | null;
  device: "phone" | "desktop";
  onDeviceChange: (d: "phone" | "desktop") => void;
  onReload: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Button
            variant={device === "phone" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onDeviceChange("phone")}
            aria-label="Phone preview"
          >
            <Smartphone className="size-4" />
          </Button>
          <Button
            variant={device === "desktop" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onDeviceChange("desktop")}
            aria-label="Desktop preview"
          >
            <Monitor className="size-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReload}
            disabled={!src}
            aria-label="Reload preview"
          >
            <RotateCw className="size-4" />
          </Button>
          {src && (
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              aria-label="Open preview in a new tab"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border bg-muted/30 p-3">
        {src ? (
          <iframe
            key={src}
            src={src}
            title="Invitation preview"
            className={cn(
              "h-full border-0 bg-background shadow-sm",
              device === "phone"
                ? "w-[390px] max-w-full rounded-[2rem]"
                : "w-full rounded-lg",
            )}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Build a draft to preview it here.
          </p>
        )}
      </div>
    </div>
  );
}
