/**
 * Shared texture utilities used by the scratch-off surfaces (heart, coin).
 *
 * `generateGlitterTexture` paints a multi-layered procedural gold-glitter
 * texture onto an offscreen canvas which can then be drawn through any
 * clip path (heart, circle, etc.) to give the scratchable surface a
 * realistic material appearance.
 *
 * `loadImage` is a small helper to load an external texture URL with
 * `crossOrigin = "anonymous"` so the loaded image can be drawn onto a
 * canvas without tainting it.
 */

/**
 * Default golden glitter palette used by the save-the-date heart. Exported
 * here so other scratch surfaces (e.g. the curtain-canva coins) can opt
 * into the exact same material without re-typing the colors.
 */
export const GOLDEN_GLITTER_PALETTE = [
  "#D4AF37",
  "#C5A028",
  "#E8C547",
  "#F5E6A3",
  "#FFFFFF",
];

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
  colors: string[],
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
