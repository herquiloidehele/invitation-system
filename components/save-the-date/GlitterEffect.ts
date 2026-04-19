/**
 * Heart SVG path and texture utilities for the scratch-off effect.
 *
 * We use a proper heart SVG path for crisp, correct shapes, and
 * support loading a real image texture for realistic glitter.
 */

/**
 * Standard heart SVG path, normalized to a 100x100 viewBox.
 * This produces a symmetric, well-proportioned heart.
 */
export const HEART_PATH =
  "M50 88 C25 70, 0 50, 0 30 C0 12, 12 0, 27 0 C37 0, 45 6, 50 18 C55 6, 63 0, 73 0 C88 0, 100 12, 100 30 C100 50, 75 70, 50 88Z";

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
    45 * sx, 6 * sy,
    50 * sx, 18 * sy
  );

  // Right lobe
  path.bezierCurveTo(
    55 * sx, 6 * sy,
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

/**
 * Load an image and return a promise. Used to load glitter textures.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Generate a high-quality procedural glitter texture as a fallback.
 * This uses multiple layers of varying-size particles with highlights
 * to simulate real glitter. Much better than simple dots.
 */
export function generateGlitterTexture(
  width: number,
  height: number,
  colors: string[]
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Layer 1: Base color
  ctx.fillStyle = colors[0] || "#D4AF37";
  ctx.fillRect(0, 0, width, height);

  // Layer 2: Medium noise — many small squares at slight color variations
  const area = width * height;
  const particleCount = Math.floor(area / 4); // very dense

  for (let i = 0; i < particleCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 1 + Math.random() * 2.5;
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Parse color and add random brightness variation
    ctx.globalAlpha = 0.3 + Math.random() * 0.7;
    ctx.fillStyle = color;

    // Mix of squares and tiny rectangles (like real glitter flakes)
    if (Math.random() > 0.3) {
      ctx.fillRect(x, y, size, size);
    } else {
      // Rotated flake
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.random() * Math.PI);
      ctx.fillRect(-size / 2, -size / 2, size, size * 0.6);
      ctx.restore();
    }
  }

  // Layer 3: Bright specular highlights (white/light gold sparkle points)
  const sparkleCount = Math.floor(area / 80);
  for (let i = 0; i < sparkleCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 0.5 + Math.random() * 1.5;

    ctx.globalAlpha = 0.4 + Math.random() * 0.6;
    ctx.fillStyle = Math.random() > 0.5 ? "#FFFFFF" : "#FFF8DC";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layer 4: Subtle dark spots for depth
  const darkCount = Math.floor(area / 200);
  for (let i = 0; i < darkCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 0.8 + Math.random() * 1.5;

    ctx.globalAlpha = 0.15 + Math.random() * 0.25;
    ctx.fillStyle = "#8B7536";
    ctx.fillRect(x, y, size, size);
  }

  ctx.globalAlpha = 1;
  return canvas;
}
