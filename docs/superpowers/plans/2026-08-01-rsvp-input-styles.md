# RSVP Input Styles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-invitation RSVP input styles (`default`, `minimal`, and `soft`) and make the selected style consistent in the invitation modal, dedicated confirmation page, and admin editors.

**Architecture:** Keep the setting in the existing `Invitation.rsvp` JSON as optional `inputStyle`. Add a pure resolver in `lib/rsvp-input-styles.ts` that produces the shared input class/style decisions, then feed those decisions into both RSVP renderers and custom-field controls. Add one reusable admin selector used by the standard and external invitation forms; missing or invalid values resolve to `default`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4 utility classes, inline CSS variables/styles for invitation colors, Vitest, Prisma JSON fields.

## Global Constraints

- Existing invitations with no `rsvp.inputStyle` must keep the current `default` appearance.
- The supported styles are exactly `default`, `minimal`, and `soft`; malformed values fall back to `default`.
- The setting is per invitation, not per theme, and is stored at `rsvp.inputStyle`.
- Both `components/shared/RSVPForm.tsx` and `app/[locale]/confirmar/[slug]/RsvpPage.tsx` must use the same style contract.
- Apply the selected style to native inputs, textarea, select, attendance choices, switches, and custom RSVP fields.
- Preserve existing RSVP color overrides and validation behavior.
- Keep keyboard focus visible and use exact transition properties; do not add `transition: all`.
- Tests run in Vitest's Node environment; do not add DOM-dependent tests.
- If a build is run, use `npm run build`, never `next build` directly.

---

### Task 1: Add the typed RSVP style resolver

**Files:**
- Create: `lib/rsvp-input-styles.ts`
- Modify: `lib/types.ts:InvitationData.rsvp`
- Modify: `lib/rsvp-config.ts:RsvpConfigWithEmail`
- Create: `tests/rsvp-input-styles.test.ts`

**Interfaces:**
- Consumes: `RsvpInputColors` from `lib/rsvp-input-colors.ts`, an optional unknown persisted style, and the accent color used for focus/selection.
- Produces: `RsvpInputStyle`, `RsvpInputStyleConfig`, `resolveRsvpInputStyle(style, colors, accentColor, hasCustomBackground)` for both RSVP renderers.

- [ ] **Step 1: Write the failing resolver tests**

Create tests that assert the public resolver contract without rendering React:

```ts
import { describe, expect, it } from "vitest";
import {
  resolveRsvpInputStyle,
  type RsvpInputStyle,
} from "@/lib/rsvp-input-styles";

const colors = {
  backgroundColor: "#f8f8f7",
  textColor: "#323232",
  placeholderColor: "#a0a0a0",
  borderColor: "#e5e5e3",
};

describe("resolveRsvpInputStyle", () => {
  it.each<[RsvpInputStyle, string]>([
    ["default", "rounded-lg"],
    ["minimal", "border-b-2"],
    ["soft", "shadow-[0_2px_10px_rgba(0,0,0,0.06)]"],
  ])("returns the %s treatment", (style, marker) => {
    expect(resolveRsvpInputStyle(style, colors, "#be8c7a").inputClassName).toContain(marker);
  });

  it("falls back to default for missing or malformed persisted values", () => {
    expect(resolveRsvpInputStyle(undefined, colors, "#be8c7a")).toEqual(
      resolveRsvpInputStyle("default", colors, "#be8c7a"),
    );
    expect(resolveRsvpInputStyle("unknown", colors, "#be8c7a")).toEqual(
      resolveRsvpInputStyle("default", colors, "#be8c7a"),
    );
  });

  it("preserves custom colors while keeping minimal fields transparent by default", () => {
    const result = resolveRsvpInputStyle(
      "minimal",
      { ...colors, backgroundColor: "#fff3e8", borderColor: "#c98b2e" },
      "#c98b2e",
    );

    expect(result.inputStyle.color).toBe("#323232");
    expect(result.inputStyle.borderColor).toBe("#c98b2e");
    expect(result.inputStyle.backgroundColor).toBe("transparent");
    expect(result.focusStyle["--tw-ring-color"]).toContain("#c98b2e");
  });

  it("uses an explicit custom background for minimal fields", () => {
    expect(
      resolveRsvpInputStyle("minimal", colors, "#be8c7a", true).inputStyle
        .backgroundColor,
    ).toBe("#f8f8f7");
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails for the missing resolver**

Run: `npx vitest run tests/rsvp-input-styles.test.ts`

Expected: FAIL because `@/lib/rsvp-input-styles` does not exist yet.

- [ ] **Step 3: Add the style types and minimal resolver implementation**

Define:

```ts
export type RsvpInputStyle = "default" | "minimal" | "soft";

