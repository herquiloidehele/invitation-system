# Save the Date Inline Countdown and Shared Banner Background

## Goal

Add a new Save the Date presentation option that renders the live wedding countdown as a horizontal layout matching the supplied reference: large `DD:HH:MM:SS` values with unit labels beneath. Separately, allow one shared Save the Date background image to be applied to any Save the Date layout.

## Approved direction

The new option is a dedicated `inline-countdown` `SaveDateStyle`; it controls only the countdown geometry. The image-backed banner is an independent Save the Date surface setting, stored as `saveTheDateBackgroundImageUrl`, so one configured image can be used with classic, countdown, quad-cards, cinematic, minimal-line, or inline-countdown layouts.

## Architecture

- Extend the existing `SaveDateStyle` union and admin style picker with `inline-countdown`.
- Add `saveTheDateBackgroundImageUrl String?` to `Invitation`, with a Prisma migration, and thread it through the existing invitation form/API/duplicate/preview data paths.
- Add `saveTheDateBackground` to `ImageSettingsKey`; the existing image position/zoom editor controls the shared background crop.
- Add a focused `SaveTheDateInlineCountdown` renderer beside the current countdown variant. It reuses `computeCountdownTimeLeft`, `formatCountdownValue`, `CountdownUnit`-style editable text, `SaveLabel`, `CalendarCTA`, and the existing zero-state celebration behavior.
- Apply the shared Save the Date background at the common surface layer used by every Save the Date style. The layout-specific renderer remains responsible only for its internal content and geometry, so selecting a different style does not discard or reinterpret the configured image.
- Use the existing `countdownValue` and `countdownLabel` resolved text styles so role-level and inline element-level font/color/size controls work without a second customization vocabulary. Values use tabular numerals and the inline countdown's display font fallback; labels use the existing UI font fallback.

## Visual behavior

- The shared Save the Date surface is a rounded, overflow-hidden container using the existing per-section `cardStyles.saveTheDate` radius and border values.
- When `saveTheDateBackgroundImageUrl` is present, the image fills that surface with `object-fit: cover` and the `saveTheDateBackground` position/zoom settings. A restrained translucent readability wash sits above the image; when no image is configured, the existing card background remains visible. The same configured image works with every Save the Date layout.
- The countdown row is a single horizontal sequence of four values separated by animated colons. Each value is two digits, including days, and each unit label is uppercase below its value.
- The layout is responsive: value and label groups shrink through CSS clamp-style sizing and spacing; the four groups remain in one row on narrow invitation widths without horizontal scrolling.
- The inline countdown keeps the existing Save the Date label and calendar CTA. Date context is omitted from its body because the countdown is the focal information; other layouts retain their existing date context.
- If the countdown reaches zero, show the existing celebration title/couple content in the inline countdown instead of a stale timer. The shared background image and readability wash still apply.
- Respect reduced motion by keeping existing Framer Motion animations disabled or minimized through the component's established preview/in-view behavior; the ticking value must remain readable without animation.

## Customization contract

- `textStyles.elements.countdownValue` controls countdown number font family, size, weight, color, and letter spacing.
- `textStyles.elements.countdownLabel` controls unit-label font family, size, weight, color, and letter spacing.
- `textStyles.colors.textPrimary`, `textStyles.colors.textMuted`, `textStyles.colors.accent`, and the theme role fonts remain the fallback values through `resolveTextStyles`.
- `cardStyles.saveTheDate.cardBorder` and `cardStyles.saveTheDate.borderRadius` continue to control the outer card. `cardBg` is used when no banner image is configured.
- The admin image upload is a shared Save the Date surface control, independent of the selected Save the Date layout, and provides the same clear/upload/position/zoom experience as the cinematic image control.

## Data flow

1. Admin form state stores `saveTheDateBackgroundImageUrl` and `imageSettings.saveTheDateBackground`.
2. The invitation save endpoint persists the nullable URL and existing JSON image settings. Existing invitations default to no URL and are unaffected.
3. `InvitationPage` passes the resolved `imageSettings` and invitation object to `SaveTheDateSection`.
4. `SaveTheDateSection` creates the shared Save the Date surface, applies the optional background image, and dispatches `inline-countdown` to the new renderer when selected.
5. The renderer computes the live time every second and renders editable values/labels using the resolved text-style system.

## Error and compatibility behavior

- Missing or blank shared image URL falls back to the normal card background for whichever layout is selected.
- Invalid/missing date data uses the existing `computeCountdownTimeLeft` zero result and existing celebration behavior; no new error surface is introduced.
- Existing `classic`, `countdown`, `quad-cards`, `cinematic`, and `minimal-line` styles retain their current rendering and data defaults.
- Duplication and edit/create initial-data paths must preserve the shared URL when present and use `undefined`/empty-string conventions already used by the invitation form for absent media.

## Testing and verification

- Add a failing pure-function or data-shape test for the new style/image field path before implementation, following the repository's Node/Vitest constraints.
- Extend static/admin persistence tests that enumerate invitation fields so the new nullable field is accepted and duplicated.
- Run the focused tests during the red/green cycle, then run `npm test`, `npm run lint`, and `npm run build` (the project-required build command) before claiming completion.
- Manually inspect the admin preview at desktop and narrow widths, including an image-backed banner, no-image fallback, custom number/label text styles, and countdown zero state.

## Scope exclusions

- No generalized background-image support for every unrelated card section.
- No separate background image per Save the Date layout.
- No new separate color picker or font editor; the existing text-style and card-style controls are the customization surface.
- No change to the separate `ExternalCountdownConfig` used by external-link invitation pages.
