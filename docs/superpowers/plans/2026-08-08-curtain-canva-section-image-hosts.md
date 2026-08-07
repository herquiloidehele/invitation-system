# CurtainCanva Section Image Hosts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep CurtainCanva and VideoEntrance free-floating images attached to stable invitation sections across reveal, Canva measurement, and responsive layout changes.

**Architecture:** Mirror `InvitationPage`: an outer `ImageCanvas` owns unhosted fallback items, while `SectionImageHost` instances own images assigned to rendered sections. A pure helper enumerates rendered entrance-layout hosts, and a readiness signal prevents legacy page-wide geometry from migrating until reveal and the first valid Canva measurement are complete.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest in Node mode, server-rendered React markup tests.

## Global Constraints

- Reuse the existing `InvitationPage` + `SectionImageHost` architecture.
- Existing `imageLayer` JSON records remain readable; no Prisma migration.
- Public rendering never mutates invitation data.
- Legacy conversion occurs only in admin form state and persists through the normal Save action.
- Preserve `z < 0` behind content, `z >= 0` in front, and `frontLayerPosition="interleaved"` for fallback items.
- Do not change Canva proxy behavior, iframe navigation, uploads, or visual design.
- Use strict test-first development: observe the intended failure before production edits.

## File Structure

- Create `lib/entrance-invitation-image-sections.ts` for rendered-host selection and readiness rules.
- Create `tests/entrance-invitation-image-sections.test.ts` for those pure rules.
- Create `tests/entrance-page-image-hosts.test.ts` for Node-compatible component wiring coverage.
- Modify `lib/types.ts` to add semantic section keys.
- Modify `lib/image-layer-editor-geometry.ts` and its tests for stable migration gating.
- Modify `ImageCanvas` and `ImageLayerEditor` to publish and consume readiness.
- Modify `CanvaEmbed`, `RevealableExternalSections`, `CurtainCanvaPage`, and `VideoEntrancePage` for measurement and section hosts.

---

### Task 1: Define entrance-layout section ownership

**Files:**
- Create: `lib/entrance-invitation-image-sections.ts`
- Create: `tests/entrance-invitation-image-sections.test.ts`
- Modify: `lib/types.ts:284-300`

**Interfaces:**
- Consumes: `InvitationData`, `shouldRenderScratchReveal`, `shouldRenderCoupleGallery`, `shouldRenderPlaces`, `getEffectiveExternalLink`, and `isPersonalGuestCardHiddenInPreview`.
- Produces: `getEntranceInvitationImageSectionKeys(invitation, options): ImageLayerSectionKey[]` and the new keys `scratchReveal`, `personalGuestCard`, `canvaDetails`, and `rsvp`.

- [ ] **Step 1: Write the failing rendered-host tests**

Create `tests/entrance-invitation-image-sections.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getEntranceInvitationImageSectionKeys } from "@/lib/entrance-invitation-image-sections";
import { MOCK_INVITATION } from "@/lib/mock-invitation";
import type { InvitationData } from "@/lib/types";

describe("getEntranceInvitationImageSectionKeys", () => {
  it("returns enabled entrance sections once in DOM order", () => {
    const invitation: InvitationData = {
      ...MOCK_INVITATION,
      invitationType: "external_link",
      externalLink: "https://example.com/invitation",
      scratchReveal: { enabled: true },
      countdown: { enabled: true },
      guest: {
        token: "guest",
        name: "Guest",
        totalGuests: 1,
        canInviteOthers: false,
        invitationSlug: "preview",
      },
      coupleGallery: {
        enabled: true,
        style: "grid",
        images: [{ src: "/gallery.jpg" }],
      },
      places: {
        enabled: true,
        layout: "stacked",
        sections: [{
          id: "hotels",
          title: "Hotels",
          items: [{ id: "hotel", title: "Hotel" }],
        }],
      },
      rsvp: { ...MOCK_INVITATION.rsvp, enabled: true },
    };

    expect(getEntranceInvitationImageSectionKeys(invitation)).toEqual([
      "hero",
      "scratchReveal",
      "countdown",
      "personalGuestCard",
      "coupleGallery",
      "canvaDetails",
      "places",
      "rsvp",
    ]);
  });

  it("omits initial-page sections after internal Canva navigation", () => {
    const invitation: InvitationData = {
      ...MOCK_INVITATION,
      invitationType: "external_link",
      externalLink: "https://example.com/invitation",
      scratchReveal: { enabled: true },
      countdown: { enabled: true },
    };
    expect(getEntranceInvitationImageSectionKeys(invitation, {
      showInitialPageSections: false,
    })).toEqual(["hero", "canvaDetails"]);
  });

  it("omits sections whose render conditions are false", () => {
    const invitation: InvitationData = {
      ...MOCK_INVITATION,
      externalLink: "",
      scratchReveal: { enabled: false },
      countdown: { enabled: false },
      guest: undefined,
      coupleGallery: { enabled: true, style: "grid", images: [] },
      places: { enabled: true, layout: "stacked", sections: [] },
      rsvp: { ...MOCK_INVITATION.rsvp, enabled: false },
    };
    expect(getEntranceInvitationImageSectionKeys(invitation)).toEqual(["hero"]);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run tests/entrance-invitation-image-sections.test.ts`

