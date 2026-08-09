# Post-Scratch RSVP Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in admin setting that replaces inline RSVP with a themed button after all three scratch-date coins are complete and opens the existing RSVP modal.

**Architecture:** Put pure option-gating, mutually exclusive presentation, and unique-date-part completion rules in a small domain helper. Keep `ScratchDateReveal` responsible for visual completion and the CTA, while `RichExternalLinkPage` and `RevealableExternalSections` own modal state, pass an action callback only when configuration permits it, and suppress their inline forms in that mode.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Framer Motion, next-intl/custom text resolution, Vitest in Node, ESLint.

## Global Constraints

- Store the option as optional `scratchReveal.showRsvpButtonAfterReveal`; missing or `false` must preserve current behavior.
- Render the button only when `scratchReveal.showRsvpButtonAfterReveal === true` and `rsvp.enabled === true`.
- Reveal the button only after all three unique date parts (`day`, `month`, `year`) complete.
- Use the existing `cta_confirmButton` custom text and the theme's primary CTA styles.
- Honor reduced-motion preferences.
- Open the existing shared `RSVPModal`; do not put modal or submission ownership in `ScratchDateReveal`.
- Hide inline RSVP immediately while the post-scratch modal flow is enabled; disabling the option must restore the existing inline render rules.
- Do not add dependencies or database migrations; `scratchReveal` is already stored as JSON.
- Run `npm run build`, never `next build` directly.
- For this execution, leave all implementation and documentation changes uncommitted; skip the commit checkpoints below.

## File Structure

- Create `lib/scratch-rsvp.ts`: pure configuration gate and scratch-part completion helper.
- Create `tests/scratch-rsvp.test.ts`: behavior tests for option gating and unique completion.
- Create `tests/scratch-rsvp-ui-wiring.test.ts`: established source-level integration checks compatible with the repository's Node-only Vitest environment.
- Modify `lib/types.ts`: add the optional persisted configuration field.
- Modify `components/curtain-canva/ScratchDateReveal.tsx`: track completion state and animate the CTA.
- Modify `components/shared/RichExternalLinkPage.tsx`: own and render the modal for rich external-link pages.
- Modify `components/shared/RevealableExternalSections.tsx`: own and render the modal for curtain-canva and video-entrance pages.
- Modify `app/admin/invitations/ExternalInvitationForm.tsx`: expose the option in both scratch configuration panels.

---

### Task 1: Pure RSVP Gate and Scratch Completion Rules

**Files:**
- Create: `lib/scratch-rsvp.ts`
- Create: `tests/scratch-rsvp.test.ts`
- Modify: `lib/types.ts:625-635`

**Interfaces:**
- Consumes: `InvitationData["scratchReveal"]` and `InvitationData["rsvp"]`.
- Produces: `ScratchDatePart`, `registerRevealedScratchPart(revealed, part)`, and `shouldEnablePostScratchRsvp(invitation)` for the scratch component and both page compositions.

- [ ] **Step 1: Write the failing pure behavior test**

Create `tests/scratch-rsvp.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  registerRevealedScratchPart,
  shouldEnablePostScratchRsvp,
} from "@/lib/scratch-rsvp";

describe("shouldEnablePostScratchRsvp", () => {
  it.each([
    [undefined, { enabled: true }, false],
    [{ enabled: true }, { enabled: true }, false],
    [
      { enabled: true, showRsvpButtonAfterReveal: true },
      { enabled: false },
      false,
    ],
    [
      { enabled: true, showRsvpButtonAfterReveal: true },
      { enabled: true },
      true,
    ],
  ])("gates the action from scratch=%j and rsvp=%j", (scratchReveal, rsvp, expected) => {
    expect(shouldEnablePostScratchRsvp({ scratchReveal, rsvp })).toBe(expected);
  });
});

describe("registerRevealedScratchPart", () => {
  it("completes only after day, month, and year have each revealed", () => {
    const day = registerRevealedScratchPart(new Set(), "day");
    const duplicateDay = registerRevealedScratchPart(day.parts, "day");
    const month = registerRevealedScratchPart(duplicateDay.parts, "month");
    const year = registerRevealedScratchPart(month.parts, "year");

    expect(day.complete).toBe(false);
    expect(duplicateDay.complete).toBe(false);
    expect(month.complete).toBe(false);
    expect(year.complete).toBe(true);
    expect([...year.parts]).toEqual(["day", "month", "year"]);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx vitest run tests/scratch-rsvp.test.ts`

