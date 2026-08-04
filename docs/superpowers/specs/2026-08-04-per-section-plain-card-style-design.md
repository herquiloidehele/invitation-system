# Per-Section Plain Card Style Design

## Summary

Invitation editors can already select a content section in the live preview and override its card background, border, and radius. Extend that per-section model with a `plain` option. When enabled, the selected section keeps its content and layout but loses the decorative card surface: background, border, radius, shadow, and backdrop blur.

This is a per-section setting, not an invitation-wide setting. Repeated instances governed by the same section key share the setting. Existing invitations remain unchanged.

## Goals

- Let an editor make one invitation section visually plain without changing other sections.
- Make the option available through the existing inline card toolbar.
- Apply plain mode consistently to all supported invitation renderers and section variants.
- Preserve an editor's background, border, and radius overrides while plain mode is active so they return when plain mode is disabled.
- Preserve all existing invitation rendering when the new property is absent.

## Non-Goals

- An invitation-wide master switch.
- Independent settings for individual repeated items, such as the first and second venue or individual FAQ rows.
- Removing padding, section spacing, typography, images, separators, animations, buttons, form fields, accordions, or modal/dialog surfaces.
- Introducing more card modes, shadow editors, or backdrop-blur editors.
- Changing theme-level `cardBg` or `cardBorder` values.

## Data Model and Compatibility

Add an optional property to the existing `CardStyle` interface:

```ts
export interface CardStyle {
  cardBg?: string;
  cardBorder?: string;
  borderRadius?: number;
  accentColor?: string;
  plain?: boolean;
}
```

The property lives inside the invitation's existing `cardStyles` JSON value, under a `CardSectionKey`. No Prisma schema or database migration is required.

`plain: true` enables plain mode. Missing, `undefined`, or `false` preserves the current card presentation. This default makes the change backward compatible with every stored invitation.

Existing style overrides are retained when `plain` is enabled. For example, this value remains valid:

```json
{
  "faqs": {
    "cardBg": "#ffffff",
    "cardBorder": "#eadfce",
    "borderRadius": 24,
    "plain": true
  }
}
```

Disabling `plain` restores those saved values without requiring the editor to recreate them.

The supported section keys remain:

- `saveTheDate`
- `ourStory`
- `schedule`
- `dressCode`
- `giftRegistry`
- `location`
- `guestGuide`
- `faqs`
- `countdown`
- `places`

Repeated content shares its section setting. Both venue cards use `location`; all FAQ entries use `faqs`; all countdown units use `countdown`.

## Card Surface Resolution

Introduce a focused card-style utility in `lib/card-styles.ts`. It will expose the plain-state check and produce the decorative surface properties shared by renderers. The utility must distinguish between card decoration and layout.

When plain mode is inactive, renderers retain their existing theme fallbacks, variant-specific radii, shadows, and blur values.

When plain mode is active, the selected section's decorative surface resolves to:

```ts
{
  background: "transparent",
  border: "none",
  borderRadius: 0,
  boxShadow: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
}
```

The utility does not set padding, margin, width, overflow, positioning, or animation properties. Those remain owned by each component. This prevents plain mode from collapsing content or changing the invitation's vertical rhythm.

Some sections have multiple visual variants or repeated surfaces. Every surface that serves as the selected section's card presentation must honor the same `plain` value. Nested interactive elements keep their own affordances. For example, plain FAQ mode removes the FAQ card container while retaining row separators and accordion behavior; plain gift mode removes the section card while retaining gift actions and bank-transfer controls.

## Admin Editor Behavior

Add a `Sem cartão` switch to `CardStyleToolbar` for the currently selected section.

When the switch is enabled:

- Call the existing `updateCardStyle` path with `plain: true`.
- Update the live preview immediately.
- Keep existing `cardBg`, `cardBorder`, `borderRadius`, and `accentColor` values in form state.
- Visually disable the background, border, and radius controls because they do not affect the active presentation.
- Keep spacing controls available because spacing is independent of card decoration.
- Keep accent-color controls available where present because accent color styles content rather than the card surface.

When the switch is disabled, store `plain: undefined` rather than `false`. This follows the existing sparse-override convention and reveals the preserved card styling immediately.

The section reset action clears `plain` together with the section's background, border, and radius overrides. The invitation-level “reset card styles” action continues to remove the entire `cardStyles` object.

## Rendering Scope

The standard invitation renderer and rich external-link renderer already resolve per-section `cardStyles`; both must consume the shared plain-state behavior. Section components that own their shadows or blur must accept or derive the plain state and suppress those properties explicitly.

The implementation inventory must cover:

- Save-the-date variants
- Our story
- Default and illustrated schedules
- First and second locations
- Dress code
- Gift registry
- Guest guide
- FAQ
- External countdown variants
- Places layouts

The setting applies in the admin preview and in the public invitation because both render from the same `InvitationData.cardStyles` value.

The personalized guest card, RSVP form/modal, gift-list product cards, audio player, language switcher, gallery frames, buttons, and dialogs are outside this feature. They are not represented by the listed `CardSectionKey` values and must keep their current surfaces.

## Persistence Flow

No new API branch is necessary. The existing invitation create and update paths sanitize and persist the complete `cardStyles` JSON object. Admin initial-data mapping already casts that JSON to `CardStyleOverrides`, and invitation duplication already copies it.

The implementation must nevertheless add regression tests proving that `plain` survives:

1. Initial admin-data mapping.
2. Invitation creation payload construction.
3. Invitation duplication.

This protects the new property from future allow-listing or sanitization changes.

## Error Handling

The feature introduces no new runtime failure mode or network request. Renderers treat malformed or missing values conservatively: only the literal boolean `true` activates plain mode. Other values behave as the existing card style.

If a section has no card-style entry, it continues to use theme and component defaults. If an invitation renderer does not render a configured section, the stored setting remains inert.

## Testing

Add node-environment Vitest coverage for the pure card-style utility:

- Missing style resolves as non-plain.
- `plain: false` resolves as non-plain.
- Only `plain: true` resolves as plain.
- Plain resolution returns transparent/no-border/no-radius/no-shadow/no-blur decoration.
- Non-plain resolution retains supplied surface values.
- Layout properties are not introduced by the resolver.

Extend persistence tests to verify `plain` is preserved by admin initial-data mapping, creation, and duplication.

Add focused renderer contract tests following the repository's existing source-level test style where direct DOM rendering is unavailable. These tests should assert that each section family consumes the plain state or shared resolver. Vitest remains in the Node environment; this feature does not justify switching the global test environment to jsdom.

Run the focused tests first, followed by `npm test`, `npm run lint`, and `npm run build`. The build command must remain the repository script because it regenerates Prisma and deploys migrations before `next build`.

## Acceptance Criteria

- Selecting any supported section exposes a `Sem cartão` control.
- Enabling it changes only that section and all repeated instances belonging to its section key.
- The selected section has no background, border, rounded card shape, box shadow, or backdrop blur.
- Section content, padding, spacing, typography, images, animation, and interaction remain usable.
- Other sections retain their current styling.
- Disabling the option restores the section's previous card overrides.
- Existing invitations without `plain` render exactly as before.
- The behavior matches between admin preview and public rendering.
- Create, update, load, and duplicate flows preserve the setting.
