import sharp from "sharp";
import { join } from "node:path";

/**
 * Builds the horizontal polaroid (`frame-avatar-landscape.webp`) from the
 * vertical one, so both stay the same artwork. Rerun it whenever
 * `frame-avatar.webp` is replaced:
 *   npx tsx scripts/build-landscape-polaroid.ts
 *
 * The printed frame is tilted, so it is straightened first, re-proportioned by
 * nine-slicing, then tilted back. Only the plain mat and the transparent
 * window are stretched or squashed; the tape (top centre), the wax seal
 * (bottom right) and the thick bottom strip are copied at their own size, so
 * the result reads as a wide-format print rather than a portrait one turned
 * on its side.
 *
 * It prints the frame size and photo window to paste into
 * `MB_POLAROID_FRAMES.landscape` in `lib/minimalism-brown.ts`.
 */

const DIR = join(process.cwd(), "public/images/themes/minimalism-brown");
const SOURCE = join(DIR, "frame-avatar.webp");
const OUTPUT = join(DIR, "frame-avatar-landscape.webp");

/** The artwork's tilt, as the vertical frame's photo window uses it. */
const TILT_DEG = 4.78;
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

/*
 * Slice lines in the straightened source (1220 × 1640 at 4.78°). Measured
 * from its alpha channel and colour: the transparent window spans
 * x 208–971, y 168–1344; the tape x 453–735, y 93–200; the seal
 * x 868–1088, y 1237–1468. Columns 1 and 3 and row 1 hold only mat and
 * window, so they are the ones resized.
 */
const COLS = [0, 330, 440, 750, 850] as const;
const ROWS = [0, 230, 1200] as const;
const WINDOW = { x0: 208, x1: 971, y0: 168, y1: 1344 };
/** How far the photo tucks under the mat on each side, as the vertical one does. */
const BLEED = { x: 12, y: 10 };

async function main() {
  const straight = await sharp(SOURCE)
    .rotate(TILT_DEG, { background: CLEAR })
    .png()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = straight.info;
  if (W !== 1220 || H !== 1640) {
    throw new Error(
      `Straightened source is ${W}×${H}, expected 1220×1640. The artwork changed: re-measure COLS, ROWS and WINDOW before trusting the output.`,
    );
  }

  // Swap the window's proportions: as much wider as it gets shorter.
  const windowW = WINDOW.x1 - WINDOW.x0;
  const windowH = WINDOW.y1 - WINDOW.y0;
  const delta = windowH - windowW;

  const xs = [...COLS, W];
  const ys = [...ROWS, H];
  const srcColW = xs.slice(1).map((x, i) => x - xs[i]);
  const srcRowH = ys.slice(1).map((y, i) => y - ys[i]);
  const half = Math.round(delta / 2);
  const colW = srcColW.map((w, i) =>
    i === 1 ? w + half : i === 3 ? w + (delta - half) : w,
  );
  const rowH = srcRowH.map((h, i) => (i === 1 ? h - delta : h));
  if (rowH[1] <= 0) throw new Error("Window too short to squash");

  const pieces: sharp.OverlayOptions[] = [];
  let top = 0;
  for (let r = 0; r < rowH.length; r++) {
    let left = 0;
    for (let c = 0; c < colW.length; c++) {
      let piece = sharp(straight.data).extract({
        left: xs[c],
        top: ys[r],
        width: srcColW[c],
        height: srcRowH[r],
      });
      if (colW[c] !== srcColW[c] || rowH[r] !== srcRowH[r]) {
        piece = sharp(await piece.png().toBuffer()).resize(colW[c], rowH[r], {
          fit: "fill",
        });
      }
      pieces.push({ input: await piece.png().toBuffer(), left, top });
      left += colW[c];
    }
    top += rowH[r];
  }

  const flatW = colW.reduce((a, b) => a + b, 0);
  const flatH = rowH.reduce((a, b) => a + b, 0);
  const flat = await sharp({
    create: { width: flatW, height: flatH, channels: 4, background: CLEAR },
  })
    .composite(pieces)
    .png()
    .toBuffer();

  // Tilt back. sharp's negative angle turns anticlockwise, as CSS rotate(-x) does.
  const tilted = await sharp(flat)
    .rotate(-TILT_DEG, { background: CLEAR })
    .png()
    .toBuffer({ resolveWithObject: true });
  const trimmed = await sharp(tilted.data)
    .trim({ threshold: 1 })
    .png()
    .toBuffer({ resolveWithObject: true });
  const offsetLeft = -(trimmed.info.trimOffsetLeft ?? 0);
  const offsetTop = -(trimmed.info.trimOffsetTop ?? 0);
  const outW = trimmed.info.width;
  const outH = trimmed.info.height;

  await sharp(trimmed.data).webp({ quality: 90 }).toFile(OUTPUT);

  // Where the photo window ends up: its centre turns about the canvas centre.
  const boxW = windowW + delta + BLEED.x * 2;
  const boxH = windowH - delta + BLEED.y * 2;
  const cx = WINDOW.x0 + (windowW + delta) / 2;
  const cy = WINDOW.y0 + (windowH - delta) / 2;
  const theta = (-TILT_DEG * Math.PI) / 180;
  const dx = cx - flatW / 2;
  const dy = cy - flatH / 2;
  const rx = dx * Math.cos(theta) - dy * Math.sin(theta);
  const ry = dx * Math.sin(theta) + dy * Math.cos(theta);
  const centreX = tilted.info.width / 2 + rx - offsetLeft;
  const centreY = tilted.info.height / 2 + ry - offsetTop;

  const pct = (v: number, of: number) => Math.round((v / of) * 10000) / 100;
  console.log(`Wrote ${OUTPUT}`);
  console.log(
    JSON.stringify(
      {
        w: outW,
        h: outH,
        aperture: {
          leftPct: pct(centreX - boxW / 2, outW),
          topPct: pct(centreY - boxH / 2, outH),
          widthPct: pct(boxW, outW),
          heightPct: pct(boxH, outH),
          tiltDeg: -TILT_DEG,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
