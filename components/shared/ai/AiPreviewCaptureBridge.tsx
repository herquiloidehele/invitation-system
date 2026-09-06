"use client";

import { useEffect } from "react";

import {
  AI_PREVIEW_CAPTURE,
  AI_PREVIEW_CAPTURED,
  AI_PREVIEW_READY,
  PIXEL_RATIO,
  TILE_HEIGHT_PX,
  captureHeight,
  sliceCanvas,
  type CaptureRequest,
  type CaptureResult,
} from "@/lib/ai-preview-capture";
import {
  AI_PREVIEW_SELECT_MODE,
  AI_PREVIEW_SELECTED,
  describeSelectedElement,
  snapToBlock,
  type SelectModeMessage,
} from "@/lib/ai-preview-select";

/** A 1×1 transparent PNG: what a cross-origin image becomes instead of aborting the capture. */
const TRANSPARENT_PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const MOUNT_TIMEOUT_MS = 30_000;
/** After a reload or a width change, let entrance animations and reflow land. */
const SETTLE_MS = 800;
/** Shorter than the console's wait, so a stuck raster still reports a reason. */
const CAPTURE_TIMEOUT_MS = 40_000;

function whenMounted(): Promise<boolean> {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (document.querySelector('[data-ai-mounted="1"]')) return resolve(true);
      if (Date.now() - started > MOUNT_TIMEOUT_MS) return resolve(false);
      setTimeout(tick, 100);
    };
    tick();
  });
}

/** Milliseconds per scroll step: long enough for IntersectionObserver to fire. */
const REVEAL_STEP_MS = 120;

/**
 * Bundles reveal sections with `whileInView`, so anything below the fold is
 * still at opacity 0 in an unscrolled page. Walk the page the way a reader
 * would — in steps small enough that every element crosses even a generous
 * negative viewport margin — then return to the top and let the animations
 * land before rasterising.
 */
async function revealAll(body: HTMLElement): Promise<void> {
  const step = Math.max(1, Math.floor(window.innerHeight * 0.4));
  for (let y = 0; y < body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, REVEAL_STEP_MS));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, SETTLE_MS));
}

/**
 * Safety net under `revealAll`: an observer that never fired (a backgrounded
 * tab gets no frames) leaves its element at the inline `opacity: 0` /
 * `scale(0)` initial state. Paint those as revealed for the snapshot and put
 * everything back afterwards, so the design itself is untouched. Only exact
 * zeros are touched — a deliberate 0.6 stays 0.6.
 */
function forceRevealed(root: HTMLElement): () => void {
  const undo: Array<() => void> = [];
  const collapsed = /scale[XY]?\(0\)/;
  for (const el of root.querySelectorAll<HTMLElement>("[style]")) {
    const { opacity, transform } = el.style;
    const hidden = opacity === "0";
    if (!hidden && !collapsed.test(transform)) continue;
    undo.push(() => {
      el.style.opacity = opacity;
      el.style.transform = transform;
    });
    if (hidden) el.style.opacity = "1";
    el.style.transform = "none";
  }
  return () => undo.forEach((u) => u());
}

async function capture(maxTiles: number): Promise<string[]> {
  // A hidden or collapsed frame lays out to 0×0; html-to-image then spins on
  // an empty raster instead of failing, so refuse up front with a reason.
  if (window.innerWidth === 0 || window.innerHeight === 0) {
    throw new Error("preview has no layout (is the window hidden?)");
  }
  // Loaded on demand: the public invitation bundle must not carry this.
  const { toSvg } = await import("html-to-image");
  window.scrollTo(0, 0);
  // `body`, not `documentElement`: the root's client box is the viewport, so
  // rasterising it yields one screen; the body's box is the whole page.
  const body = document.body;
  await revealAll(body);
  const width = body.clientWidth;
  const height = captureHeight(body.scrollHeight, maxTiles);
  const restore = forceRevealed(body);
  const snapshot = toSvg(body, {
    width,
    height,
    imagePlaceholder: TRANSPARENT_PX,
    cacheBust: true,
    // The Next.js dev overlay is not part of the design.
    filter: (node) => node.tagName !== "NEXTJS-PORTAL",
  })
    .finally(restore)
    .then((svg) => rasterise(svg, width, height));
  const canvas = await Promise.race([
    snapshot,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(`capture timed out after ${CAPTURE_TIMEOUT_MS / 1000}s`),
          ),
        CAPTURE_TIMEOUT_MS,
      ),
    ),
  ]);
  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error("rendered canvas is empty");
  }
  return sliceCanvas(
    canvas,
    Math.round(TILE_HEIGHT_PX * PIXEL_RATIO),
    maxTiles,
  );
}

/**
 * Draw the SVG snapshot onto a canvas ourselves. html-to-image's `toCanvas`
 * resolves inside `requestAnimationFrame`, which never fires in a hidden
 * document — an admin who switches tabs while the review runs would wait
 * forever. Image decode does not depend on frames.
 */
