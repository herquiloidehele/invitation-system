# ScratchDateReveal Shape Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins choose circle or rounded-square ScratchDateReveal surfaces while preserving circle behavior for all existing configurations.

**Architecture:** Keep the setting in the existing `scratchReveal` JSON object and add a small pure resolver that accepts unknown persisted values and returns a safe `ScratchRevealShape`. Pass the resolved shape from the two page-level renderers into `ScratchDateReveal`, then into `ScratchCoin`, where one shape geometry controls canvas clipping, the revealed plate, the inner shadow, and scratch coverage. Add the same Select control to both admin ScratchDateReveal sections.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Framer Motion, shadcn/ui Select, Vitest, Prisma JSON persistence.

## Global Constraints

- Missing or invalid `scratchReveal.shape` values must resolve to `circle`.
- The supported values are exactly `"circle"` and `"rounded-square"`.
- Rounded-square corners must scale with the responsive coin size; do not add an admin-adjustable radius.
- No Prisma migration is needed because `scratchReveal` is already a JSON column.
- Do not change the separate `ScratchHeart` save-the-date component.
- Use TDD: write each failing test, run it to observe the expected failure, then implement the minimum code.
- Verify with focused Vitest tests, the full `npm test`, `npm run lint`, and the repository-required `npm run build`; never invoke `next build` directly.

---

### Task 1: Add the safe ScratchDateReveal shape contract

**Files:**
- Modify: `lib/types.ts:ScratchRevealConfig` to expose `ScratchRevealShape` and `shape?`.
- Modify: `lib/curtain-canva.ts` to add the resolver beside `shouldRenderScratchReveal`.
- Create: `tests/scratch-date-reveal-shape.test.ts` for the resolver contract.

**Interfaces:**
- Produces `ScratchRevealShape = "circle" | "rounded-square"`.
- Produces `resolveScratchRevealShape(value: unknown): ScratchRevealShape`.
- `resolveScratchRevealShape("rounded-square")` returns `"rounded-square"`; every other value, including `undefined`, `null`, and malformed legacy strings, returns `"circle"`.

- [ ] **Step 1: Write the failing tests**

Add this test block to `tests/scratch-date-reveal-shape.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { resolveScratchRevealShape } from "@/lib/curtain-canva";

describe("resolveScratchRevealShape", () => {
  it("defaults missing shape values to circle", () => {
    expect(resolveScratchRevealShape(undefined)).toBe("circle");
    expect(resolveScratchRevealShape(null)).toBe("circle");
  });

  it("preserves the rounded-square option", () => {
    expect(resolveScratchRevealShape("rounded-square")).toBe("rounded-square");
  });

  it("falls back to circle for invalid persisted values", () => {
    expect(resolveScratchRevealShape("square")).toBe("circle");
    expect(resolveScratchRevealShape({})).toBe("circle");
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run tests/scratch-date-reveal-shape.test.ts`

Expected: FAIL because `resolveScratchRevealShape` does not exist yet.

- [ ] **Step 3: Implement the minimal resolver and type**

In `lib/types.ts`, add:

```ts
export type ScratchRevealShape = "circle" | "rounded-square";
```

and add `shape?: ScratchRevealShape` to `ScratchRevealConfig`.

In `lib/curtain-canva.ts`, import `ScratchRevealShape` and add:

```ts
export function resolveScratchRevealShape(
  value: unknown,
): ScratchRevealShape {
  return value === "rounded-square" ? "rounded-square" : "circle";
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npx vitest run tests/scratch-date-reveal-shape.test.ts`

Expected: PASS with all resolver cases green.

- [ ] **Step 5: Commit the contract**

Run: `git add lib/types.ts lib/curtain-canva.ts tests/scratch-date-reveal-shape.test.ts && git commit -m "feat: add ScratchDateReveal shape contract"`

---

### Task 2: Make the scratch surface render circle or rounded square

**Files:**
- Modify: `components/curtain-canva/ScratchDateReveal.tsx` to resolve and pass the shape to all three coins.
- Modify: `components/curtain-canva/ScratchCoin.tsx` to apply one shape geometry to every layer and its threshold calculation.
- Modify: `tests/scratch-date-reveal-shape.test.ts` to cover the source-level propagation and geometry contract.