export interface RsvpInputStyleConfig {
  inputClassName: string;
  inputStyle: CSSProperties;
  focusStyle: CSSProperties;
  choiceClassName: string;
  choiceStyle: (selected: boolean) => CSSProperties;
  switchClassName: string;
  switchStyle: CSSProperties;
}

export function resolveRsvpInputStyle(
  value: unknown,
  colors: RsvpInputColors,
  accentColor: string,
  hasCustomBackground = false,
): RsvpInputStyleConfig;
```

Use `default` for invalid values. Keep the default class/style equivalent to the current modal input treatment. Make `minimal` transparent unless an explicit RSVP background override exists, keep a visible bottom border, and remove the full focus ring. Make `soft` borderless with a subtle layered shadow and a larger radius. Set `--tw-ring-color` through a typed custom-property style object so focus uses the invitation accent.

- [ ] **Step 4: Extend the RSVP config types**

Add `inputStyle?: RsvpInputStyle` to both `InvitationData.rsvp` and `RsvpConfigWithEmail`. Do not make it required so legacy JSON remains type-safe.

- [ ] **Step 5: Run the focused tests and refactor only after green**

Run: `npx vitest run tests/rsvp-input-styles.test.ts`

Expected: all resolver tests PASS. Keep the resolver free of runtime database or browser dependencies.

- [ ] **Step 6: Commit the resolver unit**

```bash
git add lib/rsvp-input-styles.ts lib/types.ts lib/rsvp-config.ts tests/rsvp-input-styles.test.ts
git commit -m "feat: add RSVP input style resolver"
```

### Task 2: Add the reusable admin style selector and persist defaults

**Files:**
- Create: `components/admin/RsvpInputStyleField.tsx`
- Modify: `app/admin/invitations/InvitationForm.tsx:default RSVP state, imports, RSVP settings`
- Modify: `app/admin/invitations/ExternalInvitationForm.tsx:default RSVP state, imports, RSVP settings`
- Modify: `app/admin/invitations/new/page.tsx:default RSVP state`
- Modify: `app/admin/invitations/new-external/page.tsx:default RSVP state if it owns a separate initial object`

**Interfaces:**
- Consumes: `InvitationData["rsvp"]` and `RsvpInputStyle`.
- Produces: a controlled admin field with `value: RsvpInputStyle | undefined` and `onChange(style: RsvpInputStyle)`.

- [ ] **Step 1: Add a small pure option table alongside the selector**

Use the exact Portuguese labels and descriptions from the approved design:

```ts
const RSVP_INPUT_STYLE_OPTIONS = [
  { value: "default", label: "Padrão", description: "Borda e fundo" },
  { value: "minimal", label: "Minimalista", description: "Apenas linha inferior" },
  { value: "soft", label: "Suave", description: "Fundo leve e sombra discreta" },
] as const;
```

Render a labeled native `select` or the project’s existing select primitives as a controlled field. Include helper text that the choice affects the RSVP form.

- [ ] **Step 2: Initialize new invitation RSVP state with `inputStyle: "default"`**

Add the property to the standard and external invitation default objects. Keep all existing RSVP defaults unchanged.

- [ ] **Step 3: Render the selector in both admin RSVP settings sections**

Place `RsvpInputStyleField` beside the existing `RsvpInputColorFields` in:

- the RSVP block in `app/admin/invitations/InvitationForm.tsx`;
- the RSVP block in `app/admin/invitations/ExternalInvitationForm.tsx`.

Wire it through the existing `updateRsvp` callback. If the callback’s current union excludes the new value, widen it to `boolean | string | RsvpCustomField[]` or use a generic RSVP field update type without changing the payload shape.

- [ ] **Step 4: Verify the admin form preserves the value on edit and save**

Run: `npx vitest run tests/invitation-admin-initial-data.test.ts tests/invitation-create-data.test.ts`

Expected: PASS, confirming nested RSVP JSON remains preserved by the existing admin mapper/create payload logic. Manually inspect the diff to ensure `inputStyle` is not dropped from either default state or update callback.

- [ ] **Step 5: Commit the admin control**

```bash
git add components/admin/RsvpInputStyleField.tsx app/admin/invitations/InvitationForm.tsx app/admin/invitations/ExternalInvitationForm.tsx app/admin/invitations/new/page.tsx app/admin/invitations/new-external/page.tsx
git commit -m "feat: add RSVP input style setting"
```

### Task 3: Apply styles to the invitation RSVP modal and custom fields

**Files:**
- Modify: `components/shared/RSVPForm.tsx:input style resolution and all RSVP field controls`
- Modify: `components/shared/RSVPCustomFields.tsx:custom field control styling`

**Interfaces:**
- Consumes: `resolveRsvpInputStyle` from Task 1, existing `resolveRsvpInputColors`, `rsvp.inputStyle`, and `theme.accent`.
- Produces: the same form behavior as today with style-specific classes and CSS values for standard/custom controls.

- [ ] **Step 1: Add the failing behavior assertion to the resolver test for choice and switch styles**

Extend `tests/rsvp-input-styles.test.ts` with assertions that selected choices use the accent border/background and that the returned switch class/style does not hard-code the default rounded bordered treatment for `minimal`.

- [ ] **Step 2: Run the focused resolver test and confirm the new assertion fails**

Run: `npx vitest run tests/rsvp-input-styles.test.ts`

Expected: FAIL on the new choice/switch assertion before changing the resolver.

- [ ] **Step 3: Update the resolver’s choice and switch decisions**

Return style data for attendance/custom radio labels and the custom switch container. For `minimal`, use a bottom rule and transparent surface; for `soft`, use the borderless soft surface; for `default`, preserve the existing rounded border. Keep selected state driven by the existing accent color.

- [ ] **Step 4: Resolve the selected RSVP style inside `RSVPForm`**

After resolving colors, call:

```ts
const rsvpInputStyle = resolveRsvpInputStyle(
  isIntegration(props) ? props.invitation.rsvp.inputStyle : undefined,
  rsvpInputColors,
  p.accent,
  Boolean(
    isIntegration(props) &&
      props.invitation.rsvp.inputBackgroundColor?.trim(),
  ),
);
```

Use its `inputClassName`, `inputStyle`, and `focusStyle` for name, companion, email, dietary, numeric, message, select, and custom text fields. Merge the existing guest read-only opacity class without changing validation or registration.

- [ ] **Step 5: Apply the same returned style to attendance choices and custom-field radio/switch controls**

Replace the duplicated RSVP attendance label style with `rsvpInputStyle.choiceClassName` and `choiceStyle(selected)`. Extend `RSVPCustomFields` props with the choice/switch class/style values it needs, keeping its public behavior and field visibility unchanged.

- [ ] **Step 6: Run the resolver tests and the existing custom-field tests**

Run: `npx vitest run tests/rsvp-input-styles.test.ts tests/rsvp-custom-fields.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the modal integration**