Expected: FAIL because the module and four keys do not exist.

- [ ] **Step 3: Add the keys and minimal helper**

Add to `IMAGE_LAYER_SECTION_KEYS`:

```ts
  "scratchReveal",
  "personalGuestCard",
  "canvaDetails",
  "rsvp",
```

Create `lib/entrance-invitation-image-sections.ts`:

```ts
import { shouldRenderCoupleGallery } from "./couple-gallery";
import { shouldRenderScratchReveal } from "./curtain-canva";
import { getEffectiveExternalLink } from "./invitation-external-link";
import { isPersonalGuestCardHiddenInPreview } from "./personal-guest-card";
import { shouldRenderPlaces } from "./places";
import type { ImageLayerSectionKey, InvitationData } from "./types";

export interface EntranceImageSectionOptions {
  showInitialPageSections?: boolean;
  isLandingPreview?: boolean;
}

export function getEntranceInvitationImageSectionKeys(
  invitation: InvitationData,
  { showInitialPageSections = true, isLandingPreview = false }:
    EntranceImageSectionOptions = {},
): ImageLayerSectionKey[] {
  const keys: ImageLayerSectionKey[] = ["hero"];
  if (showInitialPageSections) {
    if (shouldRenderScratchReveal(invitation.scratchReveal)) keys.push("scratchReveal");
    if (invitation.countdown?.enabled) keys.push("countdown");
    if ((invitation.guest || isLandingPreview) &&
        !isPersonalGuestCardHiddenInPreview(invitation, isLandingPreview)) {
      keys.push("personalGuestCard");
    }
    if (shouldRenderCoupleGallery(invitation)) keys.push("coupleGallery");
  }
  const externalLink = getEffectiveExternalLink({
    invitationType: invitation.invitationType,
    externalLink: invitation.externalLink,
    guestCustomExternalLink: invitation.guest?.customExternalLink,
  });
  if (externalLink) keys.push("canvaDetails");
  if (showInitialPageSections) {
    if (shouldRenderPlaces(invitation)) keys.push("places");
    if (invitation.rsvp.enabled) keys.push("rsvp");
  }
  return keys;
}
```

- [ ] **Step 4: Verify GREEN and commit**

Run: `npx vitest run tests/entrance-invitation-image-sections.test.ts tests/standard-invitation-image-sections.test.ts tests/image-layer.test.ts`

Expected: PASS. Removing any conditional key must fail a literal assertion.

```bash
git add lib/types.ts lib/entrance-invitation-image-sections.ts tests/entrance-invitation-image-sections.test.ts
git commit -m "feat: define entrance image sections"
```

---

### Task 2: Gate legacy migration on stable geometry

**Files:**
- Modify: `lib/image-layer-editor-geometry.ts`
- Modify: `tests/image-layer-editor-geometry.test.ts`
- Modify: `components/shared/ImageCanvas.tsx`
- Modify: `tests/image-canvas.test.ts`
- Modify: `components/admin/ImageLayerEditor.tsx`
- Modify: `tests/image-layer-editor-anchor-integration.test.ts`

**Interfaces:**
- Produces `ImageCanvasProps.migrationReady?: boolean`, DOM attribute `data-image-migration-ready`, and `shouldMigrateLegacyImageItems(active, migrationReady, items): boolean`.
- Changes `findImageAnchorRect` to ignore non-positive section rectangles.

- [ ] **Step 1: Add failing behavior tests**

Move the existing `legacyItem` fixture in `tests/image-layer-editor-geometry.test.ts` to file scope, then add:

