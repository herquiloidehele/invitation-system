# Elegant Floral theme artwork

## damask.webp — page background

The damask pattern tiled behind the whole post-envelope page. Wired up in
`lib/elegant-floral.ts` (`EF_BACKGROUND_PATTERN`) and applied to the page root
in `components/elegant-floral/ElegantFloralPage.tsx`.

| File | px | size | role |
|---|---|---|---|
| damask-source.webp | 941 × 1672 | 12 KB | original artwork, kept for re-derivation |
| damask.webp | 1882 × 1288 | 22 KB | the seamless tile actually shipped |

### Why the shipped tile is not the original

The source does not tile. Measured against itself, the wrap discontinuity is
~2.2 luminance levels horizontally and ~2.0 vertically — and the entire pattern
only spans 9 levels (244–253, stddev 1.71). So a raw `background-repeat` shows
a faint grid **more clearly than the ornament itself**.

`damask.webp` fixes both axes:

- **Vertically** — the artwork has a true repeat period at 1288px (found by
  autocorrelation). Cropping there, then cross-fading a 160px overlap across the
  wrap, drops the vertical seam from 1.95 to 0.29.
- **Horizontally** — there is no repeat period; the render is cropped mid-motif.
  So the tile is a mirrored pair: the crop, plus its horizontal flip. The seam is
  then 0.00 by construction. Damask is bilaterally symmetric anyway, so the
  mirror reads as ordinary wallpaper.

This is why `EF_BACKGROUND_TILE_WIDTH` is 840 and not 420 — the tile holds two
motifs side by side, so it must be displayed at twice the intended motif width.

### Re-deriving it

```python
from PIL import Image, ImageOps
import numpy as np

src = Image.open("damask-source.webp").convert("RGB")
W, H = src.size
PERIOD, OVERLAP = 1288, 160

a = np.asarray(src.crop((0, 0, W, PERIOD + OVERLAP)), dtype=np.float64)
ramp = (np.arange(OVERLAP) / OVERLAP).reshape(OVERLAP, 1, 1)
a[:OVERLAP] = a[:OVERLAP] * ramp + a[PERIOD:PERIOD + OVERLAP] * (1 - ramp)
half = Image.fromarray(np.clip(a[:PERIOD], 0, 255).astype(np.uint8))

tile = Image.new("RGB", (W * 2, PERIOD))
tile.paste(half, (0, 0))
tile.paste(ImageOps.mirror(half), (W, 0))
tile.save("damask.webp", "WEBP", quality=86, method=6)
```

`tests/elegant-floral.test.ts` asserts both files exist, so a rename or deletion
fails the suite instead of shipping a broken image URL.