Expected: FAIL because `@/lib/scratch-rsvp` does not exist.

- [ ] **Step 3: Add the optional configuration type and minimal helper**

Add to `ScratchRevealConfig` in `lib/types.ts`:

```ts
/** Show an RSVP modal CTA after every date surface has been revealed. */
showRsvpButtonAfterReveal?: boolean;
```

Create `lib/scratch-rsvp.ts`:

```ts
import type { InvitationData } from "./types";

export type ScratchDatePart = "day" | "month" | "year";

const SCRATCH_DATE_PART_COUNT = 3;

export function registerRevealedScratchPart(
  revealed: ReadonlySet<ScratchDatePart>,
  part: ScratchDatePart,
): { parts: Set<ScratchDatePart>; complete: boolean } {
  const parts = new Set(revealed);
  parts.add(part);
  return { parts, complete: parts.size === SCRATCH_DATE_PART_COUNT };
}

export function shouldEnablePostScratchRsvp(
  invitation: Pick<InvitationData, "scratchReveal" | "rsvp">,
): boolean {
  return (
    invitation.scratchReveal?.showRsvpButtonAfterReveal === true &&
    invitation.rsvp.enabled === true
  );
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npx vitest run tests/scratch-rsvp.test.ts`

Expected: all 5 table/case tests PASS.

- [ ] **Step 5: Commit the domain behavior**

```bash
git add lib/types.ts lib/scratch-rsvp.ts tests/scratch-rsvp.test.ts
git commit -m "feat: define post-scratch RSVP behavior"
```

---

### Task 2: Reveal the Theme-Styled CTA After Scratch Completion

**Files:**
- Modify: `components/curtain-canva/ScratchDateReveal.tsx:3-290`
- Create: `tests/scratch-rsvp-ui-wiring.test.ts`

**Interfaces:**
- Consumes: `registerRevealedScratchPart` and `ScratchDatePart` from Task 1; optional `onRsvpClick?: () => void` prop.
- Produces: a completion-gated button using `t("cta_confirmButton")` that calls `onRsvpClick`.

- [ ] **Step 1: Write the failing component-wiring test**

Create `tests/scratch-rsvp-ui-wiring.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("post-scratch RSVP UI wiring", () => {
  it("reveals a customized themed CTA from the unique-part completion result", () => {
    const source = readSource(
      "components/curtain-canva/ScratchDateReveal.tsx",
    );

    expect(source).toContain("onRsvpClick?: () => void");
    expect(source).toContain("registerRevealedScratchPart");
    expect(source).toContain("setRsvpButtonVisible(true)");
    expect(source).toContain('t("cta_confirmButton")');
    expect(source).toContain("background: theme.ctaPrimaryBg");
    expect(source).toContain("color: theme.ctaPrimaryText");
    expect(source).toContain("borderRadius: theme.ctaRadius");
    expect(source).toContain("onClick={onRsvpClick}");
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run tests/scratch-rsvp-ui-wiring.test.ts`

Expected: FAIL because the component has no RSVP callback or CTA.

- [ ] **Step 3: Replace ad-hoc completion mutation with the tested helper**

In `ScratchDateReveal.tsx`:

```ts
import { useState } from "react";
import {
  registerRevealedScratchPart,
  type ScratchDatePart,
} from "@/lib/scratch-rsvp";
```

Extend props and the component arguments:

```ts
/** Opens RSVP after all three scratch surfaces are revealed. */
onRsvpClick?: () => void;
```

Add state next to the existing completion refs:

```ts
const revealedCoinsRef = useRef<Set<ScratchDatePart>>(new Set());
const [rsvpButtonVisible, setRsvpButtonVisible] = useState(false);
```

