# Timed Video Hero Text Design

## Goal

Allow every custom, free-positioned hero text block to appear and optionally disappear at configured video timestamps, while preserving the existing always-visible behavior by default.

## Scope

This feature applies only when the hero uses video media. Image heroes continue to display every custom hero text block immediately, even if a block contains timing data.

The feature covers all public hero variants that render `HeroTextOverlay` over video media. It does not change the timing of built-in hero content such as couple names, quotes, or calls to action.

## Data Model

`HeroTextBlock` gains two optional JSON properties:

- `startSeconds?: number`: elapsed video time at which the block first appears.
- `endSeconds?: number`: elapsed video time at which the block disappears.

Times are stored as total seconds and may include a fractional component, although the initial editor uses whole minutes and seconds.

The valid configurations are:

- Neither value: display immediately using the current behavior.
- Start only: hide initially, display after the start threshold, and remain displayed.
- Start and end: hide initially, display after the start threshold, then hide permanently after the end threshold.
- End only: invalid and normalized to the current always-visible behavior by dropping the end value.

When both values exist, `endSeconds` must be greater than `startSeconds`. Normalization drops invalid, negative, or non-finite values. If the end value is invalid relative to a valid start, normalization retains the start and drops the end.

New blocks and existing persisted blocks omit both timing properties. Duplicating a block copies its timing configuration along with its other styling and placement properties.

## Admin Editor

`HeroTextEditor` receives an explicit indication that the edited hero media is a video. The invitation forms derive this from the existing video URL and pass it to the editor.

For video heroes, the selected block inspector includes:

- “Aparecer” minute and second inputs.
- “Desaparecer (opcional)” minute and second inputs.

Both timestamp groups are blank by default. Entering either part of the start timestamp defines a start time; a blank part is treated as zero. The same rule applies to the end timestamp. Clearing both fields removes that timestamp from the block.

Minutes and seconds accept non-negative whole numbers, with seconds limited to 0–59. The editor shows an inline validation message when the end timestamp is not later than the start timestamp and does not persist the invalid end value. Timing controls are omitted for image heroes.

The design-surface preview remains static: all blocks stay visible so they can be selected, positioned, and edited regardless of their configured timestamps.

## Playback Behavior

The video element is the source of truth. The overlay observes its playback time rather than using independent wall-clock or CSS timers, keeping text synchronized through pauses, buffering, playback-rate changes, and seeking.

Each timed block has a first-play lifecycle that lasts until the page is refreshed:

1. A block with a start time begins hidden.
2. The first observed video time at or beyond its start marks it as started and reveals it.
3. The first observed video time at or beyond its end marks it as ended and hides it.
4. Started and ended markers are monotonic. Rewinding, replaying, or looping the video never clears them.

Consequently:

- A start-only block remains visible after it starts, including across later loops.
- A start-and-end block remains hidden after it ends, including across later loops.
- Seeking directly past both thresholds ends the block without briefly revealing it.
- A video already beyond a threshold when the overlay attaches is evaluated immediately against its current time.

Untimed blocks keep the current entrance behavior. Timed blocks use the existing entrance animation when they first start. A timed block with an end uses a short opacity fade when it ends. Reduced-motion users receive the same visibility timing without movement and without a prolonged transition.

## Component Boundaries and Data Flow

Pure timing helpers in `lib/hero-text.ts` normalize timestamps and calculate a block's next monotonic playback state. Keeping this logic outside React makes boundary cases testable in the existing Node-only Vitest environment.

`HeroTextOverlay` accepts an optional video reference. When no reference is supplied, it renders statically as it does today. With a reference, it subscribes to playback events, evaluates the blocks against `video.currentTime`, and renders each block from its lifecycle state.

Each video-based hero host passes the reference for the same video displayed beneath the overlay. Hosts that render image media do not pass a video reference. No database migration is required because `heroTextLayer` is already stored as JSON.

## Error Handling and Compatibility

- Missing timing properties preserve current behavior.
- Invalid persisted timing data is normalized defensively and never causes a rendering error.
- A missing or not-yet-mounted video reference leaves untimed text visible and timed text hidden until the video can be evaluated.
- Timing state resets only when the overlay is remounted for a new page load or a different invitation/video, not when playback loops.
- Translation, duplication, and API JSON sanitization continue carrying the additional block properties without schema-specific database work.

## Testing

Tests will be added or extended to cover:

- Backward-compatible normalization for blocks without timing.
- Valid start-only and start/end normalization.
- Rejection of end-only, negative, non-finite, and end-before-start values.
- Minute/second conversion and editor update behavior through pure helpers.
- Initial, started, and ended playback states at exact threshold boundaries.
- Seeking past both thresholds.
- Rewind and loop behavior after a block has started or ended.
- Untimed blocks retaining current static and animated rendering behavior.
- Timed overlay rendering with normal and reduced motion.
- Video hosts supplying their displayed video's reference to the overlay.
- The complete Vitest suite, ESLint, and the project build command.

## Out of Scope

- Repeating text on every video loop.
- Multiple appearance intervals for one block.
- Timing built-in hero text.
- A live-playing video inside the admin design surface.
- Millisecond-level editor controls.
