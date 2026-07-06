# Invitation spacing controls design

Date: 2026-07-06

## Goal

Give admins precise control over vertical spacing in invitations. They should be able to increase or decrease spacing above and below both whole sections and individual editable elements without changing existing invitations until they opt in.

## Scope

This feature adds:

- Section spacing controls with separate `spaceBefore` and `spaceAfter` values.
- Element spacing controls with separate `spaceBefore` and `spaceAfter` values.
- Persistence for spacing settings on each invitation.
- Rendering support in invitation previews and public invitation pages.
- Sensible defaults so existing invitation pages keep their current visual spacing.

The first implementation should prioritize the existing admin invitation editor and the shared invitation rendering paths used by current invitations. Template-specific renderers should consume the same spacing helpers where they expose editable sections or elements.

## Data model

Add a new optional `spacingStyles` JSON field to invitations.

```ts
type SpacingValue = {
  spaceBefore?: number
  spaceAfter?: number
}

type SpacingStyleOverrides = {
  sections?: Record<string, SpacingValue>
  elements?: Record<string, SpacingValue>
}
```

Values are pixel numbers. Missing values mean "use the current default spacing from the template."

The admin API should sanitize this field before saving:

- accept only finite numbers;
- clamp to a safe range, for example `-80` to `160`;
- drop empty entries;
- preserve unknown section or element keys only if they are strings, so future templates can store their own keys.

## Admin editing UX

The existing invitation preview already has editable text/card selection patterns. Spacing should follow the same mental model:

- When an editable section is selected, show section spacing controls.
- When an editable element is selected, show element spacing controls.
- Controls expose two independent values: "Above" and "Below."
- Changes apply live in the preview and are saved with the invitation.

The UI can use compact number inputs with increment/decrement buttons, or sliders plus numeric inputs. The important behavior is direct, reversible adjustment rather than a single global spacing scale.

## Rendering behavior

Create small shared helpers for resolving spacing:

- `getSectionSpacing(spacingStyles, sectionKey)`
- `getElementSpacing(spacingStyles, elementKey)`
- `spacingToStyle(value)`

Renderers should apply spacing with inline `marginTop` and `marginBottom` only when an override exists. This avoids disturbing the template's existing Tailwind spacing classes and keeps old invitations visually stable.

For editable text-like elements, the spacing wrapper should live around the editable element rather than being merged into text typography styles. Spacing is layout, not typography.

## Compatibility and migration

Existing invitations have no `spacingStyles`, so they render exactly as they do today.

Adding a top-level JSON field requires updating:

- Prisma schema;
- invitation admin initial-data mapping;
- create/update admin API routes;
- invitation type definitions;
- admin form state and payload;
- invitation preview/public renderer props.

No backfill is required.

## Testing

Add or update tests for:

- spacing sanitization, including invalid values and clamping;
- admin API persistence of `spacingStyles`;
- resolver behavior for missing, section, and element spacing values;
- at least one renderer path proving spacing overrides become `marginTop`/`marginBottom` styles while missing values keep defaults.

Manual verification:

- open an existing invitation and confirm it looks unchanged;
- adjust a section's above/below spacing and save;
- adjust an element's above/below spacing and save;
- reload the admin editor and public invitation page to confirm persistence.

## Non-goals

- Horizontal spacing controls.
- Global template-wide spacing scale.
- Drag-and-drop repositioning.
- Per-breakpoint spacing values.
- Reworking template visual defaults.

