# Admin Preview Image Edit Mode

## Problem

The admin preview renders a fixed interaction overlay for every free-floating
image whenever the invitation has at least one image-layer item. Each overlay
hitbox accepts pointer events above the preview content. A large background
image therefore covers most or all of the preview and prevents the inline text
and card editors underneath from receiving clicks.

The public invitation renderer is not affected because its image bands already
use `pointer-events: none`.

## Goal

Keep background images editable without allowing their transparent admin
hitboxes to disable the rest of the live preview.

## Interaction Design

The **Imagens de fundo** section will expose an explicit image-editing mode.

- Image-editing mode is off by default.
- A button enables or disables image editing in the preview.
- While enabled, the existing image hitboxes, drag behavior, resize handles,
  rotation handle, selection outline, and wheel forwarding remain available.
- While disabled, `ImageLayerEditor` is inactive and renders no interaction
  overlay. Text, card, FAQ, button, and other preview interactions receive
  pointer events normally.
- Uploading a new image selects it and enables image-editing mode so it can be
  positioned immediately.
- Disabling the mode preserves the selected image and its inspector controls;
  it only removes the preview interaction overlay.
- Removing the last image disables image-editing mode because there is nothing
  left to manipulate.

The same behavior applies to the standard invitation form and the external
invitation form.

## Implementation Boundaries

Each admin form owns a local `imageEditing` boolean alongside its existing
`selectedImageId` state. The form passes `active={hasImageItems &&
imageEditing}` to `ImageLayerEditor`.

The **Imagens de fundo** controls receive the mode button and updated guidance.
The uploader's existing `onAdded` callback will both select the new image and
enable the mode. No image geometry, persistence format, public rendering, or
database schema changes are required.

The interaction overlay itself remains unchanged except for any minimal API
adjustment needed to express the gated active state. Avoid dynamic click
forwarding or element-under-pointer heuristics; the mode boundary is the sole
owner of pointer-event priority.

## State and Edge Cases

- Invitations with no image-layer items cannot enable image-editing mode.
- If the last item is deleted, the active overlay disappears immediately.
- Switching preview tabs or editing unrelated form fields does not modify the
  image selection or mode unless the image list becomes empty.
- Existing invitations with large, behind-content images load with normal
  preview interaction available because the mode starts disabled.
- Front-of-content and behind-content images use the same editing-mode gate.

## Testing

Add a small pure mode predicate or equivalent testable boundary and cover:

- items present plus mode enabled activates the editor;
- items present plus mode disabled keeps it inactive;
- no items keeps it inactive regardless of the requested mode.

Add integration-level source or component coverage, following the repository's
Node-only Vitest conventions, to confirm both admin forms use the gated active
state and enable the mode after upload. Run the focused tests first, then the
full Vitest suite and ESLint. Because there is no DOM test environment, final
manual verification should exercise a large background image in the admin
preview and confirm that text selection works after leaving image-edit mode.

## Out of Scope

- Changes to public invitation image layering.
- Changes to image placement, resizing, rotation, cropping, or z-order.
- Automatic hit-testing between overlapping images and editable preview
  elements.
- A broader global editing-mode framework for text, cards, and images.