Update `handleCoinRevealed`:

```ts
const handleCoinRevealed = useCallback(
  (key: ScratchDatePart) => {
    const result = registerRevealedScratchPart(
      revealedCoinsRef.current,
      key,
    );
    revealedCoinsRef.current = result.parts;
    if (result.complete) {
      fireCelebration();
      if (onRsvpClick) setRsvpButtonVisible(true);
    }
  },
  [fireCelebration, onRsvpClick],
);
```

- [ ] **Step 4: Add the reduced-motion-aware CTA below the coin row**

Immediately after the coin row in `ScratchDateReveal.tsx`, add:

```tsx
{onRsvpClick && rsvpButtonVisible && (
  <motion.button
    type="button"
    onClick={onRsvpClick}
    className="mx-auto mt-10 flex w-full max-w-xs cursor-pointer items-center justify-center px-5 py-4 font-medium"
    style={{
      fontFamily: theme.uiFont,
      fontSize: 13,
      fontWeight: 500,
      letterSpacing: 1,
      background: theme.ctaPrimaryBg,
      color: theme.ctaPrimaryText,
      borderRadius: theme.ctaRadius,
    }}
    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
    whileHover={reduceMotion ? undefined : { scale: 1.015 }}
    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    {t("cta_confirmButton")}
  </motion.button>
)}
```

- [ ] **Step 5: Run focused behavior and wiring tests**

Run: `npx vitest run tests/scratch-rsvp.test.ts tests/scratch-rsvp-ui-wiring.test.ts`

Expected: all focused helper and component-wiring tests PASS.

- [ ] **Step 6: Commit the scratch CTA**

```bash
git add components/curtain-canva/ScratchDateReveal.tsx tests/scratch-rsvp-ui-wiring.test.ts
git commit -m "feat: reveal RSVP action after scratching date"
```

---

### Task 3: Wire the CTA to the Existing Modal in Both Page Compositions

**Files:**
- Modify: `lib/scratch-rsvp.ts`
- Modify: `components/shared/RichExternalLinkPage.tsx:3-390`
- Modify: `components/shared/RevealableExternalSections.tsx:3-330`
- Modify: `tests/scratch-rsvp.test.ts`
- Modify: `tests/scratch-rsvp-ui-wiring.test.ts`

**Interfaces:**
- Consumes: `shouldEnablePostScratchRsvp(invitation)`, `ScratchDateReveal.onRsvpClick`, and the integration form of `RSVPModal`.
- Produces: `shouldShowInlineRsvp({ inlineEligible, postScratchRsvpEnabled })` plus mutually exclusive inline/modal rendering for rich external-link, curtain-canva, and video-entrance invitation paths.

- [ ] **Step 1: Extend the failing integration test**

Append to `tests/scratch-rsvp.test.ts`:

```ts
describe("shouldShowInlineRsvp", () => {
  it.each([
    [false, false, false],
    [false, true, false],
    [true, false, true],
    [true, true, false],
  ])(
    "returns %s for inlineEligible=%s and postScratchRsvpEnabled=%s",
    (inlineEligible, postScratchRsvpEnabled, expected) => {
      expect(
        shouldShowInlineRsvp({ inlineEligible, postScratchRsvpEnabled }),
      ).toBe(expected);
    },
  );
});
```

Append inside the existing `describe` in `tests/scratch-rsvp-ui-wiring.test.ts`:

```ts
it.each([
  "components/shared/RichExternalLinkPage.tsx",
  "components/shared/RevealableExternalSections.tsx",
])("opens the shared RSVP modal from the scratch callback in %s", (path) => {
  const source = readSource(path);

  expect(source).toContain("shouldEnablePostScratchRsvp(invitation)");
  expect(source).toContain("onRsvpClick={");
  expect(source).toContain("setRsvpOpen(true)");
  expect(source).toContain("<RSVPModal");
  expect(source).toContain("open={rsvpOpen}");
  expect(source).toContain("invitation={invitation}");
  expect(source).toContain("customTexts={invitation.customTexts}");
  expect(source).toContain("guest={invitation.guest}");
});

it.each([
  "components/shared/RichExternalLinkPage.tsx",
  "components/shared/RevealableExternalSections.tsx",
])("uses a mutually exclusive inline RSVP gate in %s", (path) => {
  const source = readSource(path);

  expect(source).toContain("shouldShowInlineRsvp({");
  expect(source).toContain("postScratchRsvpEnabled");
  expect(source).toContain("{showInlineRsvp && (");
  expect(source).toContain("<RSVPForm");
  expect(source).toContain("inline");
});
```

