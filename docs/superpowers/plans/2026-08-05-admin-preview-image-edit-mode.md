# Admin Preview Image Edit Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent large background-image hitboxes from blocking inline text and card controls by making preview image manipulation an explicit admin mode.

**Architecture:** Both invitation forms will own image-editing mode through a shared pure reducer and will activate `ImageLayerEditor` only when that mode is true and at least one image-layer item exists. A shared admin control will expose the mode consistently. Reducer and predicate behavior will be tested directly, and the control's rendered accessibility states will be tested through React's server renderer without introducing a DOM environment.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Base UI button primitives, Tailwind CSS v4, Vitest in Node mode.

## Global Constraints

- Image-editing mode is off by default.
- Uploading a new image selects it and enables image-editing mode.
- Disabling image editing preserves the selected image and inspector settings.
- Removing the last image disables the mode and removes the overlay immediately.
- Standard and external invitation forms must behave identically.
- Do not change the image-layer persistence format, geometry, public rendering, or database schema.
- Do not add DOM-dependent tests; `vitest.config.ts` uses the Node environment.
- Do not run `next build` directly; use `npm run build` only if a build is explicitly required.

---

## File Structure

- Create `lib/image-layer-editor-mode.ts`: pure mode reducer and activation predicate shared by both forms.
- Create `components/admin/ImageLayerEditModeControl.tsx`: shared mode button and concise status guidance.
- Create `tests/image-layer-editor-mode.test.ts`: predicate coverage plus Node-compatible source integration checks.
- Modify `app/admin/invitations/InvitationForm.tsx`: own the mode state, render the shared control, enable it after upload, and gate `ImageLayerEditor`.
- Modify `app/admin/invitations/ExternalInvitationForm.tsx`: apply the same state and UI integration to external invitations.

### Task 1: Encode image-editor mode transitions and activation

**Files:**
- Create: `lib/image-layer-editor-mode.ts`
- Create: `tests/image-layer-editor-mode.test.ts`

**Interfaces:**
- Produces: `imageLayerEditorModeReducer(editing: boolean, action: ImageLayerEditorModeAction): boolean` and `isImageLayerEditorActive(itemCount: number, editing: boolean): boolean`.
- Consumes: no application state or browser APIs.

- [ ] **Step 1: Write the failing predicate tests**

Create `tests/image-layer-editor-mode.test.ts` with the following initial content:

```ts
import { describe, expect, it } from "vitest";

import {
  imageLayerEditorModeReducer,
  isImageLayerEditorActive,
} from "@/lib/image-layer-editor-mode";

describe("imageLayerEditorModeReducer", () => {
  it("enables editing after an image is added", () => {
    expect(imageLayerEditorModeReducer(false, { type: "image-added" })).toBe(
      true,
    );
  });

  it("applies an explicit mode change", () => {
    expect(
      imageLayerEditorModeReducer(false, {
        type: "set-editing",
        editing: true,
      }),
    ).toBe(true);
    expect(
      imageLayerEditorModeReducer(true, {
        type: "set-editing",
        editing: false,
      }),
    ).toBe(false);
  });

  it("disables editing when the last image is removed", () => {
    expect(
      imageLayerEditorModeReducer(true, {
        type: "items-changed",
        itemCount: 0,
      }),
    ).toBe(false);
  });

  it("preserves editing when images remain", () => {
    expect(
      imageLayerEditorModeReducer(true, {
        type: "items-changed",
        itemCount: 1,
      }),
    ).toBe(true);
  });
});

describe("isImageLayerEditorActive", () => {
  it("activates only when images exist and editing was requested", () => {
    expect(isImageLayerEditorActive(1, true)).toBe(true);
  });

  it("stays inactive when editing was not requested", () => {
    expect(isImageLayerEditorActive(1, false)).toBe(false);
  });

  it("stays inactive without images", () => {
    expect(isImageLayerEditorActive(0, true)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npx vitest run tests/image-layer-editor-mode.test.ts
```

Expected: FAIL because `@/lib/image-layer-editor-mode` does not exist.

- [ ] **Step 3: Add the minimal pure predicate**

Create `lib/image-layer-editor-mode.ts`:

```ts
export type ImageLayerEditorModeAction =
  | { type: "set-editing"; editing: boolean }
  | { type: "image-added" }
  | { type: "items-changed"; itemCount: number };

export function imageLayerEditorModeReducer(
  editing: boolean,
  action: ImageLayerEditorModeAction,
): boolean {
  switch (action.type) {
    case "set-editing":
      return action.editing;
    case "image-added":
      return true;
    case "items-changed":
      return action.itemCount > 0 && editing;
  }
}

/** Whether the admin's pointer-capturing image overlay may cover the preview. */
export function isImageLayerEditorActive(
  itemCount: number,
  editing: boolean,
): boolean {
  return itemCount > 0 && editing;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
npx vitest run tests/image-layer-editor-mode.test.ts
```

