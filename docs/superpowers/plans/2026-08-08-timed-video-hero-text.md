# Timed Video Hero Text Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each custom hero text block appear at an optional video start timestamp and disappear at an optional end timestamp exactly once per page load.

**Architecture:** Store optional total-second timestamps on the existing JSON-backed `HeroTextBlock`. Put normalization, minute/second conversion, and monotonic playback transitions in a new pure timing module; let `HeroTextOverlay` subscribe to the displayed video's clock and render blocks from those states. Video hero hosts pass their existing video refs, while image hosts omit the ref and retain static behavior.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Framer Motion, shadcn/ui, Vitest.

## Global Constraints

- Missing start and end timestamps must preserve the current always-visible behavior.
- End time is optional; end-only timing is invalid.
- Start-only text appears once and remains visible across later video loops.
- Start-and-end text hides permanently after its first end threshold, including across rewinds and loops, until page refresh.
- Seeking past both thresholds ends the text without briefly revealing it.
- Image heroes ignore timing data and display all custom hero text normally.
- The admin design surface remains static so every block can still be selected and edited.
- Store timing inside the existing `heroTextLayer` JSON; do not add a Prisma column or migration.
- Preserve the unrelated, uncommitted hero-video audio work currently present in the worktree. Stage only feature-specific hunks when a touched file also contains those changes.

---

## File Structure

- Create `lib/hero-text-timing.ts`: pure timestamp normalization/conversion, playback-state transitions, and video-clock subscription.
- Create `tests/hero-text-timing.test.ts`: exhaustive unit tests for the timing domain.
- Modify `lib/types.ts`: add optional timing properties to `HeroTextBlock`.
- Modify `lib/hero-text.ts`: normalize timing properties while coercing persisted JSON.
- Modify `tests/hero-text.test.ts`: prove backward-compatible and defensive normalization.
- Create `components/admin/HeroTextTimingFields.tsx`: focused minute/second editor and validation UI.
- Modify `components/admin/HeroTextEditor.tsx`: show timing fields only for video heroes.
- Modify `app/admin/invitations/InvitationForm.tsx`: tell the editor whether the hero uses video.
- Modify `app/admin/invitations/ExternalInvitationForm.tsx`: tell the external editor whether the hero uses video.
- Create `tests/hero-text-editor-timing.test.ts`: test conversion helpers and form/editor wiring without requiring a DOM test environment.
- Modify `components/shared/HeroTextOverlay.tsx`: observe video time and render monotonic per-block visibility with entrance/exit animation.
- Modify `tests/hero-text-overlay.test.ts`: prove untimed compatibility and timed initial visibility.
- Modify `tests/hero-text-overlay-reduced-motion.test.ts`: prove reduced motion respects timing without animated movement.
- Modify `components/shared/InvitationHero.tsx`: pass the direct or prefetched hero video ref to the overlay.
- Modify `components/video-entrance/VideoEntranceHero.tsx`: pass its displayed video ref to the overlay.
- Modify `components/curtain-canva/CurtainsHero.tsx`: own the background hero-video ref and pass it to the background video and overlay.
- Modify `components/curtain-canva/CurtainHeroVideo.tsx`: accept the parent-owned video ref while retaining the in-progress muted-audio behavior.
- Create `tests/hero-text-video-wiring.test.ts`: assert all video hero variants connect the displayed video clock to the overlay.

---

### Task 1: Timing Domain and Persisted Block Normalization

**Files:**

- Create: `lib/hero-text-timing.ts`
- Create: `tests/hero-text-timing.test.ts`
- Modify: `lib/types.ts` in `HeroTextBlock`
- Modify: `lib/hero-text.ts` in `normalizeBlock`
- Modify: `tests/hero-text.test.ts` in `normalizeHeroTextLayer`

**Interfaces:**

