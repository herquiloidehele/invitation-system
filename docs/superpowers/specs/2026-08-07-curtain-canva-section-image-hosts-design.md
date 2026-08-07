# CurtainCanva Section Image Hosts Design

## Problem

`CurtainCanvaPage` renders free-floating invitation images through one page-wide
`ImageCanvas`. Each legacy image stores its vertical position as a percentage of
the canvas's full height. The Canva section has zero layout height while the
curtain is closed, then expands to its measured iframe height after reveal. It
also scales substantially between the admin preview and a guest's mobile
viewport. These height changes move page-relative images by hundreds or
thousands of pixels.

Images sent behind content can also land underneath the opaque Canva iframe.
The image file is loaded, but it is not visible. The affected production
invitation confirms both behaviors; its assets and persisted image metadata are
present and valid.

## Goal

Make CurtainCanva free-floating images retain their intended position across
the curtain reveal, Canva measurement changes, and responsive viewport sizes.
Use the same section-host architecture already established by
`InvitationPage`, and migrate existing page-relative image records without an
automatic production database write.

## Architecture

`CurtainCanvaPage` will follow the `InvitationPage` pattern:

1. `ImageCanvas` remains the outer page canvas and receives
   `hostedSectionKeys`.
2. Every supported, rendered section is wrapped in `SectionImageHost`.
3. A pure helper returns the section keys that are actually present for the
   current invitation.
4. `ImageCanvas` renders only unhosted legacy items; hosted items render inside
   their matching section.

The existing `ImageLayerEditor` migration converts page-relative pixel geometry
into the nearest measured section's percentage geometry. CurtainCanva adds a
readiness gate so this conversion cannot run while the Canva section is still
collapsed or awaiting its first valid measurement.

## Section Mapping

Existing section keys will be reused when their meaning matches:

- `hero` — `CurtainsHero`
- `countdown` — `ExternalCountdownSection`
- `coupleGallery` — `CoupleGallery`
- `places` — `PlacesSection`

The shared image-layer key union will gain these semantic keys:

- `scratchReveal` — `ScratchDateReveal`
- `personalGuestCard` — the editable personal guest card wrapper
- `canvaDetails` — `CanvaEmbed`
- `rsvp` — the inline RSVP section

`RevealableExternalSections` is shared by CurtainCanva and VideoEntrance. It
will accept the image layer and render the same section hosts in both layouts.
Each parent page will pass the exact hosted-key list to `ImageCanvas`. This
keeps ownership unambiguous and prevents the same image from rendering both in
a section and on the page-wide fallback canvas.

Conditional hosts are included only when their section is rendered. The helper
must use the same conditions as `RevealableExternalSections`, including scratch
enablement, countdown enablement, guest-card visibility, gallery visibility,
external-link presence, places visibility, and RSVP enablement.

## Migration and Readiness

Legacy items have no `sectionKey`. Migration remains an admin-editor operation:

1. Measure the page canvas and all rendered `data-section-key` hosts.
2. Resolve each legacy image's current centre and width in pixels.
3. Select the containing section, or the nearest section when the centre lies
   in a gap.
4. Convert the same pixel centre and width into that section's percentages.
5. Update the form's `imageLayer`; persistence occurs only when the admin uses
   the normal Save action.

The canvas will expose whether section geometry is ready for migration.
Standard `InvitationPage` canvases are ready immediately. CurtainCanva and
VideoEntrance canvases become ready after reveal. When an enabled Canva embed
is present, readiness additionally requires its first non-zero measured content
height. If there is no Canva embed, reveal alone is sufficient.

The editor must not migrate while readiness is false. Uploading before reveal
still works: the new image is anchored to the measurable hero host. Lower-page
images can be added after reveal, when those sections are reachable and stable.

Migration is idempotent because items with a valid `sectionKey` are skipped.
No API route, schema migration, or background database mutation is required.

## Layering

`SectionImageHost` keeps the established signed stacking model:

- `z < 0` renders behind the section's content.
- `z >= 0` renders in front of the section's content.

The page-level `frontLayerPosition="interleaved"` remains in place for unhosted
legacy items so curtain and entrance cover surfaces continue to protect the
initial reveal. Hosted hero images use the hero section's local stacking
context; unrevealed curtain/video surfaces remain promoted above them using the
existing hero z-index behavior.

A behind-content image anchored to an opaque Canva document may still be
occluded by that document, which is correct for the selected stacking mode.
The migration fixes the affected large background by anchoring it to its actual
nearest section instead of allowing full-page height changes to push it beneath
the iframe.

## Data Flow

The persisted `InvitationData.imageLayer` format remains JSON-compatible.
Existing records remain valid because `sectionKey` is optional. Newly migrated
or uploaded images use the expanded key union.

The public data loaders and admin update route already round-trip `imageLayer`
as JSON, so they require no behavioral changes. Normalization will accept the
new keys through `IMAGE_LAYER_SECTION_KEYS`.

## Error and Edge-Case Handling

- A missing or invalid image URL retains the renderer's current broken-resource
  behavior; this change does not alter uploads or URL validation.
- A section absent from the current layout is not reported as hosted, so its
  image falls back to `ImageCanvas` rather than disappearing.
- Zero-height section rectangles are excluded from migration targets.
- A Canva measurement that has not produced a positive height keeps migration
  paused instead of converting against fallback geometry.
- Switching themes preserves image data. On the next editor session, unhosted
  items can be reassigned using the rendered layout's available hosts.
- Public rendering never mutates invitation data.

## Testing

Automated coverage will verify:

1. The CurtainCanva hosted-key helper returns only rendered sections and keeps
   DOM order.
2. CurtainCanva and VideoEntrance pass hosted keys to `ImageCanvas` and pass the
   image layer into shared external sections.
3. Shared external sections emit the expected `SectionImageHost` wrappers.
4. Migration does not run before layout readiness.
5. Migration excludes zero-height anchors and preserves image centre and width
   when converting from canvas coordinates to section coordinates.
6. Hosted images render exactly once and retain front/behind stacking.
7. Existing image-canvas, section-host, and geometry tests remain green.

Verification will run the focused Vitest files first, followed by `npm test`,
`npm run lint`, and `npm run build` as the final integration check.

## Out of Scope

- Editing or deleting production invitation records directly.
- Changing Canva proxy behavior or the iframe measurement algorithm.
- Changing the visual design of the curtain, Canva content, or RSVP form.
- Automatically saving an admin form after migration.
- Replacing the existing signed z-index model.
