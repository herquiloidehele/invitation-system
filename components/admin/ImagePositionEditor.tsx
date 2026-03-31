"use client";

import { useCallback, useRef, useState } from "react";
import { MoveIcon, RotateCcwIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type ImageSettings, DEFAULT_IMAGE_SETTINGS } from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ImagePositionEditorProps {
  /** The image URL to preview & adjust. */
  src: string;
  /** Current position/zoom settings. */
  settings: ImageSettings;
  /** Called whenever the user changes position or zoom. */
  onChange: (next: ImageSettings) => void;
  /** Height of the preview container (px). Default 180. */
  previewHeight?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.05;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImagePositionEditor({
  src,
  settings,
  onChange,
  previewHeight = 180,
  className,
}: ImagePositionEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const settingsAtDragStart = useRef(settings);
  const [isDragging, setIsDragging] = useState(false);

  // ── Helpers ──

  const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));

  const isDefault =
    settings.positionX === DEFAULT_IMAGE_SETTINGS.positionX &&
    settings.positionY === DEFAULT_IMAGE_SETTINGS.positionY &&
    settings.zoom === DEFAULT_IMAGE_SETTINGS.zoom;

  // ── Drag handlers ──

  const startDrag = useCallback(
    (clientX: number, clientY: number) => {
      dragging.current = true;
      dragStart.current = { x: clientX, y: clientY };
      settingsAtDragStart.current = { ...settings };
      setIsDragging(true);
    },
    [settings],
  );

  const moveDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = clientX - dragStart.current.x;
      const dy = clientY - dragStart.current.y;

      // Scale drag distance relative to container size, inversely with zoom
      const sensitivity = 100 / settings.zoom;
      const deltaX = (dx / rect.width) * sensitivity;
      const deltaY = (dy / rect.height) * sensitivity;

      onChange({
        ...settings,
        positionX: clamp(
          settingsAtDragStart.current.positionX - deltaX,
          0,
          100,
        ),
        positionY: clamp(
          settingsAtDragStart.current.positionY - deltaY,
          0,
          100,
        ),
      });
    },
    [settings, onChange],
  );

  const endDrag = useCallback(() => {
    dragging.current = false;
    setIsDragging(false);
  }, []);

  // ── Mouse events ──

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startDrag(e.clientX, e.clientY);

      const onMouseMove = (ev: MouseEvent) => moveDrag(ev.clientX, ev.clientY);
      const onMouseUp = () => {
        endDrag();
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [startDrag, moveDrag, endDrag],
  );

  // ── Touch events ──

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY);
    },
    [startDrag],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    },
    [moveDrag],
  );

  const onTouchEnd = useCallback(() => {
    endDrag();
  }, [endDrag]);

  // ── Zoom slider ──

  const handleZoomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...settings, zoom: parseFloat(e.target.value) });
    },
    [settings, onChange],
  );

  const handleReset = useCallback(() => {
    onChange({ ...DEFAULT_IMAGE_SETTINGS });
  }, [onChange]);

  // ── Render ──

  return (
    <div className={cn("space-y-2", className)}>
      {/* Preview container — draggable */}
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden rounded-lg border bg-muted/30 select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        style={{ height: previewHeight }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Ajustar posição"
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${settings.positionX}% ${settings.positionY}%`,
            transform: `scale(${settings.zoom})`,
            transformOrigin: `${settings.positionX}% ${settings.positionY}%`,
            pointerEvents: "none",
          }}
        />

        {/* Drag hint overlay */}
        {!isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors pointer-events-none">
            <div className="bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoveIcon className="h-4 w-4" />
            </div>
          </div>
        )}

        {/* Crosshair hint at centre */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="w-4 h-4 border border-white/60 rounded-full shadow-sm" />
        </div>
      </div>

      {/* Controls row: zoom slider + reset */}
      <div className="flex items-center gap-2">
        <ZoomOutIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={ZOOM_STEP}
          value={settings.zoom}
          onChange={handleZoomChange}
          className="flex-1 h-1.5 accent-primary cursor-pointer"
        />
        <ZoomInIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground tabular-nums w-10 text-right shrink-0">
          {settings.zoom.toFixed(1)}x
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={handleReset}
          disabled={isDefault}
          title="Repor predefinição"
        >
          <RotateCcwIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
