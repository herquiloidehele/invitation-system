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

  return null;
}