```bash
git add components/shared/RSVPForm.tsx components/shared/RSVPCustomFields.tsx lib/rsvp-input-styles.ts tests/rsvp-input-styles.test.ts
git commit -m "feat: apply RSVP input styles to modal form"
```

### Task 4: Apply styles to the dedicated confirmation page

**Files:**
- Modify: `app/[locale]/confirmar/[slug]/page.tsx:pass rsvp.inputStyle`
- Modify: `app/[locale]/confirmar/[slug]/RsvpPage.tsx:input style resolution and all RSVP field controls`

**Interfaces:**
- Consumes: `RsvpInputStyle` through the page prop, `resolveRsvpInputStyle` from Task 1, and the existing fixed palette.
- Produces: the dedicated confirmation form visually matching the selected invitation style while retaining its current page palette, header, deadline, and submission behavior.

- [ ] **Step 1: Add the style prop to `RsvpPageProps` and pass it from the server page**

Add `inputStyle?: RsvpInputStyle` to `RsvpPageProps` and pass `rsvp.inputStyle` from `app/[locale]/confirmar/[slug]/page.tsx`. Keep `inputColors={rsvp}` unchanged so custom colors continue to flow through the existing config type.

- [ ] **Step 2: Resolve the style using the dedicated page accent**

Call the shared resolver with `inputStyle`, `rsvpInputColors`, `palette.accent`, and whether `inputColors.inputBackgroundColor` is explicitly set. Replace the page’s hard-coded `inputBase` and `inputStyle` values with the resolver output.