- Produces: `HeroTextPlaybackState = "waiting" | "visible" | "ended"`.
- Produces: `normalizeHeroTextTimes(start: unknown, end: unknown): { startSeconds?: number; endSeconds?: number }`.
- Produces: `secondsToHeroTextTimeParts(value?: number): { minutes: string; seconds: string }`.
- Produces: `heroTextTimePartsToSeconds(minutes: string, seconds: string): { value?: number; error?: string }`.
- Produces: `initialHeroTextPlaybackState(block: Pick<HeroTextBlock, "startSeconds">): HeroTextPlaybackState`.
- Produces: `advanceHeroTextPlaybackState(block, previous, currentTime): HeroTextPlaybackState`.
- Produces: `subscribeToHeroTextVideoTime(video, listener): () => void`.

- [ ] **Step 1: Write failing timestamp and playback-state tests**

Create `tests/hero-text-timing.test.ts` with real helper calls covering exact boundaries and monotonic behavior:

```ts
import { describe, expect, it, vi } from "vitest";

import {
  advanceHeroTextPlaybackState,
  heroTextTimePartsToSeconds,
  initialHeroTextPlaybackState,
  normalizeHeroTextTimes,
  secondsToHeroTextTimeParts,
  subscribeToHeroTextVideoTime,
} from "@/lib/hero-text-timing";

describe("normalizeHeroTextTimes", () => {
  it("preserves a valid start and optional later end", () => {
    expect(normalizeHeroTextTimes(65, 90)).toEqual({
      startSeconds: 65,
      endSeconds: 90,
    });
    expect(normalizeHeroTextTimes(65, undefined)).toEqual({
      startSeconds: 65,
    });
  });

  it("drops end-only and invalid values", () => {
    expect(normalizeHeroTextTimes(undefined, 20)).toEqual({});
    expect(normalizeHeroTextTimes(-1, 20)).toEqual({});
    expect(normalizeHeroTextTimes(Number.NaN, 20)).toEqual({});
  });

  it("keeps a valid start but drops an end that is not later", () => {
    expect(normalizeHeroTextTimes(10, 10)).toEqual({ startSeconds: 10 });
    expect(normalizeHeroTextTimes(10, 9)).toEqual({ startSeconds: 10 });
  });
});

describe("hero text minute/second conversion", () => {
  it("round-trips whole minutes and seconds", () => {
    expect(secondsToHeroTextTimeParts(125)).toEqual({
      minutes: "2",
      seconds: "5",
    });
    expect(heroTextTimePartsToSeconds("2", "5")).toEqual({ value: 125 });
  });

  it("treats two blank fields as unset and one blank field as zero", () => {
    expect(heroTextTimePartsToSeconds("", "")).toEqual({ value: undefined });
    expect(heroTextTimePartsToSeconds("1", "")).toEqual({ value: 60 });
    expect(heroTextTimePartsToSeconds("", "5")).toEqual({ value: 5 });
  });

  it("rejects negative, fractional, non-numeric, and seconds over 59", () => {
    expect(heroTextTimePartsToSeconds("-1", "0").error).toBeTruthy();
    expect(heroTextTimePartsToSeconds("1.5", "0").error).toBeTruthy();
    expect(heroTextTimePartsToSeconds("x", "0").error).toBeTruthy();
    expect(heroTextTimePartsToSeconds("0", "60").error).toBeTruthy();
  });
});

describe("hero text playback state", () => {
  const startOnly = { startSeconds: 5 };
  const interval = { startSeconds: 5, endSeconds: 8 };

  it("starts untimed blocks visible and timed blocks waiting", () => {
    expect(initialHeroTextPlaybackState({})).toBe("visible");
    expect(initialHeroTextPlaybackState(startOnly)).toBe("waiting");
  });

  it("reveals at the exact start and keeps start-only text visible", () => {
    expect(advanceHeroTextPlaybackState(startOnly, "waiting", 4.99)).toBe(
      "waiting",
    );
    expect(advanceHeroTextPlaybackState(startOnly, "waiting", 5)).toBe(
      "visible",
    );
    expect(advanceHeroTextPlaybackState(startOnly, "visible", 0)).toBe(
      "visible",
    );
  });

  it("ends at the exact end and never reappears after rewind", () => {
    expect(advanceHeroTextPlaybackState(interval, "waiting", 5)).toBe(
      "visible",
    );
    expect(advanceHeroTextPlaybackState(interval, "visible", 8)).toBe(
      "ended",
    );
    expect(advanceHeroTextPlaybackState(interval, "ended", 0)).toBe("ended");
  });

  it("seeking past both thresholds goes directly to ended", () => {
    expect(advanceHeroTextPlaybackState(interval, "waiting", 9)).toBe(
      "ended",
    );
  });

  it("ignores invalid current times", () => {
    expect(advanceHeroTextPlaybackState(interval, "waiting", -1)).toBe(
      "waiting",
    );
    expect(
      advanceHeroTextPlaybackState(interval, "waiting", Number.NaN),
    ).toBe("waiting");
  });
});
```

