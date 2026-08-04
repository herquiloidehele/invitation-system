# Text Case Toolbar Design

## Goal

Add reversible text-case formatting to the floating admin text-style toolbar. An administrator can display the selected element using its original capitalization, uppercase, or lowercase without modifying the stored invitation copy.

## User Interface

Add a compact segmented control after the font-style selector and before text alignment:

- `Aa` — preserve the original capitalization with `text-transform: none`
- `AA` — display uppercase text with `text-transform: uppercase`
- `aa` — display lowercase text with `text-transform: lowercase`

Each button has a Portuguese tooltip and accessible label. The selected explicit override is visually active. If the element inherits its template's case styling, none of the three buttons is active. The toolbar's existing reset action removes the case override along with the other element overrides, restoring the template default.

## Data and Rendering

Extend the shared element-level `TextStyle` type with a typed `textTransform` field supporting `none`, `uppercase`, and `lowercase`. The value is stored in the existing `textStyles.elements` JSON structure; no database migration is required.

The shared text-style resolver applies the property after template defaults, so an explicit value always wins. This is important for `none`: it must be stored as an explicit override so administrators can disable a template's built-in uppercase styling.

The existing provider and form update callbacks already accept string-valued `TextStyle` fields, so invitation, external-invitation, and save-the-date editors continue through the same update path.

## Behavior

Selecting a case button updates only the currently selected text element. The original content remains unchanged. Selecting another case button replaces the previous value. Resetting the selected element removes `textTransform`, allowing the template's default case styling to apply again.

No locale-sensitive content rewriting is performed; rendering uses the browser's CSS text transformation rules.

## Testing

Add resolver coverage proving that:

- `uppercase` is applied to resolved element styles;
- `lowercase` is applied to resolved element styles;
- `none` overrides an uppercase template default;
- an absent override preserves the template default.

Run the focused Vitest test, the full test suite, ESLint, and the repository build command.

## Scope

This change does not edit invitation copy, add title case or sentence case, alter database schema, or redesign unrelated toolbar controls.
