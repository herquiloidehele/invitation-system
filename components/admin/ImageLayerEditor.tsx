"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import { EMPTY_IMAGE_LAYER, moveItem, updateItem } from "@/lib/image-layer";
import {
  type Rect,
  clientToCanvasPct,
  findImageEditorViewport,
  resizeWidthPct,
  rotationFromPointer,
} from "@/lib/image-layer-editor-geometry";
import { observeImageLayerEditor } from "@/lib/image-layer-editor-observer";
import type { ImageItem, ImageLayer } from "@/lib/types";

const CORNERS: { k: string; pos: CSSProperties }[] = [
  { k: "tl", pos: { left: -5, top: -5 } },
  { k: "tr", pos: { right: -5, top: -5 } },
  { k: "bl", pos: { left: -5, bottom: -5 } },
  { k: "br", pos: { right: -5, bottom: -5 } },
];

const HANDLE_DOT: CSSProperties = {
  position: "absolute",
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#85B7EB",
  border: "1px solid #fff",
  touchAction: "none",
};

interface ImageLayerEditorProps {
  /** Whether image-edit mode is active (interaction overlay shown). */
  active: boolean;
  value?: ImageLayer;
  onChange: (next: ImageLayer) => void;
  /** Returns the live-preview scroll root (contains the [data-image-canvas]). */
  getPreviewRoot: () => HTMLElement | null;
  /** Selected item id (owned by the form, so the inspector can live there). */
  selectedId: string | null;
  onSelectedIdChange: (id: string | null) => void;
}

function rectOf(el: Element | null | undefined): Rect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function viewportOf(root: HTMLElement): HTMLElement {
  return findImageEditorViewport(root, (element) => {
    const style = window.getComputedStyle(element);
    return `${style.overflow} ${style.overflowX} ${style.overflowY}`;
  });
}

/**
 * On-preview interaction overlay for the free-floating image layer: drag to
 * move, corner handles to resize, top handle to rotate. Selection is
 * controlled by the form; all the value controls live in ImageLayerInspector
 * (rendered in the form column, not over the preview).
 */