**Interfaces:**
- `ScratchDateReveal` reads `scratchReveal.shape` through a new optional prop `shape?: ScratchRevealShape` and resolves it with `resolveScratchRevealShape`.
- `ScratchCoin` accepts `shape?: ScratchRevealShape`, defaulting through the same resolver to `circle`.
- Rounded-square uses `ROUNDED_SQUARE_RADIUS_RATIO = 0.22`, equivalent to `22%` CSS corner radius.
- Shape coverage is `Math.PI / 4` for circles and `1 - (4 - Math.PI) * radiusRatio ** 2` for the rounded square, matching the clipped canvas area used by reveal-threshold sampling.

- [ ] **Step 1: Add failing propagation and geometry assertions**

Extend `tests/scratch-date-reveal-shape.test.ts` with source-contract checks:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

it("passes the configured shape to every ScratchCoin", () => {
  const source = readFileSync(
    join(process.cwd(), "components/curtain-canva/ScratchDateReveal.tsx"),
    "utf8",
  );

  expect(source).toContain("shape={resolvedShape}");
  expect(source.match(/shape=\{resolvedShape\}/g)).toHaveLength(3);
});

it("uses shape-aware clipping and coverage in ScratchCoin", () => {
  const source = readFileSync(
    join(process.cwd(), "components/curtain-canva/ScratchCoin.tsx"),
    "utf8",
  );

  expect(source).toContain('shape?: ScratchRevealShape');
  expect(source).toContain("ctx.roundRect");
  expect(source).toContain("ROUNDED_SQUARE_RADIUS_RATIO");
  expect(source).toContain("rounded-square");
  expect(source).toContain("shapeCoverage");
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run tests/scratch-date-reveal-shape.test.ts`

Expected: FAIL because the components do not yet expose or use a shape prop.

- [ ] **Step 3: Implement shape propagation and rendering**

In `ScratchDateReveal.tsx`:

1. Import `ScratchRevealShape` and `resolveScratchRevealShape`.
2. Add `shape?: ScratchRevealShape` to `ScratchDateRevealProps`.
3. Compute `const resolvedShape = resolveScratchRevealShape(shape);`.
4. Add `shape={resolvedShape}` to each of the three `CoinWithLabel` calls and add the corresponding `shape` parameter to `CoinWithLabel` and its `ScratchCoin` call.

In `ScratchCoin.tsx`:

1. Import `ScratchRevealShape` and `resolveScratchRevealShape`.
2. Add `shape?: ScratchRevealShape` to `ScratchCoinProps` and resolve it at the top of the component.
3. Add `const ROUNDED_SQUARE_RADIUS_RATIO = 0.22` and compute the pixel radius from the current `size`.
4. Replace the unconditional circular canvas clip with a shape branch:

```ts
if (resolvedShape === "rounded-square") {
  ctx.roundRect(0, 0, cw, ch, size * ROUNDED_SQUARE_RADIUS_RATIO * dpr);
} else {
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
}
```

5. Replace the hard-coded circle threshold constant with:

```ts
const shapeCoverage =
  resolvedShape === "rounded-square"
    ? 1 - (4 - Math.PI) * ROUNDED_SQUARE_RADIUS_RATIO ** 2
    : Math.PI / 4;
```

Use `shapeCoverage` in `originalShapeSamples = sampled * shapeCoverage`.
6. Use `borderRadius: resolvedShape === "circle" ? "50%" : "22%"` on the canvas and the same radius on the revealed plate.
7. In the SVG inner-shadow overlay, render a `<circle>` for circles and a `<rect x="0" y="0" width="100" height="100" rx="22" ry="22">` for rounded squares. Keep the existing filter id and z-index behavior.

Keep the existing texture painting, pointer events, keyboard reveal, reduced-motion behavior, animation, and content layout unchanged.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `npx vitest run tests/scratch-date-reveal-shape.test.ts tests/curtain-hero-confetti.test.ts`

Expected: PASS with the new shape contract and all existing curtain helper tests green.

- [ ] **Step 5: Commit the rendering change**

Run: `git add components/curtain-canva/ScratchDateReveal.tsx components/curtain-canva/ScratchCoin.tsx tests/scratch-date-reveal-shape.test.ts && git commit -m "feat: render ScratchDateReveal shapes"`

---

### Task 3: Add the shape selector to both admin sections

**Files:**
- Modify: `app/admin/invitations/ExternalInvitationForm.tsx` in the rich external ScratchDateReveal subsection and the Curtain & Canva ScratchDateReveal subsection.
- Modify: `tests/external-invitation-form.test.ts` with admin source-contract assertions.
- Modify: `components/shared/RichExternalLinkPage.tsx` and `components/shared/RevealableExternalSections.tsx` to forward `scratchReveal?.shape` into `ScratchDateReveal`.
- Modify: `tests/external-invitation-form.test.ts` to assert both renderer forwarding paths.

**Interfaces:**
- The Select value is `resolveScratchRevealShape(form.scratchReveal?.shape)`.
- Selection writes through the existing `updateScratchRevealField("shape", value)` helper.
- Both public renderer paths pass `shape={invitation.scratchReveal?.shape}` to `ScratchDateReveal`; the component performs the final safe fallback.

- [ ] **Step 1: Add failing admin and renderer forwarding assertions**

Add these source-contract assertions to `tests/external-invitation-form.test.ts`:

```ts
it("offers both ScratchDateReveal shape options in both admin sections", () => {
  const source = readFileSync(
    join(process.cwd(), "app/admin/invitations/ExternalInvitationForm.tsx"),
    "utf8",
  );

  expect(source.match(/Quadrado arredondado/g)).toHaveLength(2);
  expect(source.match(/updateScratchRevealField\("shape"/g)).toHaveLength(2);
  expect(source.match(/resolveScratchRevealShape\(/g)).toHaveLength(2);
});

it("forwards ScratchDateReveal shape through both rich page renderers", () => {
  const richSource = readFileSync(
    join(process.cwd(), "components/shared/RichExternalLinkPage.tsx"),
    "utf8",
  );
  const revealableSource = readFileSync(
    join(process.cwd(), "components/shared/RevealableExternalSections.tsx"),
    "utf8",
  );

  expect(richSource).toContain(
    "shape={invitation.scratchReveal?.shape}",
  );
  expect(revealableSource).toContain(
    "shape={invitation.scratchReveal?.shape}",
  );
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run tests/external-invitation-form.test.ts`

Expected: FAIL because the selector and renderer prop forwarding are absent.

- [ ] **Step 3: Implement the selector and forwarding**

In `ExternalInvitationForm.tsx`:

1. Import `ScratchRevealShape` and `resolveScratchRevealShape`.
2. In each enabled ScratchDateReveal block, add a labeled Select before `SectionBackgroundImageEditor`:

```tsx
<div className="space-y-1.5">
  <Label htmlFor="ccScratchShape">Formato das moedas</Label>
  <Select
    value={resolveScratchRevealShape(form.scratchReveal?.shape)}
    onValueChange={(value) =>
      updateScratchRevealField("shape", value as ScratchRevealShape)
    }
  >
    <SelectTrigger id="ccScratchShape">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="circle">Círculo</SelectItem>
      <SelectItem value="rounded-square">Quadrado arredondado</SelectItem>
    </SelectContent>
  </Select>
</div>
```

Use distinct ids (`ccScratchShape` and `veScratchShape`) for the two sections. Keep the field inside the existing `scratchReveal.enabled === true` conditional so it only appears when the feature is active.

In `RichExternalLinkPage.tsx` and `RevealableExternalSections.tsx`, add:

```tsx
shape={invitation.scratchReveal?.shape}
```

to their existing `ScratchDateReveal` calls.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `npx vitest run tests/external-invitation-form.test.ts tests/invitation-admin-initial-data.test.ts tests/invitation-create-data.test.ts`

Expected: PASS. The existing generic JSON persistence path should preserve the new optional field without API or mapper changes.

- [ ] **Step 5: Commit the admin integration**

Run: `git add app/admin/invitations/ExternalInvitationForm.tsx components/shared/RichExternalLinkPage.tsx components/shared/RevealableExternalSections.tsx tests/external-invitation-form.test.ts && git commit -m "feat: add ScratchDateReveal shape selector"`

---

### Task 4: Run repository verification

**Files:**
- No source changes expected; only fix regressions discovered by verification.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: all Vitest tests pass.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: ESLint exits successfully with no new warnings/errors.

- [ ] **Step 3: Run the required production build**

Run: `npm run build`

Expected: Prisma generation/migrations and the Next.js production build complete successfully. Do not substitute `next build`.

- [ ] **Step 4: Inspect the final diff**

Run: `git diff HEAD~3..HEAD --check && git status --short`

Expected: no whitespace errors and a clean worktree after any verification fixes are committed.

- [ ] **Step 5: Resolve any verification failure and rerun the failed command**

If a verification command fails, inspect its output, make the smallest directly related source correction with `apply_patch`, and rerun that command. Keep unrelated files untouched; once all commands pass, report the exact verification results.
