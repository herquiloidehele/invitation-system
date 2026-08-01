# ScratchDateReveal Shape Design

## Goal

Allow invitation administrators to choose whether the three ScratchDateReveal date surfaces render as circles or rounded squares. Existing invitations and new invitations without a saved choice must continue to use circles.

## Scope

- Add an optional `shape` value to the existing `scratchReveal` JSON configuration.
- Expose the choice in both admin sections that configure ScratchDateReveal:
  - rich external invitations;
  - Curtain & Canva invitations.
- Apply the selected shape consistently to the scratch surface and its post-reveal visual layers.
- Preserve the existing scratch interaction and reveal threshold behavior for both shapes.
- Add focused tests for configuration fallback, rendering propagation, and admin forwarding.

## Data contract and compatibility

Extend `ScratchRevealConfig` with:

```ts
shape?: "circle" | "rounded-square";
```

The value remains inside the existing `scratchReveal` JSON column, so no Prisma schema or database migration is required. A missing or invalid value resolves to `circle`. This makes older rows, duplicated invitations, and forms initialized from legacy data safe without backfills.

## Rendering design

`ScratchDateReveal` will resolve the configured shape once and pass it to each `ScratchCoin`. `ScratchCoin` will use one shape definition for all visual and interaction layers:

- canvas texture clipping;
- post-reveal plate clipping/radius;
- SVG inner-shadow overlay;
- scratch coverage calculation used by the reveal threshold.

The circle implementation remains the default path. The rounded-square implementation uses a responsive radius expressed relative to the coin dimensions, keeping the corner treatment visually consistent as the responsive coin size changes. The existing three-column layout, date content, labels, animations, accessibility labels, and glitter texture remain unchanged.

## Admin UI

When ScratchDateReveal is enabled, add a select field beside the existing background-image settings. The options are:

- `Círculo` — default;
- `Quadrado arredondado`.

Changing the select updates `scratchReveal.shape` through the existing form state and save request. The selector should display `Círculo` when the saved value is absent or invalid. Both admin locations use the same field and labels so the setting behaves identically for both supported layouts.

## Testing

Add or extend unit/source-contract tests to verify:

1. missing and invalid shape values resolve to `circle`;
2. `rounded-square` is preserved as the selected shape;
3. ScratchDateReveal forwards the shape into all three coin instances;
4. ScratchCoin uses the chosen shape consistently for clipping and threshold coverage;
5. the admin form exposes and updates the shape field in both ScratchDateReveal sections.

Run the focused Vitest files first, then the full test suite, lint, and the repository-required `npm run build` command. Do not invoke `next build` directly.

## Error handling

The renderer must never fail because of malformed legacy JSON. Shape resolution is defensive and falls back to `circle`. Existing JSON sanitization remains responsible for persistence; no new API endpoint or migration is needed.

## Non-goals

- Arbitrary corner-radius editing.
- Additional shapes beyond circle and rounded square.
- Changes to the separate `ScratchHeart` save-the-date component.
- Refactoring unrelated scratch or invitation rendering code.
