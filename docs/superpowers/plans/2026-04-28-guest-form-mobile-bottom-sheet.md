# Guest Form Mobile Bottom Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the add/edit guest form open as a bottom sheet on mobile while preserving the current right-side sheet on `sm` and larger screens.

**Architecture:** Keep one `GuestForm` and make the shared `SheetContent` support a mobile-side override so the same form can render as `bottom` on phones and `right` on larger screens. Isolate the guest-form shell config in a small helper so the responsive behavior stays testable without pulling the full form UI into unit tests.

**Tech Stack:** Next.js 16, React 19, TypeScript, shadcn/ui `Sheet`, Tailwind CSS, react-hook-form, zod, Vitest.

**Spec:** `docs/superpowers/specs/2026-04-28-guest-form-mobile-bottom-sheet-design.md`

**Execution Note:** The user asked to handle git commits manually. Do not create commits while executing this plan.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `components/ui/sheet.tsx` | Add a small, testable helper for responsive sheet-side class composition and extend `SheetContent` with an optional mobile-side override |
| `components/admin/guest-form-sheet.ts` | Define the guest form's responsive sheet props and shell class names in one place |
| `components/admin/GuestForm.tsx` | Use the new responsive sheet config and ensure the mobile bottom sheet has capped height with internal scrolling |
| `tests/sheet-responsive-side.test.ts` | Verify the shared sheet helper returns the correct class combinations for normal and mobile-bottom cases |
| `tests/guest-form-sheet.test.ts` | Verify the guest form shell config requests `bottom` on mobile and preserves the desktop `right` sheet |

---

## Task 1: Extend the shared sheet with a mobile-side override

**Files:**
- Modify: `components/ui/sheet.tsx`
- Create: `tests/sheet-responsive-side.test.ts`

- [ ] **Step 1: Write the failing test for responsive sheet-side classes**

Create `tests/sheet-responsive-side.test.ts` with:

```ts
import { describe, expect, it } from "vitest";

import { getSheetSideClassNames } from "../components/ui/sheet";

describe("getSheetSideClassNames", () => {
  it("keeps the existing right-side layout when no mobile override is provided", () => {
    const classes = getSheetSideClassNames("right");

    expect(classes).toContain("data-[side=right]:inset-y-0");
    expect(classes).toContain("data-[side=right]:right-0");
    expect(classes).not.toContain("max-sm:bottom-0");
  });

  it("supports a mobile bottom sheet while keeping the desktop right sheet", () => {
    const classes = getSheetSideClassNames("right", "bottom");

    expect(classes).toContain("max-sm:inset-x-0");
    expect(classes).toContain("max-sm:bottom-0");
    expect(classes).toContain("max-sm:border-t");
    expect(classes).toContain("max-sm:border-l-0");
    expect(classes).toContain("max-sm:rounded-t-3xl");
    expect(classes).toContain(
      "max-sm:data-[side=right]:data-ending-style:translate-y-[2.5rem]",
    );
    expect(classes).toContain(
      "max-sm:data-[side=right]:data-starting-style:translate-y-[2.5rem]",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/sheet-responsive-side.test.ts`

Expected: FAIL because `getSheetSideClassNames` does not exist yet.

- [ ] **Step 3: Add the helper and `mobileSide` support to `SheetContent`**

Update `components/ui/sheet.tsx` so the side-specific classes are centralized and exported:

```ts
type SheetSide = "top" | "right" | "bottom" | "left";

const SHEET_SIDE_CLASS_NAMES: Record<SheetSide, string> = {
  top: "data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem]",
  right:
    "data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=right]:sm:max-w-sm",
  bottom:
    "data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem]",
  left: "data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=left]:sm:max-w-sm",
};

export function getSheetSideClassNames(
  side: SheetSide,
  mobileSide?: SheetSide,
) {
  if (side === "right" && mobileSide === "bottom") {
    return cn(
      SHEET_SIDE_CLASS_NAMES.right,
      "max-sm:inset-x-0 max-sm:inset-y-auto max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:h-auto max-sm:w-full max-sm:max-w-none max-sm:border-t max-sm:border-l-0 max-sm:rounded-t-3xl max-sm:data-[side=right]:data-ending-style:translate-x-0 max-sm:data-[side=right]:data-starting-style:translate-x-0 max-sm:data-[side=right]:data-ending-style:translate-y-[2.5rem] max-sm:data-[side=right]:data-starting-style:translate-y-[2.5rem]",
    );
  }

  return SHEET_SIDE_CLASS_NAMES[side];
}
```

Then update `SheetContent` to accept the new prop and use the helper:

```ts
function SheetContent({
  className,
  children,
  side = "right",
  mobileSide,
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: SheetSide;
  mobileSide?: SheetSide;
  showCloseButton?: boolean;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-background bg-clip-padding text-sm shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0",
          getSheetSideClassNames(side, mobileSide),
          className,
        )}
        {...props}
      >
```

Do not generalize beyond the single case this feature needs. Supporting `side="right"` with `mobileSide="bottom"` is enough.

- [ ] **Step 4: Run the shared-sheet test to verify it passes**

