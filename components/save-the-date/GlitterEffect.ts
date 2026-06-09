/**
 * Heart SVG path and texture utilities for the scratch-off effect.
 *
 * The procedural glitter texture and `loadImage` helper now live in
 * `@/lib/scratch-texture` so the curtain-canva coins can reuse the same
 * material. This file re-exports them to avoid breaking existing imports.
 */

export {
  generateGlitterTexture,
  loadImage,
} from "@/lib/scratch-texture";

/**
 * Standard heart SVG path, normalized to a 100x100 viewBox.
 * This produces a symmetric, well-proportioned heart.
 */
const HEART_PATH =
  "M50 88 C25 70, 0 50, 0 30 C0 12, 12 0, 27 0 C37 0, 43 4, 47 14 Q50 24, 53 14 C57 4, 63 0, 73 0 C88 0, 100 12, 100 30 C100 50, 75 70, 50 88Z";

/**
 * Draw the heart path onto a canvas context, scaled to fill width x height.
 */
export function traceHeartPath(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const path = new Path2D();
  const sx = width / 100;
  const sy = height / 100;

  // Scale the normalized heart path
  path.moveTo(50 * sx, 88 * sy);

  // Left lobe
  path.bezierCurveTo(
    25 * sx, 70 * sy,
    0 * sx, 50 * sy,
    0 * sx, 30 * sy
  );
  path.bezierCurveTo(
    0 * sx, 12 * sy,
    12 * sx, 0 * sy,
    27 * sx, 0 * sy
  );
  path.bezierCurveTo(
    37 * sx, 0 * sy,
    43 * sx, 4 * sy,
    47 * sx, 14 * sy
  );

  // Top center cleft (deep V-shaped cavity between lobes)
  path.quadraticCurveTo(
    50 * sx, 24 * sy,
    53 * sx, 14 * sy
  );

  // Right lobe
  path.bezierCurveTo(
    57 * sx, 4 * sy,
    63 * sx, 0 * sy,
    73 * sx, 0 * sy
  );
  path.bezierCurveTo(
    88 * sx, 0 * sy,
    100 * sx, 12 * sy,
    100 * sx, 30 * sy
  );
  path.bezierCurveTo(
    100 * sx, 50 * sy,
    75 * sx, 70 * sy,
    50 * sx, 88 * sy
  );

  path.closePath();
  return path;
}