Add a small fake video clock in the same file and assert that `subscribeToHeroTextVideoTime` immediately reports `currentTime`, listens to `timeupdate`, `seeking`, `loadedmetadata`, and `play`, and removes every listener in its cleanup.

- [ ] **Step 2: Run the timing test and verify RED**

Run: `npx vitest run tests/hero-text-timing.test.ts`

Expected: FAIL because `@/lib/hero-text-timing` does not exist.

- [ ] **Step 3: Add timing properties and the minimal pure implementation**

Add to `HeroTextBlock` in `lib/types.ts`:

```ts
/** Video-only: elapsed seconds at which this block first appears. */
startSeconds?: number;
/** Video-only: elapsed seconds at which this block disappears permanently. */
endSeconds?: number;
```

Create `lib/hero-text-timing.ts`. Use strict finite, non-negative numeric normalization; check `endSeconds` before `startSeconds` in the transition so a seek past both returns `"ended"`; return the previous state immediately when it is already `"ended"`; and subscribe the video listener to exactly `timeupdate`, `seeking`, `loadedmetadata`, and `play` before making one immediate callback.

- [ ] **Step 4: Run the timing test and verify GREEN**

Run: `npx vitest run tests/hero-text-timing.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing persisted-normalization tests**

Extend `tests/hero-text.test.ts`:

```ts
it("normalizes optional video timing without changing legacy blocks", () => {
  const legacy = normalizeHeroTextLayer({ blocks: [{ id: "legacy" }] });
  expect(legacy.blocks[0].startSeconds).toBeUndefined();
  expect(legacy.blocks[0].endSeconds).toBeUndefined();

  const timed = normalizeHeroTextLayer({
    blocks: [{ id: "timed", startSeconds: 65, endSeconds: 90 }],
  });
  expect(timed.blocks[0]).toMatchObject({ startSeconds: 65, endSeconds: 90 });
});

it("drops invalid timing while retaining a valid start", () => {
  const result = normalizeHeroTextLayer({
    blocks: [
      { id: "end-only", endSeconds: 10 },
      { id: "bad-end", startSeconds: 10, endSeconds: 5 },
    ],
  });
  expect(result.blocks[0].startSeconds).toBeUndefined();
  expect(result.blocks[0].endSeconds).toBeUndefined();
  expect(result.blocks[1].startSeconds).toBe(10);
  expect(result.blocks[1].endSeconds).toBeUndefined();
});
```

- [ ] **Step 6: Run the normalization tests and verify RED**

Run: `npx vitest run tests/hero-text.test.ts`

Expected: FAIL because `normalizeBlock` does not return timing properties.

- [ ] **Step 7: Normalize timing in `normalizeBlock`**

Call `normalizeHeroTextTimes(b.startSeconds, b.endSeconds)` once and spread its return value into the normalized block. Do not add timing properties to `DEFAULT_HERO_TEXT_BLOCK`; omission is the backward-compatible default.

- [ ] **Step 8: Run both domain suites and verify GREEN**

Run: `npx vitest run tests/hero-text-timing.test.ts tests/hero-text.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit the isolated domain change**