```ts
import { shouldMigrateLegacyImageItems } from "@/lib/image-layer-editor-geometry";

it("ignores collapsed sections when resolving an anchor", () => {
  const collapsed: ImageAnchorRect = {
    sectionKey: "canvaDetails", left: 0, top: 500, width: 400, height: 0,
  };
  expect(findImageAnchorRect([collapsed, sections[1]], 500)?.sectionKey)
    .toBe("dressCode");
});

describe("shouldMigrateLegacyImageItems", () => {
  it("waits for stable layout geometry", () => {
    expect(shouldMigrateLegacyImageItems(true, false, [legacyItem])).toBe(false);
    expect(shouldMigrateLegacyImageItems(true, true, [legacyItem])).toBe(true);
  });

  it("skips inactive and already anchored layers", () => {
    const anchored = { ...legacyItem, sectionKey: "hero" as const };
    expect(shouldMigrateLegacyImageItems(false, true, [legacyItem])).toBe(false);
    expect(shouldMigrateLegacyImageItems(true, true, [anchored])).toBe(false);
  });
});
```

Add to `tests/image-canvas.test.ts`:

```ts
it("exposes whether legacy migration geometry is ready", () => {
  const html = renderToStaticMarkup(
    createElement(ImageCanvas, { layer, migrationReady: false }, null),
  );
  expect(html).toContain('data-image-migration-ready="false"');
});
```

- [ ] **Step 2: Verify RED**

Run: `npx vitest run tests/image-layer-editor-geometry.test.ts tests/image-canvas.test.ts`

Expected: FAIL because the gate/prop are absent and the collapsed anchor wins.

- [ ] **Step 3: Implement the pure gate and measurable-anchor filter**

```ts
export function shouldMigrateLegacyImageItems(
  active: boolean,
  migrationReady: boolean,
  items: readonly ImageItem[],
): boolean {
  return active && migrationReady && items.some((item) => !item.sectionKey);
}
```

In `findImageAnchorRect`, create `const measurable = rects.filter((rect) => rect.width > 0 && rect.height > 0);` and use it for containment and reduction.

Add `migrationReady = true` to `ImageCanvas` props and emit this in both canvas branches:

```tsx
data-image-migration-ready={migrationReady ? "true" : "false"}
```

- [ ] **Step 4: Make ImageLayerEditor consume readiness changes**

Retain the reducer revision:

```ts
const [measurementRevision, forceMeasure] = useReducer(
  (revision: number) => revision + 1,
  0,
);
```

Observe the canvas attribute while edit mode is active:

```ts
useEffect(() => {
  if (!active) return;
  const canvas = getPreviewRoot()?.querySelector("[data-image-canvas]");
  if (!canvas || typeof MutationObserver === "undefined") return;
  const observer = new MutationObserver(() => forceMeasure());
  observer.observe(canvas, {
    attributes: true,
    attributeFilter: ["data-image-migration-ready"],
  });
  return () => observer.disconnect();
}, [active, getPreviewRoot]);
```