Expected: all reducer and predicate tests PASS.

- [ ] **Step 5: Keep the predicate and tests uncommitted**

```bash
git status --short
```

Expected: the new predicate and test files remain unstaged and uncommitted.

### Task 2: Add the shared image-edit mode control

**Files:**
- Create: `components/admin/ImageLayerEditModeControl.tsx`
- Modify: `tests/image-layer-editor-mode.test.ts`

**Interfaces:**
- Consumes: `active: boolean`, `hasImages: boolean`, and `onActiveChange(active: boolean): void`.
- Produces: `ImageLayerEditModeControl`, a controlled admin button that cannot activate without images.

- [ ] **Step 1: Add failing server-render coverage for the control**

Append these imports to `tests/image-layer-editor-mode.test.ts`:

```ts
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ImageLayerEditModeControl from "@/components/admin/ImageLayerEditModeControl";
```

Append this suite:

```ts
describe("ImageLayerEditModeControl", () => {
  it("renders a disabled activation control without images", () => {
    const html = renderToStaticMarkup(
      createElement(ImageLayerEditModeControl, {
        active: false,
        hasImages: false,
        onActiveChange: () => undefined,
      }),
    );

    expect(html).toContain("disabled");
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("Editar imagens na pré-visualização");
  });

  it("renders the active completion control", () => {
    const html = renderToStaticMarkup(
      createElement(ImageLayerEditModeControl, {
        active: true,
        hasImages: true,
        onActiveChange: () => undefined,
      }),
    );

    expect(html).not.toContain("disabled");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Concluir edição de imagens");
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npx vitest run tests/image-layer-editor-mode.test.ts
```

Expected: FAIL with `ENOENT` because `ImageLayerEditModeControl.tsx` does not exist.

- [ ] **Step 3: Implement the controlled mode button**

Create `components/admin/ImageLayerEditModeControl.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";

interface ImageLayerEditModeControlProps {
  active: boolean;
  hasImages: boolean;
  onActiveChange: (active: boolean) => void;
}

export default function ImageLayerEditModeControl({
  active,
  hasImages,
  onActiveChange,
}: ImageLayerEditModeControlProps) {
  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant={active ? "default" : "outline"}
        className="w-full"
        disabled={!hasImages}
        aria-pressed={active}
        onClick={() => onActiveChange(!active)}
      >
        {active
          ? "Concluir edição de imagens"
          : "Editar imagens na pré-visualização"}
      </Button>
      <p className="text-xs text-muted-foreground">
        {active
          ? "As imagens podem ser selecionadas, movidas e redimensionadas na pré-visualização."
          : "Ative este modo para manipular imagens; fora dele, pode editar normalmente os elementos do convite."}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
npx vitest run tests/image-layer-editor-mode.test.ts
```

Expected: reducer, predicate, and control render tests PASS.

- [ ] **Step 5: Run ESLint on the new component and test**

Run:

```bash
npx eslint components/admin/ImageLayerEditModeControl.tsx tests/image-layer-editor-mode.test.ts
```

Expected: exit code 0 with no warnings or errors.

- [ ] **Step 6: Keep the shared control uncommitted**

```bash
git status --short
```

Expected: the control and its test changes remain unstaged and uncommitted.

### Task 3: Gate both admin preview overlays

**Files:**
- Modify: `app/admin/invitations/InvitationForm.tsx:1-10, 115-128, 617-625, 2423-2454, 4281-4288`
- Modify: `app/admin/invitations/ExternalInvitationForm.tsx:1-4, 77-88, 360-366, 1162-1192, 3919-3926`

**Interfaces:**
- Consumes: `imageLayerEditorModeReducer`, `isImageLayerEditorActive`, and `ImageLayerEditModeControl` from Tasks 1-2.
- Produces: identical explicit-mode behavior in `InvitationForm` and `ExternalInvitationForm`.

- [ ] **Step 1: Confirm the tested mode units are green before wiring**

Run:

```bash
npx vitest run tests/image-layer-editor-mode.test.ts
```

Expected: reducer, predicate, and control render tests PASS.

- [ ] **Step 2: Add state, imports, and derived activation to `InvitationForm`**

Add `useReducer` to the React import and `ImageLayer` to the existing `@/lib/types` type import, then add:

```tsx
import ImageLayerEditModeControl from "@/components/admin/ImageLayerEditModeControl";
import {
  imageLayerEditorModeReducer,
  isImageLayerEditorActive,
} from "@/lib/image-layer-editor-mode";
```

Replace the current image state derivation with:

```tsx
const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
const [imageEditing, dispatchImageEditing] = useReducer(
  imageLayerEditorModeReducer,
  false,
);
const previewRootRef = useRef<HTMLDivElement | null>(null);
const imageItemCount = form.imageLayer?.items?.length ?? 0;
const hasImageItems = imageItemCount > 0;
const imageLayerEditorActive = isImageLayerEditorActive(
  imageItemCount,
  imageEditing,
);

const updateImageLayer = (next: ImageLayer) => {
  update("imageLayer", next);
  dispatchImageEditing({
    type: "items-changed",
    itemCount: next.items.length,
  });
};
```

Inside **Imagens de fundo**, replace the uploader's `onAdded` and add the control immediately after the uploader:

```tsx
onAdded={(id) => {
  setSelectedImageId(id);
  dispatchImageEditing({ type: "image-added" });
}}
```

Use the cleanup-aware handler for each `ImageLayer` mutation in the form:

```tsx
onChange={updateImageLayer}
```

```tsx
<ImageLayerEditModeControl
  active={imageLayerEditorActive}
  hasImages={hasImageItems}
  onActiveChange={(editing) =>
    dispatchImageEditing({ type: "set-editing", editing })
  }
/>
```

Change the overlay prop to:

```tsx
active={imageLayerEditorActive}
```

- [ ] **Step 3: Apply the integration to `ExternalInvitationForm`**

Add `useReducer` to the React import and `ImageLayer` to the existing `@/lib/types` type import, then add these imports:

```tsx
import ImageLayerEditModeControl from "@/components/admin/ImageLayerEditModeControl";
import {
  imageLayerEditorModeReducer,
  isImageLayerEditorActive,
} from "@/lib/image-layer-editor-mode";
```

Replace the current image state derivation with:

```tsx
const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
const [imageEditing, dispatchImageEditing] = useReducer(
  imageLayerEditorModeReducer,
  false,
);
const previewRootRef = useRef<HTMLDivElement | null>(null);
const imageItemCount = form.imageLayer?.items?.length ?? 0;
const hasImageItems = imageItemCount > 0;
const imageLayerEditorActive = isImageLayerEditorActive(
  imageItemCount,
  imageEditing,
);

const updateImageLayer = (next: ImageLayer) => {
  update("imageLayer", next);
  dispatchImageEditing({
    type: "items-changed",
    itemCount: next.items.length,
  });
};
```

Replace each image-layer `onChange` callback in the uploader, inspector, and overlay with:

```tsx
onChange={updateImageLayer}
```

Replace the uploader's `onAdded` callback with:

```tsx
onAdded={(id) => {
  setSelectedImageId(id);
  dispatchImageEditing({ type: "image-added" });
}}
```

Add the control immediately after the uploader:

```tsx
<ImageLayerEditModeControl
  active={imageLayerEditorActive}
  hasImages={hasImageItems}
  onActiveChange={(editing) =>
    dispatchImageEditing({ type: "set-editing", editing })
  }
/>
```

Change the overlay prop to:

```tsx
active={imageLayerEditorActive}
```

- [ ] **Step 4: Run the focused behavior tests after wiring**

Run:

```bash
npx vitest run tests/image-layer-editor-mode.test.ts
```

Expected: all reducer, predicate, and control render tests PASS.

- [ ] **Step 5: Run relevant regression tests**

Run:

```bash
npx vitest run tests/image-layer.test.ts tests/image-layer-editor-geometry.test.ts tests/image-layer-editor-observer.test.ts tests/image-layer-uploader-anchor-integration.test.ts tests/image-layer-editor-mode.test.ts
```

Expected: all image-layer tests PASS.

- [ ] **Step 6: Leave both form integrations uncommitted as requested**

```bash
git status --short
```

Expected: the implementation and test files remain unstaged and uncommitted.

### Task 4: Verify the completed behavior

**Files:**
- No file changes expected.

**Interfaces:**
- Verifies the deliverables from Tasks 1-3 without widening scope.

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: all Vitest files PASS with no unhandled errors.

- [ ] **Step 2: Run the full lint suite**

```bash
npm run lint
```

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 3: Run TypeScript validation**

```bash
npx tsc --noEmit
```

Expected: exit code 0. If generated Prisma imports are missing, run `npm run db:generate` and repeat this command; do not instantiate a separate Prisma client.

- [ ] **Step 4: Verify the admin interaction manually**

Run the existing development server or start it with:

```bash
npm run dev
```

In an invitation containing a canvas-sized background image, verify:

1. The preview opens with image-editing mode disabled.
2. Clicking invitation text opens the font/size toolbar.
3. Clicking **Editar imagens na pré-visualização** enables image selection, dragging, resizing, and rotation.
4. Clicking **Concluir edição de imagens** removes the image hitboxes and restores text/card interaction.
5. Uploading a new image selects it and enters image-editing mode automatically.
6. Removing the last image immediately removes the interaction overlay.

- [ ] **Step 5: Confirm the worktree contains only intended changes**

```bash
git status --short
git diff --check
```

Expected: no unstaged implementation changes after the task commits, and no whitespace errors.