- [ ] **Step 3: Apply the shared choice/switch styling to attendance and custom fields**

Use the same `choiceClassName`, `choiceStyle`, and custom-field style props as the modal. Keep the page’s fixed font, CTA, card, and background image behavior unchanged.

- [ ] **Step 4: Run focused route/config tests and lint**

Run: `npx vitest run tests/rsvp-input-styles.test.ts tests/rsvp-custom-fields.test.ts tests/rsvp-closed-route.test.ts && npm run lint`

Expected: all selected tests PASS and ESLint exits with code 0. If lint identifies pre-existing unrelated findings, record them separately and do not broaden this feature.

- [ ] **Step 5: Commit the dedicated-page integration**

```bash
git add 'app/[locale]/confirmar/[slug]/page.tsx' 'app/[locale]/confirmar/[slug]/RsvpPage.tsx'
git commit -m "feat: apply RSVP input styles to confirmation page"
```

### Task 5: Verify the complete feature and inspect the final diff

**Files:**
- Modify: none unless verification exposes a feature regression.
- Test: `tests/rsvp-input-styles.test.ts` and the existing RSVP/config test files.

**Interfaces:**
- Consumes: the completed resolver, admin setting, modal integration, and dedicated-page integration.
- Produces: fresh evidence that legacy fallback, style resolution, persistence plumbing, and the existing RSVP suite remain valid.

- [ ] **Step 1: Run all RSVP-related unit tests**

Run:

```bash
npx vitest run tests/rsvp-input-styles.test.ts tests/rsvp-input-colors.test.ts tests/rsvp-custom-fields.test.ts tests/rsvp-config-closed.test.ts tests/rsvp-closed-route.test.ts tests/rsvp-adults-children-headcount.test.ts tests/rsvp-companion-headcount.test.ts tests/admin-rsvp-defaults.test.ts
```

Expected: all listed tests PASS.

- [ ] **Step 2: Run the complete project test suite**

Run: `npm test`

Expected: Vitest exits with code 0 and reports no failed tests.

- [ ] **Step 3: Run lint and the production build**

Run: `npm run lint && npm run build`

Expected: both commands exit with code 0. `npm run build` is required so Prisma generation and the Next.js compilation use the project’s supported command.

- [ ] **Step 4: Inspect the final diff and working tree**

Run: `git diff 91a6221..HEAD --stat && git status --short`

Confirm the diff contains only the RSVP style feature and that no environment files, generated Prisma output, or unrelated user changes were added.

- [ ] **Step 5: Commit any verification-only corrections if required**

If verification requires a correction, rerun the relevant failing command and commit only the explicitly named feature files; never stage environment files, generated Prisma output, or unrelated user changes:

```bash
git add lib/rsvp-input-styles.ts tests/rsvp-input-styles.test.ts
git commit -m "fix: complete RSVP input style verification"
```