async function rasterise(
  svgDataUrl: string,
  width: number,
  height: number,
): Promise<HTMLCanvasElement> {
  const img = new Image();
  img.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("the page snapshot did not decode"));
    img.src = svgDataUrl;
  });
  await img.decode().catch(() => undefined); // loaded is enough to draw
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * PIXEL_RATIO);
  canvas.height = Math.round(height * PIXEL_RATIO);
  const ctx = canvas.getContext("2d")!;
  // JPEG has no alpha: paint the page background first, or transparent
  // regions come out black.
  ctx.fillStyle = pageBackground();
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function pageBackground(): string {
  const transparent = /^rgba\(0, 0, 0, 0\)$|^transparent$/;
  for (const el of [document.body, document.documentElement]) {
    const bg = getComputedStyle(el).backgroundColor;
    if (bg && !transparent.test(bg)) return bg;
  }
  return "#ffffff";
}

/**
 * Lives inside the preview page (iframe). The console cannot rasterise a
 * framed document from outside, so it asks; this answers. Preview-mode only.
 */
export default function AiPreviewCaptureBridge() {
  useEffect(() => {
    if (window.parent === window) return; // not framed — nothing to talk to
    const origin = window.location.origin;

    const onMessage = async (event: MessageEvent<CaptureRequest>) => {
      if (event.origin !== origin || event.source !== window.parent) return;
      if (event.data?.type !== AI_PREVIEW_CAPTURE) return;
      const reply = (r: Omit<CaptureResult, "type">) =>
        window.parent.postMessage({ type: AI_PREVIEW_CAPTURED, ...r }, origin);
      try {
        if (!(await whenMounted())) throw new Error("bundle never mounted");
        await new Promise((r) => setTimeout(r, SETTLE_MS));
        reply({
          requestId: event.data.requestId,
          tiles: await capture(event.data.maxTiles),
        });
      } catch (err) {
        reply({
          requestId: event.data.requestId,
          tiles: [],
          error: err instanceof Error ? err.message : String(err),
        });
      }
    };

    window.addEventListener("message", onMessage);
    void whenMounted().then((ok) => {
      if (ok) window.parent.postMessage({ type: AI_PREVIEW_READY }, origin);
    });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Select mode: the console arms it, the user hovers (snap highlight) and
  // clicks a block; we rasterize just that block and post it back. Clicks are
  // swallowed in the capture phase so the invitation's own controls don't fire.
  useEffect(() => {
    if (window.parent === window) return;
    const origin = window.location.origin;
    let active = false;
    let overlay: HTMLDivElement | null = null;
    let hovered: Element | null = null;

    const root = (): Element =>
      document.querySelector('[data-ai-mounted="1"]') ?? document.body;

    const ensureOverlay = (): HTMLDivElement => {
      if (overlay) return overlay;
      overlay = document.createElement("div");
      overlay.setAttribute("data-ai-select-overlay", "1");
      Object.assign(overlay.style, {
        position: "fixed",
        pointerEvents: "none",
        zIndex: "2147483646",
        border: "2px solid #6366f1",
        background: "rgba(99,102,241,0.12)",
        borderRadius: "4px",
        transition: "top 60ms, left 60ms, width 60ms, height 60ms",
      });
      document.body.appendChild(overlay);
      return overlay;
    };

    const positionOverlay = (el: Element) => {
      const r = el.getBoundingClientRect();
      const o = ensureOverlay();
      o.style.top = `${r.top}px`;
      o.style.left = `${r.left}px`;
      o.style.width = `${r.width}px`;
      o.style.height = `${r.height}px`;
      o.style.display = "block";
    };

    const onMove = (e: MouseEvent) => {
      if (!active) return;
      const target = e.target as Element | null;
      if (!target) return;
      hovered = snapToBlock(target, root());
      positionOverlay(hovered);
    };

    const onClick = async (e: MouseEvent) => {
      if (!active) return;
      e.preventDefault();
      e.stopPropagation();
      const base = hovered ?? (e.target as Element | null);
      if (!base) return;
      const target = snapToBlock(base, root());
      const rect = target.getBoundingClientRect();
      const descriptor = describeSelectedElement(
        target,
        root(),
        rect.top + window.scrollY,
        document.documentElement.scrollHeight,
      );
      exit(); // hide the overlay before rasterizing so it isn't in the crop
      let png: string | null = null;
      try {
        const { toPng } = await import("html-to-image");
        png = await toPng(target as HTMLElement, {
          pixelRatio: PIXEL_RATIO,
          cacheBust: true,
          imagePlaceholder: TRANSPARENT_PX,
          filter: (node) =>
            (node as HTMLElement).tagName !== "NEXTJS-PORTAL" &&
            (node as HTMLElement).getAttribute?.("data-ai-select-overlay") !==
              "1",
        });
      } catch {
        png = null;
      }
      window.parent.postMessage(
        { type: AI_PREVIEW_SELECTED, descriptor, png },
        origin,
      );
    };

    const enter = () => {
      if (active) return;
      active = true;
      document.addEventListener("mousemove", onMove, true);
      document.addEventListener("click", onClick, true);
      document.body.style.cursor = "crosshair";
    };

    function exit() {
      active = false;
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.body.style.cursor = "";
      if (overlay) overlay.style.display = "none";
      hovered = null;
    }

    const onMessage = (event: MessageEvent<SelectModeMessage>) => {
      if (event.origin !== origin || event.source !== window.parent) return;
      if (event.data?.type !== AI_PREVIEW_SELECT_MODE) return;
      if (event.data.enabled) enter();
      else exit();
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      exit();
      overlay?.remove();
      overlay = null;
    };
  }, []);

  return null;
}
