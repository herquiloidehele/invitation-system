# Section-Anchored Background Images

## Problem

Free-floating invitation images currently use `xPct` and `yPct` relative to the
entire invitation canvas. The public invitation and admin preview can have
different total heights because the preview renders sample guest content and
because responsive text or conditional sections may differ.

For `patricia-marcos`, the public canvas is 6,287px tall. Its floating image is
stored at `yPct: 63.8288`, which places it at approximately 3,943px while the
Dress Code section starts at approximately 3,964px. The taller admin preview
places the same percentage farther down, where the user intended it.

The image must keep the same visual relationship to the intended section in
the preview and public page without losing the ability to place it anywhere.

## Chosen Design

Use invitation sections as stable coordinate frames. A section anchor defines
how an image's percentage coordinates are interpreted; it does not clip or
confine the image.

Each anchored image stores:

- `sectionKey`: the section that supplies its coordinate frame;
- `xPct` and `yPct`: the image center relative to that section's width and
  height;
- the existing width, aspect, rotation, crop, opacity, shadow, and stacking
  properties.

Coordinates remain allowed outside the normal `0..100` range, using the
existing `-50..150` position limits. Section hosts use visible overflow.
Therefore an image may overlap neighbouring sections or sit substantially
outside its anchor.

When an image is dragged into another section, the editor changes its
`sectionKey` and recalculates its local coordinates so its screen position does
not jump. This makes free placement feel page-wide while preserving stable
rendering when content elsewhere changes height.

## Rendering Architecture

`SectionImageHost` becomes the shared renderer for section-relative images.
Every supported section in the standard invitation page receives one stable,
full-width host with `data-section-key`.

The host:

- establishes a relative positioning context;
- renders negative-`z` images behind the section content;
- renders non-negative-`z` images above the section content;
- keeps overflow visible;
- remains present when no images are assigned so the editor can measure it.

`ImageCanvas` remains the outer page coordinate frame and editor discovery
root. It accepts the section keys hosted by the current renderer. It renders
legacy images without a `sectionKey` plus items whose stored section is not
hosted by that renderer. Items assigned to a hosted section are rendered only
by their matching `SectionImageHost`, which prevents duplicate images and
provides the absent-section fallback.

Section hosts must wrap individual logical sections, including Dress Code and
Gift Registry separately even though they currently share an outer layout
container. This gives each image a coordinate frame whose dimensions change
only with its own content.

The existing entrance and external layouts continue using the legacy page-wide
canvas until they receive equivalent stable section hosts. They do not pass
hosted section keys to `ImageCanvas`, so all their items retain the current
layering behaviour. This change targets the standard invitation renderer where
the reported mismatch occurs.

## Editor Behaviour

The editor measures both `[data-image-canvas]` and all
`[data-section-key]` hosts.

For an anchored image, drag, resize, and rotation calculations use its current
section rectangle. Width percentage is also relative to that full-width host,
so visual sizing remains consistent with the existing page-wide calculation.

During dragging:

1. Calculate the image center in viewport pixels.
2. Select the section containing that center.
3. If no section contains it, select the nearest section by vertical distance.
4. Convert the same pixel center into percentages of the selected section.
5. Update `sectionKey`, `xPct`, and `yPct` together.

Because sections are ordered vertically and use visible overflow, the image can
be dragged continuously across all sections without snapping or clipping.

New uploads are anchored to the section at the centre of the currently visible
preview area. If no section occupies that point, the nearest section is used.

## Legacy Image Migration

Existing items without `sectionKey` remain readable and render with the old
page-wide behaviour until converted.

When image editing opens, the editor converts each legacy item using the
current admin preview, which is the source of the user's intended placement:

1. Resolve its existing page-wide pixel centre and pixel width.
2. Find the containing or nearest section.
3. Convert the centre and width to that section's coordinate system.
4. Store the inferred `sectionKey` and converted geometry in form state.

The conversion must preserve the image's current preview position exactly.
The migrated values are persisted with the invitation's normal Save action; no
database schema migration is needed because the layer is already stored as
JSON.

## Data Compatibility and Validation

`normalizeImageLayer` continues accepting missing or invalid `sectionKey`
values. A valid key is retained; an invalid or missing key is treated as a
legacy page-wide item.

No Prisma migration is required.

Existing limits for position, width, aspect, rotation, opacity, crop, and
stacking remain unchanged.

If a stored anchor refers to a section that is currently disabled or absent,
the renderer falls back to the legacy page-wide canvas for that item. The
editor re-anchors it to the nearest available section the next time image
editing opens.

## Failure Handling

- If the preview canvas cannot be measured, leave the item unchanged.
- If no section hosts are available, retain page-wide behaviour.
- If a section disappears while editing, use the nearest remaining section
  while preserving the image's pixel position.
- Conversion must be idempotent: already anchored items are not migrated again.

## Testing

Add unit tests before implementation for:

- selecting the containing section for a point;
- selecting the nearest section when a point is between or outside sections;
- converting page coordinates to section coordinates while preserving pixel
  position and width;
- re-anchoring between sections without a pixel jump;
- retaining out-of-range coordinates needed for cross-section spill;
- filtering items for hosted sections out of the legacy `ImageCanvas` overlay;
- rendering an anchored image only in its matching `SectionImageHost`;
- falling back to the page canvas when its section is not hosted by the current
  renderer;
- preserving legacy items through normalization.

Run the focused Vitest tests, the complete test suite, ESLint, and the project
build. Finally, open `http://localhost:3000/patricia-marcos`, migrate/save its
legacy image through the editor, and verify that the image retains its Dress
Code placement on the public page at the 500px invitation width and a narrower
mobile viewport.