Run: `npm test -- tests/sheet-responsive-side.test.ts`

Expected: PASS with 2 passing tests.

---

## Task 2: Wire the guest form to the new mobile bottom-sheet behavior

**Files:**
- Create: `components/admin/guest-form-sheet.ts`
- Modify: `components/admin/GuestForm.tsx`
- Create: `tests/guest-form-sheet.test.ts`

- [ ] **Step 1: Write the failing test for the guest-form shell config**

Create `tests/guest-form-sheet.test.ts` with:

```ts
import { describe, expect, it } from "vitest";

import { getGuestFormSheetProps } from "../components/admin/guest-form-sheet";

describe("getGuestFormSheetProps", () => {
  it("uses a bottom sheet on mobile and keeps the right sheet on larger screens", () => {
    const props = getGuestFormSheetProps();

    expect(props.side).toBe("right");
    expect(props.mobileSide).toBe("bottom");
    expect(props.className).toContain("max-sm:max-h-[85dvh]");
    expect(props.className).toContain("max-sm:rounded-t-3xl");
    expect(props.className).toContain("sm:max-w-md");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/guest-form-sheet.test.ts`

Expected: FAIL because `components/admin/guest-form-sheet.ts` does not exist yet.

- [ ] **Step 3: Create the guest-form sheet config helper**

Create `components/admin/guest-form-sheet.ts` with:

```ts
export function getGuestFormSheetProps() {
  return {
    side: "right" as const,
    mobileSide: "bottom" as const,
    className:
      "w-full overflow-hidden max-sm:max-h-[85dvh] max-sm:rounded-t-3xl sm:max-w-md",
    bodyClassName: "flex min-h-0 flex-1 flex-col",
    formClassName: "min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4",
    footerClassName:
      "border-t bg-background/95 supports-backdrop-filter:backdrop-blur",
  };
}
```

This file should stay small and exist only to keep the responsive shell behavior explicit and unit-testable.

- [ ] **Step 4: Update `GuestForm` to use the helper and internal scrolling**

Modify the shell of `components/admin/GuestForm.tsx` like this:

```ts
import { getGuestFormSheetProps } from "./guest-form-sheet";

export default function GuestForm({
  open,
  onOpenChange,
  guest,
  onSubmit,
  saving,
}: GuestFormProps) {
  const sheetProps = getGuestFormSheetProps();
  const form = useForm<FormValues>({
```

Then apply the helper at render time:

```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent
    side={sheetProps.side}
    mobileSide={sheetProps.mobileSide}
    className={sheetProps.className}
  >
    <SheetHeader>
      <SheetTitle>
        {guest ? "Editar convidado" : "Adicionar convidado"}
      </SheetTitle>
      <SheetDescription>
        {guest
          ? "Actualiza os detalhes deste convidado."
          : "Preenche os detalhes do novo convidado."}
      </SheetDescription>
    </SheetHeader>

    <div className={sheetProps.bodyClassName}>
      <form
        onSubmit={handleSubmit(submit)}
        className={sheetProps.formClassName}
        id="guest-form"
      >
        {/* existing fields unchanged */}
      </form>

      <SheetFooter className={sheetProps.footerClassName}>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button type="submit" form="guest-form" disabled={saving}>
          {saving && <Loader2 className="mr-1 size-3.5 animate-spin" />}
          {guest ? "Guardar" : "Adicionar"}
        </Button>
      </SheetFooter>
    </div>
  </SheetContent>
</Sheet>
```

Keep all form fields and validation logic exactly as they are today.

- [ ] **Step 5: Run the guest-form shell test to verify it passes**

Run: `npm test -- tests/guest-form-sheet.test.ts`

Expected: PASS with 1 passing test.

---

## Task 3: Run verification and perform responsive QA

**Files:**
- Modify: none

- [ ] **Step 1: Run the targeted automated checks**

Run both commands:

```bash
npm test -- tests/sheet-responsive-side.test.ts tests/guest-form-sheet.test.ts
npx tsc --noEmit
```

Expected:
- Vitest reports both test files passing.
- TypeScript exits cleanly with no output.

- [ ] **Step 2: Run manual UI verification in both surfaces**

Check these flows in the browser:

1. `/confirmacoes/[token]?tab=guests` on a mobile viewport
2. `/admin/invitations/[id]/edit` on a mobile viewport
3. The same two screens on a desktop viewport

Verify:

- mobile add guest opens from the bottom
- mobile edit guest opens from the bottom
- the form body scrolls internally when content is taller than the viewport
- cancel and close still dismiss the sheet
- save still works
- desktop add/edit still open from the right

- [ ] **Step 3: Record the result without committing**

After verification, leave the worktree uncommitted for the user to review and commit manually.

---

## Self-Review

- Spec coverage: the plan covers the responsive mobile bottom sheet, preserved desktop right sheet, capped mobile height, internal scrolling, and verification on both owner/admin guest-management surfaces.
- Placeholder scan: no `TODO`, `TBD`, or vague “handle this” steps remain.
- Type consistency: the plan uses `mobileSide`, `getSheetSideClassNames`, and `getGuestFormSheetProps` consistently across tests and implementation steps.