- [ ] **Step 2: Run the integration test and verify RED**

Run: `npx vitest run tests/scratch-rsvp-ui-wiring.test.ts`

Expected: FAIL because `shouldShowInlineRsvp` does not exist and both compositions still render inline RSVP while the post-scratch modal flow is enabled.

- [ ] **Step 3: Add the pure mutually exclusive inline gate**

Add to `lib/scratch-rsvp.ts`:

```ts
export function shouldShowInlineRsvp({
  inlineEligible,
  postScratchRsvpEnabled,
}: {
  inlineEligible: boolean;
  postScratchRsvpEnabled: boolean;
}): boolean {
  return inlineEligible && !postScratchRsvpEnabled;
}
```

- [ ] **Step 4: Add modal ownership and exclusive inline rendering to `RichExternalLinkPage`**

Import the gate and modal, then add state:

```ts
import RSVPModal from "./RSVPModal";
import {
  shouldEnablePostScratchRsvp,
  shouldShowInlineRsvp,
} from "@/lib/scratch-rsvp";

const [rsvpOpen, setRsvpOpen] = useState(false);
const postScratchRsvpEnabled = shouldEnablePostScratchRsvp(invitation);
const showInlineRsvp = shouldShowInlineRsvp({
  inlineEligible: showRsvp,
  postScratchRsvpEnabled,
});
```

Pass the action to `ScratchDateReveal`:

```tsx
onRsvpClick={
  postScratchRsvpEnabled ? () => setRsvpOpen(true) : undefined
}
```

Change the inline form condition from `showRsvp` to `showInlineRsvp`. Before the closing `ImageCanvas`, add:

```tsx
{postScratchRsvpEnabled && (
  <RSVPModal
    open={rsvpOpen}
    onClose={() => setRsvpOpen(false)}
    invitation={invitation}
    theme={theme}
    customTexts={invitation.customTexts}
    guest={invitation.guest}
  />
)}
```

- [ ] **Step 5: Add the same modal ownership and exclusive gate to `RevealableExternalSections`**

Change the React import to include `useState`, import the gate and modal, then add:

```ts
const [rsvpOpen, setRsvpOpen] = useState(false);
const postScratchRsvpEnabled = shouldEnablePostScratchRsvp(invitation);
const showInlineRsvp = shouldShowInlineRsvp({
  inlineEligible: showInitialPageSections && invitation.rsvp.enabled,
  postScratchRsvpEnabled,
});
```