export default function ImageLayerEditor({
  active,
  value,
  onChange,
  getPreviewRoot,
  selectedId,
  onSelectedIdChange,
}: ImageLayerEditorProps) {
  const layer = value ?? EMPTY_IMAGE_LAYER;
  const dragOffset = useRef<{ dx: number; dy: number } | null>(null);
  const handleMode = useRef<null | "resize" | "rotate">(null);
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Re-measure on scroll/resize so the overlay tracks the preview as the user
  // scrolls the (tall) invitation to position images.
  useEffect(() => {
    if (!active) return;
    const root = getPreviewRoot();
    const onMove = () => force();
    return observeImageLayerEditor(
      root ? viewportOf(root) : null,
      window,
      onMove,
    );
  }, [active, getPreviewRoot]);

  const readCanvasRect = useCallback((): Rect | null => {
    const root = getPreviewRoot();
    return rectOf(root?.querySelector("[data-image-canvas]"));
  }, [getPreviewRoot]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, id: string) => {
      e.stopPropagation();
      onSelectedIdChange(id);
      const item = layer.items.find((i) => i.id === id);
      const canvas = readCanvasRect();
      if (item && canvas) {
        const cx = canvas.left + (item.xPct / 100) * canvas.width;
        const cy = canvas.top + (item.yPct / 100) * canvas.height;
        dragOffset.current = { dx: e.clientX - cx, dy: e.clientY - cy };
      } else {
        dragOffset.current = { dx: 0, dy: 0 };
      }
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [layer.items, readCanvasRect, onSelectedIdChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, id: string) => {
      if (!dragOffset.current) return;
      const canvas = readCanvasRect();
      if (!canvas) return;
      const cx = e.clientX - dragOffset.current.dx;
      const cy = e.clientY - dragOffset.current.dy;
      const { xPct, yPct } = clientToCanvasPct(canvas, cx, cy);
      onChange(moveItem(layer, id, xPct, yPct));
    },
    [layer, onChange, readCanvasRect],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      dragOffset.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    },
    [],
  );

  const startHandle = useCallback(
    (
      e: React.PointerEvent<HTMLDivElement>,
      mode: "resize" | "rotate",
      id: string,
    ) => {
      e.stopPropagation();
      onSelectedIdChange(id);
      handleMode.current = mode;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [onSelectedIdChange],
  );

  const endHandle = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    handleMode.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  const onResizeMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, item: ImageItem) => {
      if (handleMode.current !== "resize") return;
      const canvas = readCanvasRect();
      if (!canvas) return;
      const centerX = canvas.left + (item.xPct / 100) * canvas.width;
      const centerY = canvas.top + (item.yPct / 100) * canvas.height;
      onChange(
        updateItem(layer, item.id, {
          widthPct: resizeWidthPct(
            { centerX, centerY },
            e.clientX,
            e.clientY,
            canvas,
          ),
        }),
      );
    },
    [layer, onChange, readCanvasRect],
  );

  const onRotateMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, item: ImageItem) => {
      if (handleMode.current !== "rotate") return;
      const canvas = readCanvasRect();
      if (!canvas) return;
      const centerX = canvas.left + (item.xPct / 100) * canvas.width;
      const centerY = canvas.top + (item.yPct / 100) * canvas.height;
      onChange(
        updateItem(layer, item.id, {
          rotation: rotationFromPointer(centerX, centerY, e.clientX, e.clientY),
        }),
      );
    },
    [layer, onChange, readCanvasRect],
  );

  if (!active) return null;

  const previewRoot = getPreviewRoot();
  const preview = rectOf(previewRoot ? viewportOf(previewRoot) : null);
  const canvas = readCanvasRect();
  if (!preview || !canvas) return null;

  return (
    <div
      className="pointer-events-none"
      style={{
        position: "fixed",
        left: preview.left,
        top: preview.top,
        width: preview.width,
        height: preview.height,
        overflow: "hidden",
        zIndex: 40,
      }}
    >
      {/* Sort by z so the visually-topmost image is the one a click hits. */}
      {[...layer.items]
        .sort((a, b) => a.z - b.z)
        .map((item) => {
          const cx = canvas.left + (item.xPct / 100) * canvas.width;
          const cy = canvas.top + (item.yPct / 100) * canvas.height;
          const w = (item.widthPct / 100) * canvas.width;
          const h = w / (item.aspect || 1);
          const left = cx - preview.left - w / 2;
          const top = cy - preview.top - h / 2;
          const isSel = item.id === selectedId;
          return (
            <div
              key={item.id}
              onPointerDown={(e) => handlePointerDown(e, item.id)}
              onPointerMove={(e) => handlePointerMove(e, item.id)}
              onPointerUp={handlePointerUp}
              onPointerEnter={() => setHoveredId(item.id)}
              onPointerLeave={() =>
                setHoveredId((h) => (h === item.id ? null : h))
              }
              className="pointer-events-auto absolute"
              style={{
                left,
                top,
                width: w,
                height: h,
                transform: `rotate(${item.rotation}deg)`,
                cursor: isSel ? "move" : "pointer",
                outline: isSel
                  ? "1.5px dashed #85B7EB"
                  : hoveredId === item.id
                    ? "1.5px solid rgba(133,183,235,0.8)"
                    : "none",
                outlineOffset: 2,
                touchAction: "none",
              }}
            >
              {isSel && (
                <>
                  {CORNERS.map((c) => (
                    <div
                      key={c.k}
                      onPointerDown={(e) => startHandle(e, "resize", item.id)}
                      onPointerMove={(e) => onResizeMove(e, item)}
                      onPointerUp={endHandle}
                      style={{ ...HANDLE_DOT, ...c.pos, cursor: "nwse-resize" }}
                    />
                  ))}
                  <div
                    onPointerDown={(e) => startHandle(e, "rotate", item.id)}
                    onPointerMove={(e) => onRotateMove(e, item)}
                    onPointerUp={endHandle}
                    style={{
                      ...HANDLE_DOT,
                      left: "50%",
                      top: -24,
                      marginLeft: -5,
                      background: "#4a7",
                      cursor: "grab",
                    }}
                  />
                </>
              )}
            </div>
          );
        })}
    </div>
  );
}
