# Admin Preview Image Edit Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent large background-image hitboxes from blocking inline text and card controls by making preview image manipulation an explicit admin mode.

**Architecture:** Both invitation forms will own an `imageEditing` UI flag and will activate `ImageLayerEditor` only when that flag is true and at least one image-layer item exists. A shared admin control will expose the mode consistently, while a pure predicate will encode and test the activation rule without introducing DOM testing into the Node-only Vitest suite.

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

- Create `lib/image-layer-editor-mode.ts`: pure activation predicate shared by both forms.
- Create `components/admin/ImageLayerEditModeControl.tsx`: shared mode button and concise status guidance.
- Create `tests/image-layer-editor-mode.test.ts`: predicate coverage plus Node-compatible source integration checks.
- Modify `app/admin/invitations/InvitationForm.tsx`: own the mode state, render the shared control, enable it after upload, and gate `ImageLayerEditor`.
- Modify `app/admin/invitations/ExternalInvitationForm.tsx`: apply the same state and UI integration to external invitations.

### Task 1: Encode the image-editor activation rule

**Files:**
- Create: `lib/image-layer-editor-mode.ts`
- Create: `tests/image-layer-editor-mode.test.ts`

**Interfaces:**
- Produces: `isImageLayerEditorActive(itemCount: number, editing: boolean): boolean`
- Consumes: no application state or browser APIs.

- [ ] **Step 1: Write the failing predicate tests**

Create `tests/image-layer-editor-mode.test.ts` with the following initial content:

```ts
import { describe, expect, it } from "vitest";

import { isImageLayerEditorActive } from "@/lib/image-layer-editor-mode";

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

Expected: all three predicate tests PASS.

- [ ] **Step 5: Commit the predicate and tests**

```bash
git add lib/image-layer-editor-mode.ts tests/image-layer-editor-mode.test.ts
git commit -m "test: define image layer editor activation"
```

### Task 2: Add the shared image-edit mode control

**Files:**
- Create: `components/admin/ImageLayerEditModeControl.tsx`
- Modify: `tests/image-layer-editor-mode.test.ts`

**Interfaces:**
- Consumes: `active: boolean`, `hasImages: boolean`, and `onActiveChange(active: boolean): void`.
- Produces: `ImageLayerEditModeControl`, a controlled admin button that cannot activate without images.

- [ ] **Step 1: Add failing source-contract coverage for the control**

Append imports and a source fixture to `tests/image-layer-editor-mode.test.ts`:

```ts
import { readFileSync } from "node:fs";