In the migration effect, read `canvasElement.dataset.imageMigrationReady !== "false"`, call `shouldMigrateLegacyImageItems`, and include `measurementRevision` in dependencies. Update the integration test to assert this helper and exact attribute are wired.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npx vitest run tests/image-layer-editor-geometry.test.ts tests/image-canvas.test.ts tests/image-layer-editor-anchor-integration.test.ts`

Expected: PASS. Treating false readiness as ready or retaining a zero-height anchor must fail.

```bash
git add lib/image-layer-editor-geometry.ts tests/image-layer-editor-geometry.test.ts components/shared/ImageCanvas.tsx tests/image-canvas.test.ts components/admin/ImageLayerEditor.tsx tests/image-layer-editor-anchor-integration.test.ts
git commit -m "fix: wait for stable image migration geometry"
```

---

### Task 3: Signal Canva measurement and compute readiness

**Files:**
- Modify: `lib/entrance-invitation-image-sections.ts`
- Modify: `tests/entrance-invitation-image-sections.test.ts`
- Modify: `components/curtain-canva/CanvaEmbed.tsx`
- Modify: `components/shared/RevealableExternalSections.tsx`
- Modify: `tests/canva-embed-measurement.test.ts`

**Interfaces:**
- Produces `isEntranceImageMigrationReady({ revealed, externalLink, measuredExternalLink })`, `CanvaEmbedProps.onContentHeightReady?: () => void`, and `RevealableExternalSectionsProps.onCanvaContentHeightReady?: () => void`.

- [ ] **Step 1: Add failing readiness tests**

```ts
describe("isEntranceImageMigrationReady", () => {
  it("requires reveal", () => {
    expect(isEntranceImageMigrationReady({
      revealed: false, externalLink: "", measuredExternalLink: null,
    })).toBe(false);
  });

  it("is ready after reveal without Canva", () => {
    expect(isEntranceImageMigrationReady({
      revealed: true, externalLink: "", measuredExternalLink: null,
    })).toBe(true);
  });

  it("requires measurement for the current Canva link", () => {
    const externalLink = "https://example.com/current";
    expect(isEntranceImageMigrationReady({
      revealed: true,
      externalLink,
      measuredExternalLink: "https://example.com/old",
    })).toBe(false);
    expect(isEntranceImageMigrationReady({
      revealed: true, externalLink, measuredExternalLink: externalLink,
    })).toBe(true);
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `npx vitest run tests/entrance-invitation-image-sections.test.ts`

Expected: FAIL because the readiness function is absent.

- [ ] **Step 3: Implement readiness and measurement notification**

```ts
export function isEntranceImageMigrationReady({
  revealed,
  externalLink,
  measuredExternalLink,
}: {
  revealed: boolean;
  externalLink: string;
  measuredExternalLink: string | null;
}): boolean {
  if (!revealed) return false;
  return !externalLink || measuredExternalLink === externalLink;
}
```

Add `onContentHeightReady?: () => void` to `CanvaEmbedProps` and invoke it only in the non-null measurement branch:

```ts
if (nextHeight !== null) {
  setContentHeight(nextHeight);
  onContentHeightReady?.();
}
```

Forward it through `RevealableExternalSections` as `onCanvaContentHeightReady`. Keep the existing `measureIframeBodyHeight({ bodyScrollHeight: 3605, bodyOffsetHeight: 3600 }) === 3605` assertion in `tests/canva-embed-measurement.test.ts`, adding it if absent.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npx vitest run tests/entrance-invitation-image-sections.test.ts tests/canva-embed-measurement.test.ts`

Expected: PASS. A different measured link and unrevealed state remain false.

```bash
git add lib/entrance-invitation-image-sections.ts tests/entrance-invitation-image-sections.test.ts components/curtain-canva/CanvaEmbed.tsx components/shared/RevealableExternalSections.tsx tests/canva-embed-measurement.test.ts
git commit -m "feat: report stable Canva image geometry"
```

---

### Task 4: Render entrance images through SectionImageHost

**Files:**
- Modify: `components/shared/RevealableExternalSections.tsx`
- Modify: `components/curtain-canva/CurtainCanvaPage.tsx`
- Modify: `components/video-entrance/VideoEntrancePage.tsx`
- Modify: `tests/section-image-host.test.ts`
- Create: `tests/entrance-page-image-hosts.test.ts`

**Interfaces:**
- Consumes the helpers/readiness from Tasks 1-3.
- Produces exact `hostedSectionKeys`, `migrationReady`, `imageLayer`, and Canva-ready wiring for both entrance layouts.

- [ ] **Step 1: Add failing host tests**

Add a real render assertion to `tests/section-image-host.test.ts`:

```ts
it("renders an entrance image only in its semantic host", () => {
  const entranceLayer: ImageLayer = {
    items: [makeItem("rsvp-bg", "/rsvp.png", "rsvp")],
  };
  const html = renderToStaticMarkup(createElement(
    TestSectionImageHost,
    { sectionKey: "rsvp", layer: entranceLayer },
    createElement("section", null, "RSVP content"),
  ));
  expect(html).toContain('data-section-key="rsvp"');
  expect(html).toContain("/rsvp.png");
  expect(html).toContain("RSVP content");
});
```

Create `tests/entrance-page-image-hosts.test.ts` and read the three component files. Assert both pages contain `SectionImageHost sectionKey="hero"`, `hostedSectionKeys={hostedSectionKeys}`, `migrationReady={imageMigrationReady}`, `imageLayer={invitation.imageLayer}`, and `onCanvaContentHeightReady=`. Assert shared sections contain each of these literal keys: `scratchReveal`, `countdown`, `personalGuestCard`, `coupleGallery`, `canvaDetails`, `places`, and `rsvp`.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run tests/section-image-host.test.ts tests/entrance-page-image-hosts.test.ts`

Expected: integration assertions FAIL because hosts/readiness are not wired.

- [ ] **Step 3: Wrap shared lower sections**

Add `imageLayer?: ImageLayer | null` and import `SectionImageHost`. Preserve each
existing render condition and child. For example, replace the scratch branch
with this complete wrapper:

```tsx
{showInitialPageSections && scratchRevealOn && (
  <SectionImageHost sectionKey="scratchReveal" layer={imageLayer}>
    <ScratchDateReveal
      date={invitation.date}
      theme={theme}
      customTexts={invitation.customTexts}
      textStyles={invitation.textStyles}
      shape={invitation.scratchReveal?.shape}
      backgroundImageUrl={invitation.scratchReveal?.backgroundImageUrl}
      scrimOpacity={invitation.scratchReveal?.scrimOpacity}
      imageSettings={invitation.imageSettings}
    />
  </SectionImageHost>
)}
```

Apply that same wrapper boundary to the current top-level child of each branch,
without moving or changing the child: `ExternalCountdownSection` uses
`countdown`; `EditableCard`/`PersonalGuestCard` uses `personalGuestCard`;
`CoupleGallery` uses `coupleGallery`; `CanvaEmbed` uses `canvaDetails`;
`PlacesSection` uses `places`; and the existing `section#rsvp` uses `rsvp`.

- [ ] **Step 4: Apply the InvitationPage pattern to CurtainCanvaPage**

Compute `externalLink`, `measuredExternalLink`, and:

```ts
const hostedSectionKeys = getEntranceInvitationImageSectionKeys(invitation, {
  isLandingPreview,
});
const imageMigrationReady = isEntranceImageMigrationReady({
  revealed, externalLink, measuredExternalLink,
});
const handleCanvaContentHeightReady = useCallback(
  () => setMeasuredExternalLink(externalLink),
  [externalLink],
);
```

Pass `hostedSectionKeys` and `migrationReady={imageMigrationReady}` to `ImageCanvas`. Wrap `CurtainsHero` in `SectionImageHost sectionKey="hero"`. Pass `imageLayer={invitation.imageLayer}` and `onCanvaContentHeightReady={handleCanvaContentHeightReady}` to shared sections.

- [ ] **Step 5: Apply the same pattern to VideoEntrancePage**

Reuse its existing `externalLink` and `showInitialPageSections`. Compute hosted keys with `{ showInitialPageSections }`, add measured-link state/readiness, wrap the hero, and pass the same lower-section props. Preserve internal Canva navigation visibility.

- [ ] **Step 6: Verify GREEN and commit**

Run: `npx vitest run tests/entrance-invitation-image-sections.test.ts tests/section-image-host.test.ts tests/entrance-page-image-hosts.test.ts tests/image-canvas.test.ts tests/image-layer-editor-geometry.test.ts`

Expected: PASS. Removing a host or helper key must fail a literal ownership assertion.

```bash
git add components/shared/RevealableExternalSections.tsx components/curtain-canva/CurtainCanvaPage.tsx components/video-entrance/VideoEntrancePage.tsx tests/section-image-host.test.ts tests/entrance-page-image-hosts.test.ts
git commit -m "fix: anchor entrance images to sections"
```

---

### Task 5: Full verification and visual regression check

**Files:**
- No planned file changes; return to the failing task if verification finds a defect.

**Interfaces:**
- Consumes all Tasks 1-4 behavior.
- Produces test, lint, build, and visual evidence.

- [ ] **Step 1: Run all automated checks**

```bash
npm test
npm run lint
npm run build
```

Expected: all commands exit 0. Use `npm run build`; never call `next build` directly.

- [ ] **Step 2: Verify legacy migration without saving production data**

Open `edson-dos-santos` in the correct admin environment, reveal the curtain, wait for Canva measurement, and enable image-edit mode. Confirm legacy items do not jump when section keys appear. Resize from the admin desktop pane to a narrow mobile viewport and confirm hero, Canva, and lower-section decorations remain attached to their sections. Do not click Save or issue an API update without separate authorization.

- [ ] **Step 3: Verify layering with controlled local data**

Use unsaved preview data containing front and behind images in `hero`, `canvaDetails`, and `rsvp`. Confirm each renders once, the curtain stays above hero images before reveal, front images stay above section content, and behind images remain visible where the section surface is transparent.

- [ ] **Step 4: Inspect final repository state**

```bash
git diff --check
git status --short
git log -5 --oneline
```

Expected: no whitespace errors, only planned changes, and the task commits are present.