Stage only `lib/hero-text-timing.ts`, `lib/types.ts`, `lib/hero-text.ts`, `tests/hero-text-timing.test.ts`, and `tests/hero-text.test.ts`. If `lib/types.ts` contains pre-existing audio work, stage only the timing hunk. Commit with:

```bash
git commit -m "feat: add hero text timing model"
```

---

### Task 2: Video-Only Minute and Second Editor

**Files:**

- Create: `components/admin/HeroTextTimingFields.tsx`
- Modify: `components/admin/HeroTextEditor.tsx`
- Modify: `app/admin/invitations/InvitationForm.tsx`
- Modify: `app/admin/invitations/ExternalInvitationForm.tsx`
- Create: `tests/hero-text-editor-timing.test.ts`

**Interfaces:**

- Consumes: conversion helpers from `lib/hero-text-timing.ts`.
- Produces: `HeroTextTimingFields({ block, onChange })`, where `onChange` receives a `Partial<HeroTextBlock>` containing valid timing properties.
- Extends: `HeroTextEditorProps` with `isVideo?: boolean`, defaulting to `false`.

- [ ] **Step 1: Write failing editor integration tests**

Create `tests/hero-text-editor-timing.test.ts` using `readFileSync` in the repository's existing integration-test style:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("hero text timing editor wiring", () => {
  const editor = readFileSync("components/admin/HeroTextEditor.tsx", "utf8");
  const fields = readFileSync(
    "components/admin/HeroTextTimingFields.tsx",
    "utf8",
  );
  const standardForm = readFileSync(
    "app/admin/invitations/InvitationForm.tsx",
    "utf8",
  );
  const externalForm = readFileSync(
    "app/admin/invitations/ExternalInvitationForm.tsx",
    "utf8",
  );

  it("shows focused timing fields only for a video hero", () => {
    expect(editor).toContain("isVideo?: boolean");
    expect(editor).toContain("isVideo &&");
    expect(editor).toContain("<HeroTextTimingFields");
    expect(fields).toContain("Aparecer");
    expect(fields).toContain("Desaparecer (opcional)");
  });

  it("passes video presence from both invitation forms", () => {
    expect(standardForm).toContain("isVideo={Boolean(form.videoUrl?.trim())}");
    expect(externalForm).toContain("isVideo={Boolean(form.videoUrl?.trim())}");
  });
});
```

- [ ] **Step 2: Run the editor integration test and verify RED**

Run: `npx vitest run tests/hero-text-editor-timing.test.ts`

Expected: FAIL because the timing-fields file and editor prop do not exist.

- [ ] **Step 3: Implement `HeroTextTimingFields`**

Build two compact fieldsets, each with number inputs labelled `Min` and `Seg`. Initialize their string drafts with `secondsToHeroTextTimeParts`. On every edit:

- Keep the typed strings locally so invalid values can remain visible while the error is explained.
- Parse with `heroTextTimePartsToSeconds`.
- For start errors, show `Usa minutos inteiros e segundos entre 0 e 59.` and do not call `onChange`.
- Clearing start calls `onChange({ startSeconds: undefined, endSeconds: undefined })` because end-only is invalid.
- A valid start calls `onChange({ startSeconds })`; if the current end is not later, also clear `endSeconds` and show `O fim deve ser posterior ao início.`.
- For end errors or an end without a start, show an inline message and do not persist it.
- Clearing end calls `onChange({ endSeconds: undefined })`.
- A valid end later than start calls `onChange({ endSeconds })`.

Use `min={0}`, `step={1}`, and `max={59}` on second inputs. Render the component with `key={selected.id}` so changing selected blocks resets drafts from that block without an effect that could overwrite invalid in-progress input.

- [ ] **Step 4: Connect video detection to `HeroTextEditor`**

Add `isVideo?: boolean` to the props, default it to `false`, and render:

```tsx
{isVideo && (
  <HeroTextTimingFields
    key={selected.id}
    block={selected}
    onChange={patch}
  />
)}
```

Place it after the text textarea and before typography controls. Do not filter the design-surface block list by timing.

Pass `isVideo={Boolean(form.videoUrl?.trim())}` at both `HeroTextEditor` call sites.

- [ ] **Step 5: Run editor and domain tests and verify GREEN**

Run: `npx vitest run tests/hero-text-editor-timing.test.ts tests/hero-text-timing.test.ts tests/hero-text.test.ts`

Expected: PASS.

- [ ] **Step 6: Run ESLint on the editor files**

Run: `npx eslint components/admin/HeroTextTimingFields.tsx components/admin/HeroTextEditor.tsx app/admin/invitations/InvitationForm.tsx app/admin/invitations/ExternalInvitationForm.tsx`

Expected: exit 0 with no new errors.

- [ ] **Step 7: Commit the isolated editor change**

Stage the new component/test and only the timing hunks from invitation forms that also contain pre-existing audio edits. Commit with:

```bash
git commit -m "feat: edit hero text video timing"
```

---

### Task 3: Playback-Synchronized Overlay

**Files:**

- Modify: `components/shared/HeroTextOverlay.tsx`
- Modify: `tests/hero-text-overlay.test.ts`
- Modify: `tests/hero-text-overlay-reduced-motion.test.ts`

**Interfaces:**

- Consumes: `initialHeroTextPlaybackState`, `advanceHeroTextPlaybackState`, and `subscribeToHeroTextVideoTime`.
- Extends: `HeroTextOverlayProps` with `videoRef?: RefObject<HTMLVideoElement | null>`.
- Preserves: static rendering when `videoRef` is absent.

- [ ] **Step 1: Write failing overlay compatibility tests**

Extend `tests/hero-text-overlay.test.ts` with a timed block and a `{ current: null }` video ref:

```ts
it("keeps timed blocks visible when there is no video clock", () => {
  const timedLayer = {
    ...layer,
    blocks: [{ ...layer.blocks[0], startSeconds: 5 }],
  };
  const html = renderToStaticMarkup(
    createElement(HeroTextOverlay, { layer: timedLayer, fonts }),
  );
  expect(html).toContain("Ana &amp; João");
});