const controlSource = readFileSync(
  "components/admin/ImageLayerEditModeControl.tsx",
  "utf8",
);
```

Append this suite:

```ts
describe("ImageLayerEditModeControl source", () => {
  it("cannot activate without images and exposes both mode labels", () => {
    expect(controlSource).toContain("disabled={!hasImages}");
    expect(controlSource).toContain("Editar imagens na pré-visualização");
    expect(controlSource).toContain("Concluir edição de imagens");
    expect(controlSource).toContain("onActiveChange(!active)");
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

Expected: predicate and control source tests PASS.

- [ ] **Step 5: Run ESLint on the new component and test**

Run:

```bash
npx eslint components/admin/ImageLayerEditModeControl.tsx tests/image-layer-editor-mode.test.ts
```

Expected: exit code 0 with no warnings or errors.

- [ ] **Step 6: Commit the shared control**

```bash
git add components/admin/ImageLayerEditModeControl.tsx tests/image-layer-editor-mode.test.ts
git commit -m "feat: add image layer edit mode control"
```

### Task 3: Gate both admin preview overlays

**Files:**
- Modify: `app/admin/invitations/InvitationForm.tsx:1-10, 115-128, 617-625, 2423-2454, 4281-4288`
- Modify: `app/admin/invitations/ExternalInvitationForm.tsx:1-4, 77-88, 360-366, 1162-1192, 3919-3926`
- Modify: `tests/image-layer-editor-mode.test.ts`

**Interfaces:**
- Consumes: `isImageLayerEditorActive(itemCount, editing)` from Task 1 and `ImageLayerEditModeControl` from Task 2.
- Produces: identical explicit-mode behavior in `InvitationForm` and `ExternalInvitationForm`.

- [ ] **Step 1: Add failing integration source tests for both forms**

Append these fixtures to `tests/image-layer-editor-mode.test.ts`:

```ts
const formSources = [
  "app/admin/invitations/InvitationForm.tsx",
  "app/admin/invitations/ExternalInvitationForm.tsx",
].map((path) => [path, readFileSync(path, "utf8")] as const);
```

Append this suite:

```ts
describe.each(formSources)("%s image edit mode integration", (_path, source) => {
  it("starts disabled and gates the pointer-capturing overlay", () => {
    expect(source).toContain(
      "const [imageEditing, setImageEditing] = useState(false);",
    );
    expect(source).toContain(
      "isImageLayerEditorActive(imageItemCount, imageEditing)",
    );
    expect(source).toContain("active={imageLayerEditorActive}");
  });

  it("renders the mode control and enables it after upload", () => {
    expect(source).toContain("<ImageLayerEditModeControl");
    expect(source).toContain("onActiveChange={setImageEditing}");
    expect(source).toMatch(
      /onAdded=\{\(id\) => \{\s*setSelectedImageId\(id\);\s*setImageEditing\(true\);\s*\}\}/,
    );
  });

  it("turns the requested mode off after the last image is removed", () => {
    expect(source).toContain("if (next.items.length === 0)");
    expect(source).toContain("setImageEditing(false);");
    expect(source).toContain("onChange={updateImageLayer}");
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npx vitest run tests/image-layer-editor-mode.test.ts
```

Expected: the predicate and control suites PASS; both form integration suites FAIL because neither form owns or uses the explicit mode yet.

- [ ] **Step 3: Add state, imports, and derived activation to `InvitationForm`**

Add `ImageLayer` to the existing `@/lib/types` type import, then add:

```tsx
import ImageLayerEditModeControl from "@/components/admin/ImageLayerEditModeControl";
import { isImageLayerEditorActive } from "@/lib/image-layer-editor-mode";
```

Replace the current image state derivation with:

```tsx
const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
const [imageEditing, setImageEditing] = useState(false);
const previewRootRef = useRef<HTMLDivElement | null>(null);
const imageItemCount = form.imageLayer?.items?.length ?? 0;
const hasImageItems = imageItemCount > 0;
const imageLayerEditorActive = isImageLayerEditorActive(
  imageItemCount,
  imageEditing,
);

const updateImageLayer = (next: ImageLayer) => {
  update("imageLayer", next);
  if (next.items.length === 0) {
    setImageEditing(false);
  }
};
```

Inside **Imagens de fundo**, replace the uploader's `onAdded` and add the control immediately after the uploader:

```tsx
onAdded={(id) => {
  setSelectedImageId(id);
  setImageEditing(true);
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
  onActiveChange={setImageEditing}
/>
```

Change the overlay prop to:

```tsx
active={imageLayerEditorActive}
```

- [ ] **Step 4: Apply the identical integration to `ExternalInvitationForm`**

Add `ImageLayer` to the existing `@/lib/types` type import, then add these imports:

```tsx
import ImageLayerEditModeControl from "@/components/admin/ImageLayerEditModeControl";
import { isImageLayerEditorActive } from "@/lib/image-layer-editor-mode";
```

Replace the current image state derivation with:

```tsx
const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
const [imageEditing, setImageEditing] = useState(false);
const previewRootRef = useRef<HTMLDivElement | null>(null);
const imageItemCount = form.imageLayer?.items?.length ?? 0;
const hasImageItems = imageItemCount > 0;
const imageLayerEditorActive = isImageLayerEditorActive(
  imageItemCount,
  imageEditing,
);

const updateImageLayer = (next: ImageLayer) => {
  update("imageLayer", next);
  if (next.items.length === 0) {
    setImageEditing(false);
  }
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
  setImageEditing(true);
}}
```

Add the control immediately after the uploader:

```tsx
<ImageLayerEditModeControl
  active={imageLayerEditorActive}
  hasImages={hasImageItems}
  onActiveChange={setImageEditing}
/>
```

Change the overlay prop to:

```tsx
active={imageLayerEditorActive}
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
npx vitest run tests/image-layer-editor-mode.test.ts
```

Expected: all predicate, control, and form integration tests PASS.

- [ ] **Step 6: Run relevant regression tests**

Run:

```bash
npx vitest run tests/image-layer.test.ts tests/image-layer-editor-geometry.test.ts tests/image-layer-editor-observer.test.ts tests/image-layer-uploader-anchor-integration.test.ts tests/image-layer-editor-mode.test.ts
```

Expected: all image-layer tests PASS.

- [ ] **Step 7: Commit both form integrations**

```bash
git add app/admin/invitations/InvitationForm.tsx app/admin/invitations/ExternalInvitationForm.tsx tests/image-layer-editor-mode.test.ts
git commit -m "fix: gate admin background image interactions"
```

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