Pass the same conditional `onRsvpClick` to `ScratchDateReveal`. Change the inline form condition to `showInlineRsvp`. Render the same `RSVPModal` block after the reveal-gated content `div`, so an open modal is never nested beneath `aria-hidden={!revealed}`.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npx vitest run tests/scratch-rsvp.test.ts tests/scratch-rsvp-ui-wiring.test.ts tests/external-invitation-form.test.ts`

Expected: all focused tests PASS, including proof that inline RSVP remains available only when eligible and the post-scratch modal flow is disabled.

- [ ] **Step 7: Preserve the verified changes without committing**

Run: `git status --short`

Expected: the helper, both page compositions, and both focused test files remain modified or untracked; do not stage or commit them.

---

### Task 4: Expose the Opt-In Admin Control in Both Scratch Panels

**Files:**
- Modify: `app/admin/invitations/ExternalInvitationForm.tsx:2520-2590,3250-3320`
- Modify: `tests/scratch-rsvp-ui-wiring.test.ts`

**Interfaces:**
- Consumes: `ScratchRevealConfig.showRsvpButtonAfterReveal` from Task 1 and the existing `updateScratchRevealField` updater.
- Produces: two equivalent admin switches, one per external invitation layout panel.

- [ ] **Step 1: Add the failing admin-control source test**

Append inside the existing `describe` in `tests/scratch-rsvp-ui-wiring.test.ts`:

```ts
it("offers the opt-in post-scratch RSVP switch in both admin panels", () => {
  const source = readSource(
    "app/admin/invitations/ExternalInvitationForm.tsx",
  );

  expect(
    source.match(
      /checked=\{form\.scratchReveal\?\.showRsvpButtonAfterReveal === true\}/g,
    ),
  ).toHaveLength(2);
  expect(
    source.match(
      /updateScratchRevealField\(\s*"showRsvpButtonAfterReveal"/g,
    ),
  ).toHaveLength(2);
  expect(source.match(/Mostrar RSVP após raspar/g)).toHaveLength(2);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx vitest run tests/scratch-rsvp-ui-wiring.test.ts`

Expected: FAIL with no matching admin switches.

- [ ] **Step 3: Add the switch to the curtain-canva scratch panel**

Inside the enabled scratch fragment, after the shape selector and before the background editor, add:

```tsx
<div className="flex items-center justify-between gap-4">
  <div className="space-y-0.5">
    <Label>Mostrar RSVP após raspar</Label>
    <p className="text-xs text-muted-foreground">
      Mostra o botão de confirmação depois de revelar a data completa e abre o modal RSVP.
    </p>
  </div>
  <Switch
    checked={
      form.scratchReveal?.showRsvpButtonAfterReveal === true
    }
    onCheckedChange={(value) =>
      updateScratchRevealField("showRsvpButtonAfterReveal", value)
    }
    disabled={!form.rsvp.enabled}
  />
</div>
```

- [ ] **Step 4: Add the identical switch to the video-entrance scratch panel**

Insert the same labeled control in the second enabled scratch fragment, after its shape selector and before its background editor. Keep it disabled when RSVP is off; do not erase the stored option so re-enabling RSVP restores the administrator's choice.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npx vitest run tests/scratch-rsvp.test.ts tests/scratch-rsvp-ui-wiring.test.ts tests/external-invitation-form.test.ts`

Expected: all focused tests PASS.

- [ ] **Step 6: Commit the admin option**

```bash
git add app/admin/invitations/ExternalInvitationForm.tsx tests/scratch-rsvp-ui-wiring.test.ts
git commit -m "feat: configure post-scratch RSVP action"
```

---

### Task 5: Full Verification

**Files:**
- Verify only; modify implementation files only if a command exposes a regression.

**Interfaces:**
- Consumes: completed Tasks 1-4.
- Produces: evidence that focused behavior, repository tests, lint, and production build all pass.

- [ ] **Step 1: Run all Vitest tests**

Run: `npm test`

Expected: all tests PASS with no unhandled errors.

- [ ] **Step 2: Run ESLint**

Run: `npm run lint`

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 3: Run the repository build command**

Run: `npm run build`

Expected: Prisma generation and migration deployment complete, followed by a successful Next.js production build.

- [ ] **Step 4: Review the final diff and configuration compatibility**

Run:

```bash
git diff --check
git status --short
git diff --stat HEAD~4..HEAD
```

Expected: no whitespace errors; only the planned source/tests are changed; no environment files, generated Prisma client, or unrelated user files are included.

- [ ] **Step 5: Record verification fixes if needed**

If verification required source changes, stage only the affected planned files and commit them:

```bash
git add lib/types.ts lib/scratch-rsvp.ts components/curtain-canva/ScratchDateReveal.tsx components/shared/RichExternalLinkPage.tsx components/shared/RevealableExternalSections.tsx app/admin/invitations/ExternalInvitationForm.tsx tests/scratch-rsvp.test.ts tests/scratch-rsvp-ui-wiring.test.ts
git commit -m "fix: resolve post-scratch RSVP verification issues"
```

If no fixes were required, do not create an empty commit.