it("starts timed blocks hidden when a video clock is supplied", () => {
  const timedLayer = {
    ...layer,
    blocks: [{ ...layer.blocks[0], startSeconds: 5 }],
  };
  const html = renderToStaticMarkup(
    createElement(HeroTextOverlay, {
      layer: timedLayer,
      fonts,
      play: true,
      videoRef: { current: null },
    }),
  );
  expect(html).not.toContain("Ana &amp; João");
});
```

Add a reduced-motion test with `videoRef: { current: null }` and a timed block, asserting it is hidden; this proves reduced motion changes animation, not timing.

- [ ] **Step 2: Run overlay tests and verify RED**

Run: `npx vitest run tests/hero-text-overlay.test.ts tests/hero-text-overlay-reduced-motion.test.ts`

Expected: FAIL because `HeroTextOverlay` has no video-clock timing path.

- [ ] **Step 3: Implement monotonic block state in `HeroTextOverlay`**

Import `RefObject`, `useEffect`, and `useState`. Initialize a record keyed by block ID: when `videoRef` exists use `initialHeroTextPlaybackState`, otherwise mark every block visible. In an effect, subscribe to `videoRef.current` with `subscribeToHeroTextVideoTime`; on each callback, update every block with `advanceHeroTextPlaybackState` and return the previous record when no value changed.

Keep timing and animation independent:

```ts
const motionEnabled = play && !reduceMotion;
const visibleBlocks = blocks.filter(
  (block) => playbackStates[block.id] === "visible",
);
```

When motion is disabled, render `visibleBlocks` using the existing single-element static path. When motion is enabled, wrap the mapped children in `AnimatePresence`. Make each positioned outer element a `motion.div` that keeps `heroTextBlockPositionStyle(block)` as its static style and animates only exit opacity; keep rise/blur entrance transforms on the inner motion element so they cannot replace the outer centering transform. Give the inner element explicit `initial="hidden"` and `animate="visible"`, and give the outer element `exit={{ opacity: 0, transition: { duration: 0.25 } }}`. For reduced motion, removal is immediate because it uses the static path.

Untimed blocks must still be visible on the first render and retain the current container entrance animation when `play` is true.

- [ ] **Step 4: Run overlay and timing tests and verify GREEN**

Run: `npx vitest run tests/hero-text-overlay.test.ts tests/hero-text-overlay-reduced-motion.test.ts tests/hero-text-timing.test.ts`

Expected: PASS.

- [ ] **Step 5: Run ESLint on the overlay**

Run: `npx eslint components/shared/HeroTextOverlay.tsx`

Expected: exit 0 with no hook dependency or state-update warnings.

- [ ] **Step 6: Commit the overlay change**

```bash
git add components/shared/HeroTextOverlay.tsx tests/hero-text-overlay.test.ts tests/hero-text-overlay-reduced-motion.test.ts
git commit -m "feat: synchronize hero text with video playback"
```

---

### Task 4: Connect Every Displayed Hero Video Clock

**Files:**

- Modify: `components/shared/InvitationHero.tsx`
- Modify: `components/video-entrance/VideoEntranceHero.tsx`
- Modify: `components/curtain-canva/CurtainsHero.tsx`
- Modify: `components/curtain-canva/CurtainHeroVideo.tsx`
- Create: `tests/hero-text-video-wiring.test.ts`

**Interfaces:**

- Consumes: `HeroTextOverlay.videoRef` from Task 3.
- Changes: `CurtainHeroVideo` accepts `videoRef?: RefObject<HTMLVideoElement | null>` from its parent and retains an internal fallback for isolated callers/previews.
- Preserves: current `muted` prop and `resolveHeroVideoMuted` behavior from the unrelated in-progress audio work.

- [ ] **Step 1: Write failing host-wiring tests**

Create `tests/hero-text-video-wiring.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("timed hero text video clock wiring", () => {
  it("passes the rendered video ref in the shared hero", () => {
    const source = readFileSync(
      "components/shared/InvitationHero.tsx",
      "utf8",
    );
    expect(source).toContain("const renderedVideoRef =");
    expect(source).toContain("videoRef={renderedVideoRef}");
  });

  it("passes the entrance video ref to its overlay", () => {
    const source = readFileSync(
      "components/video-entrance/VideoEntranceHero.tsx",
      "utf8",
    );
    expect(source).toMatch(/<HeroTextOverlay[\s\S]*videoRef=\{videoRef\}/);
  });

  it("shares the curtain background hero-video ref with its overlay", () => {
    const hero = readFileSync(
      "components/curtain-canva/CurtainsHero.tsx",
      "utf8",
    );
    const background = readFileSync(
      "components/curtain-canva/CurtainHeroVideo.tsx",
      "utf8",
    );
    expect(hero).toContain("const heroVideoRef = useRef<HTMLVideoElement");
    expect(hero).toMatch(/<CurtainHeroVideo[\s\S]*videoRef=\{heroVideoRef\}/);
    expect(hero).toMatch(/<HeroTextOverlay[\s\S]*videoRef=\{heroVideoRef\}/);
    expect(background).toContain("videoRef?: RefObject<HTMLVideoElement | null>");
  });
});
```

- [ ] **Step 2: Run the wiring test and verify RED**

Run: `npx vitest run tests/hero-text-video-wiring.test.ts`

Expected: FAIL because overlay refs are not wired.

- [ ] **Step 3: Wire `InvitationHero` without creating a second video ref**

After `activeVideoRef`, define:

```ts
const renderedVideoRef = prefetchedVideoRef ?? activeVideoRef;
```

Use `renderedVideoRef` for the direct video's `ref`, for `useVideoFrameReady`, and for `HeroTextOverlay.videoRef` only when `invitation.videoUrl` is present. Continue passing `prefetchedVideoRef` into `PrefetchedVideoSlot`; both names then refer to the same ref object.

- [ ] **Step 4: Wire the video-entrance hero**

Pass `videoRef={videoRef}` to its revealed `HeroTextOverlay`. The overlay mounts after `heroInfoVisible`; its immediate clock evaluation handles timestamps already crossed before reveal.

- [ ] **Step 5: Lift the curtain background video ref**

In `CurtainsHero`, create `heroVideoRef`. Pass it to `CurtainHeroVideo` and to `HeroTextOverlay` only when `heroVideoOn` is true. Do not use the separate curtain-opening video's ref as the text clock.

In `CurtainHeroVideo`, add an optional `videoRef` prop, retain an internal fallback ref, and use `const activeVideoRef = videoRef ?? internalVideoRef` in the `<video>` and `useVideoFrameReady`. This preserves standalone callers while letting `CurtainsHero` share the actual clock. Preserve the existing `muted` prop and default.

- [ ] **Step 6: Run targeted host and audio tests and verify GREEN**

Run: `npx vitest run tests/hero-text-video-wiring.test.ts tests/video-poster-rendering.test.ts tests/hero-video-audio.test.ts`

Expected: PASS. The audio test is required because `CurtainHeroVideo` and `InvitationHero` contain overlapping uncommitted audio changes.

- [ ] **Step 7: Run ESLint on all hosts**

Run: `npx eslint components/shared/InvitationHero.tsx components/video-entrance/VideoEntranceHero.tsx components/curtain-canva/CurtainsHero.tsx components/curtain-canva/CurtainHeroVideo.tsx`

Expected: exit 0 with no new errors.

- [ ] **Step 8: Commit only feature-specific host hunks**

Because every listed host currently overlaps the separate hero-audio work, inspect the staged diff and include only video-ref/timing hunks. Commit with:

```bash
git commit -m "feat: connect timed text to hero videos"
```

---

### Task 5: Full Verification and Compatibility Review

**Files:**

- Verify all files from Tasks 1–4.
- Modify only files needed to fix verification failures caused by this feature.

**Interfaces:**

- Consumes the completed feature.
- Produces verification evidence and a clean feature-specific diff.

- [ ] **Step 1: Run all hero-text and video regression tests**

Run:

```bash
npx vitest run tests/hero-text-timing.test.ts tests/hero-text.test.ts tests/hero-text-editor-timing.test.ts tests/hero-text-overlay.test.ts tests/hero-text-overlay-reduced-motion.test.ts tests/hero-text-video-wiring.test.ts tests/video-poster-rendering.test.ts tests/hero-video-audio.test.ts tests/invitation-translations.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the complete test suite**

Run: `npm test`

Expected: all Vitest tests PASS.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: exit 0 with no new lint errors.

- [ ] **Step 4: Run the project build command**

Run: `npm run build`

Expected: Prisma generation/migration deployment and Next.js production build complete successfully. Never run `next build` directly.

- [ ] **Step 5: Inspect the final diff and worktree ownership**

Run `git status --short`, `git diff --check`, and inspect every feature commit. Confirm:

- Existing invitations have no timing properties added automatically.
- No Prisma migration was created for timing.
- Image heroes omit the video ref.
- The separate hero-audio files/hunks remain present and unaltered unless needed for compatible ref plumbing.
- No `.env` or generated Prisma files are staged.

- [ ] **Step 6: Commit any verification-only correction**

If verification required a feature correction, stage only that correction and commit:

```bash
git commit -m "fix: complete timed hero text integration"
```

If no correction was required, do not create an empty commit.
