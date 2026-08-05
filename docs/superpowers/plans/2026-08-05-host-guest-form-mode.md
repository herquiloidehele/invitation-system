# Host Guest Form Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an administrator choose a complete or minimal guest form for the host, with complete as the backward-compatible default and all admin guest forms remaining complete.

**Architecture:** Store `ownerGuestFormMode` as a non-null string on `Invitation`, normalize it at every untyped boundary through one pure helper, and pass the resulting union type from the owner page into the shared guest editor. `GuestForm` will conditionally render complete-only field groups while keeping their form values registered in React Hook Form state so edits preserve hidden admin-entered data.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7/Postgres, React Hook Form, shadcn/ui, Vitest, ESLint.

## Global Constraints

- Supported stored values are exactly `complete` and `minimal`.
- Missing or unrecognized values normalize to `complete`.
- Existing and newly created invitations default to `complete`.
- Minimal mode shows the host only required **Nome** and optional **Mesa**.
- Administrators always see the complete guest form.
- Editing in minimal mode preserves values in hidden fields.
- Do not introduce per-field visibility settings or change the guest-list display.
- Run builds with `npm run build`, never `next build` directly.

---

## File Structure

- Create `lib/owner-guest-form-mode.ts`: union type, runtime normalizer, and admin select options.
- Create `tests/owner-guest-form-mode.test.ts`: pure mode/default tests.
- Modify `prisma/schema.prisma` and create `prisma/migrations/20260805210000_add_owner_guest_form_mode/migration.sql`: persistent invitation setting.
- Modify `lib/types.ts`, `lib/invitation-create-data.ts`, `lib/invitation-admin-initial-data.ts`, `lib/invitations.ts`, and `app/api/admin/invitations/[id]/route.ts`: carry the setting across create, edit, and read boundaries.
- Modify `tests/invitation-create-data.test.ts`, `tests/invitation-admin-initial-data.test.ts`, `tests/fixtures/invitation-duplication.ts`, and `tests/invitation-duplication.test.ts`: persistence and duplication regression coverage.
- Modify `components/admin/GuestForm.tsx`, `components/admin/GuestListEditor.tsx`, and `tests/guest-form-payload.test.ts`: minimal rendering and hidden-value preservation.
- Modify `app/[locale]/confirmacoes/[token]/page.tsx` and `app/[locale]/confirmacoes/[token]/GuestsTabClient.tsx`: pass the saved mode only to the host form.
- Modify `app/admin/invitations/InvitationForm.tsx` and `app/admin/invitations/ExternalInvitationForm.tsx`: expose the two admin choices and set new-form defaults.

---

### Task 1: Define the Mode Contract

**Files:**
- Create: `tests/owner-guest-form-mode.test.ts`
- Create: `lib/owner-guest-form-mode.ts`

**Interfaces:**
- Produces: `type OwnerGuestFormMode = "complete" | "minimal"`.
- Produces: `normalizeOwnerGuestFormMode(value: unknown): OwnerGuestFormMode`.
- Produces: `OWNER_GUEST_FORM_MODE_OPTIONS`, the Portuguese labels used by both admin editors.

- [ ] **Step 1: Write the failing normalization test**

```ts
import { describe, expect, it } from "vitest";
import {
  normalizeOwnerGuestFormMode,
  OWNER_GUEST_FORM_MODE_OPTIONS,
} from "@/lib/owner-guest-form-mode";

describe("normalizeOwnerGuestFormMode", () => {
  it.each([undefined, null, "", "legacy", 42])(
    "defaults %j to complete",
    (value) => {
      expect(normalizeOwnerGuestFormMode(value)).toBe("complete");
    },
  );

  it.each(["complete", "minimal"] as const)("accepts %s", (value) => {
    expect(normalizeOwnerGuestFormMode(value)).toBe(value);
  });
});

it("provides the two Portuguese admin choices", () => {
  expect(OWNER_GUEST_FORM_MODE_OPTIONS).toEqual([
    { value: "complete", label: "Completo" },
    { value: "minimal", label: "Mínimo" },
  ]);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run tests/owner-guest-form-mode.test.ts`

Expected: FAIL because `@/lib/owner-guest-form-mode` does not exist.

- [ ] **Step 3: Implement the mode contract**

```ts
export type OwnerGuestFormMode = "complete" | "minimal";

export const OWNER_GUEST_FORM_MODE_OPTIONS = [
  { value: "complete", label: "Completo" },
  { value: "minimal", label: "Mínimo" },
] as const satisfies ReadonlyArray<{
  value: OwnerGuestFormMode;
  label: string;
}>;

export function normalizeOwnerGuestFormMode(
  value: unknown,
): OwnerGuestFormMode {
  return value === "minimal" ? "minimal" : "complete";
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npx vitest run tests/owner-guest-form-mode.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the contract**

```bash
git add lib/owner-guest-form-mode.ts tests/owner-guest-form-mode.test.ts
git commit -m "feat: define host guest form modes"
```

---

### Task 2: Persist the Invitation Setting

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260805210000_add_owner_guest_form_mode/migration.sql`
- Modify: `lib/types.ts`
- Modify: `lib/invitation-create-data.ts`
- Modify: `lib/invitation-admin-initial-data.ts`
- Modify: `lib/invitations.ts`
- Modify: `app/api/admin/invitations/[id]/route.ts`
- Modify: `tests/invitation-create-data.test.ts`
- Modify: `tests/invitation-admin-initial-data.test.ts`
- Modify: `tests/fixtures/invitation-duplication.ts`
- Modify: `tests/invitation-duplication.test.ts`

**Interfaces:**
- Consumes: `OwnerGuestFormMode` and `normalizeOwnerGuestFormMode` from Task 1.
- Produces: `InvitationData.ownerGuestFormMode?: OwnerGuestFormMode`.
- Produces: Prisma `Invitation.ownerGuestFormMode: string` with database default `complete`.

- [ ] **Step 1: Add failing persistence assertions**

In `tests/invitation-create-data.test.ts`, submit a minimal mode in the complete-contract test and assert it is stored; in the defaults test, submit an invalid value and assert fallback:

```ts
it("stores a minimal host guest form mode", () => {
  const data = buildInvitationCreateData(
    duplicateForm({ ownerGuestFormMode: "minimal" }),
    "theme_copy",
  );
  expect(data.ownerGuestFormMode).toBe("minimal");
});

it("defaults an invalid host guest form mode to complete", () => {
  const data = buildInvitationCreateData(
    duplicateForm({ ownerGuestFormMode: "invalid" as never }),
    "theme_copy",
  );
  expect(data.ownerGuestFormMode).toBe("complete");
});
```

Add `ownerGuestFormMode: "complete"` to the `baseRow` in `tests/invitation-admin-initial-data.test.ts`, then add:

```ts
describe("toAdminInvitationInitialData — ownerGuestFormMode", () => {
  it("hydrates minimal mode", () => {
    const result = toAdminInvitationInitialData({
      ...baseRow,
      ownerGuestFormMode: "minimal",
    });
    expect(result.ownerGuestFormMode).toBe("minimal");
  });

  it("defaults an unknown value to complete", () => {
    const result = toAdminInvitationInitialData({
      ...baseRow,
      ownerGuestFormMode: "legacy",
    });
    expect(result.ownerGuestFormMode).toBe("complete");
  });
});
```

Add `ownerGuestFormMode: "minimal"` to `sourceInvitationRow` and add `"ownerGuestFormMode"` beside `"ownerCanAddGuests"` in the copied-key assertion in `tests/invitation-duplication.test.ts`.

- [ ] **Step 2: Run persistence tests and verify RED**

Run: `npx vitest run tests/invitation-create-data.test.ts tests/invitation-admin-initial-data.test.ts tests/invitation-duplication.test.ts`

Expected: FAIL because `ownerGuestFormMode` is not mapped or declared.

- [ ] **Step 3: Add the schema column and migration**

Add beside `ownerCanAddGuests` in `prisma/schema.prisma`:

```prisma
ownerGuestFormMode String @default("complete") // "complete" | "minimal"; controls only the host-facing guest form.
```

Create the migration with:

```sql
ALTER TABLE "Invitation"
ADD COLUMN "ownerGuestFormMode" TEXT NOT NULL DEFAULT 'complete';
```

Regenerate the client:

Run: `npm run db:generate`

Expected: Prisma client generation succeeds.

- [ ] **Step 4: Carry the normalized field through application boundaries**

In `lib/types.ts`, import the mode type and add to `InvitationData`:

```ts
/** Controls which fields the host sees when adding or editing guests. */
ownerGuestFormMode?: OwnerGuestFormMode;
```

In `lib/invitation-create-data.ts`, import the normalizer and add:

```ts
ownerGuestFormMode: normalizeOwnerGuestFormMode(body.ownerGuestFormMode),
```

In `lib/invitation-admin-initial-data.ts`, add `ownerGuestFormMode: string` to `AdminInvitationInitialDataRow`, import the normalizer, and map:

```ts
ownerGuestFormMode: normalizeOwnerGuestFormMode(row.ownerGuestFormMode),
```

In `lib/invitations.ts`, add `ownerGuestFormMode: string` to `InvitationWithTheme`, import the normalizer, and map:

```ts
ownerGuestFormMode: normalizeOwnerGuestFormMode(row.ownerGuestFormMode),
```

In the update data object in `app/api/admin/invitations/[id]/route.ts`, import the normalizer and add:

```ts
...(body.ownerGuestFormMode !== undefined && {
  ownerGuestFormMode: normalizeOwnerGuestFormMode(body.ownerGuestFormMode),
}),
```

Keep the fixture and copied-key changes from Step 1 so duplication inherits the host setting through `toAdminInvitationInitialData`.

- [ ] **Step 5: Run persistence tests and verify GREEN**

Run: `npx vitest run tests/owner-guest-form-mode.test.ts tests/invitation-create-data.test.ts tests/invitation-admin-initial-data.test.ts tests/invitation-duplication.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit persistence**

```bash
git add prisma/schema.prisma prisma/migrations/20260805210000_add_owner_guest_form_mode/migration.sql lib/types.ts lib/invitation-create-data.ts lib/invitation-admin-initial-data.ts lib/invitations.ts app/api/admin/invitations/[id]/route.ts tests/invitation-create-data.test.ts tests/invitation-admin-initial-data.test.ts tests/fixtures/invitation-duplication.ts tests/invitation-duplication.test.ts
git commit -m "feat: persist host guest form mode"
```

---

### Task 3: Make the Shared Guest Form Mode-Aware

**Files:**
- Modify: `lib/owner-guest-form-mode.ts`
- Modify: `components/admin/GuestForm.tsx`
- Modify: `components/admin/GuestListEditor.tsx`
- Modify: `tests/owner-guest-form-mode.test.ts`
- Modify: `tests/guest-form-payload.test.ts`

**Interfaces:**
- Consumes: `OwnerGuestFormMode` from Task 1.
- Produces: optional `ownerGuestFormMode?: OwnerGuestFormMode` props on `GuestListEditor` and `GuestForm`, both defaulting to `complete`.
- Produces: `isOwnerGuestFormFieldVisible(mode, field): boolean` for testable render decisions.
- Preserves: `buildGuestUpsertInput(values, options): GuestUpsertInput` without adding mode-dependent payload branches.

- [ ] **Step 1: Add a failing visibility-policy test**

Extend the existing import in `tests/owner-guest-form-mode.test.ts` with `isOwnerGuestFormFieldVisible` and `type OwnerGuestFormField`, then append:

```ts
const fields: OwnerGuestFormField[] = [
  "name",
  "companion",
  "phone",
  "tableLabel",
  "totalGuests",
  "canInviteOthers",
  "note",
  "customExternalLink",
];

it("shows every field in complete mode", () => {
  expect(
    fields.every((field) =>
      isOwnerGuestFormFieldVisible("complete", field),
    ),
  ).toBe(true);
});

it("shows only name and table in minimal mode", () => {
  expect(
    fields.filter((field) =>
      isOwnerGuestFormFieldVisible("minimal", field),
    ),
  ).toEqual(["name", "tableLabel"]);
});
```

- [ ] **Step 2: Run the policy test and verify RED**

Run: `npx vitest run tests/owner-guest-form-mode.test.ts`

Expected: FAIL because `isOwnerGuestFormFieldVisible` is not exported.

- [ ] **Step 3: Implement the visibility policy**

Add to `lib/owner-guest-form-mode.ts`:

```ts
export type OwnerGuestFormField =
  | "name"
  | "companion"
  | "phone"
  | "tableLabel"
  | "totalGuests"
  | "canInviteOthers"
  | "note"
  | "customExternalLink";

export function isOwnerGuestFormFieldVisible(
  mode: OwnerGuestFormMode,
  field: OwnerGuestFormField,
): boolean {
  return mode === "complete" || field === "name" || field === "tableLabel";
}
```

Run: `npx vitest run tests/owner-guest-form-mode.test.ts`

Expected: PASS.

- [ ] **Step 4: Add payload preservation characterization tests**

Append to `tests/guest-form-payload.test.ts`:

```ts
describe("buildGuestUpsertInput — values hidden by minimal mode", () => {
  it("preserves loaded hidden values when editing", () => {
    const input = buildGuestUpsertInput(
      {
        ...clearedValues(),
        companion: "João",
        phoneCountryCode: "+258",
        phoneNumber: "841234567",
        totalGuests: "3",
        canInviteOthers: true,
        note: "Sem glúten",
      },
      { showCustomExternalLink: false },
    );

    expect(input).toMatchObject({
      companion: "João",
      phoneCountryCode: "+258",
      phoneNumber: "841234567",
      totalGuests: 3,
      canInviteOthers: true,
      note: "Sem glúten",
    });
  });

  it("emits safe defaults for a new minimal guest", () => {
    const input = buildGuestUpsertInput(
      {
        name: "Maria",
        companion: "",
        phoneCountryCode: "+258",
        phoneNumber: "",
        tableLabel: "Mesa 4",
        totalGuests: "",
        canInviteOthers: false,
        note: "",
      },
      { showCustomExternalLink: false },
    );

    expect(input).toEqual({
      name: "Maria",
      companion: "",
      phoneCountryCode: "+258",
      phoneNumber: "",
      tableLabel: "Mesa 4",
      totalGuests: null,
      canInviteOthers: false,
      note: "",
    });
  });
});
```

- [ ] **Step 5: Run the payload characterization tests**

Run: `npx vitest run tests/guest-form-payload.test.ts`

Expected: PASS, confirming the existing payload builder already preserves loaded hidden values and emits safe new-guest defaults. Do not change the builder.

- [ ] **Step 6: Add mode props and conditional rendering**

In `GuestListEditorProps`, add:

```ts
ownerGuestFormMode?: OwnerGuestFormMode;
```

Destructure it with this default in `GuestListEditor`:

```ts
ownerGuestFormMode = "complete",
```

Add this prop to the existing `GuestForm` call:

```tsx
ownerGuestFormMode={ownerGuestFormMode}
```

In `GuestFormProps`, add:

```ts
ownerGuestFormMode?: OwnerGuestFormMode;
```

Destructure it with this default in `GuestForm`:

```ts
ownerGuestFormMode = "complete",
```

Import `isOwnerGuestFormFieldVisible`. Leave the **Nome** and **Mesa** JSX blocks unconditional. Wrap each of the other existing blocks with the corresponding exact predicate:

```tsx
isOwnerGuestFormFieldVisible(ownerGuestFormMode, "companion")
isOwnerGuestFormFieldVisible(ownerGuestFormMode, "phone")
isOwnerGuestFormFieldVisible(ownerGuestFormMode, "totalGuests")
isOwnerGuestFormFieldVisible(ownerGuestFormMode, "canInviteOthers")
isOwnerGuestFormFieldVisible(ownerGuestFormMode, "note")
isOwnerGuestFormFieldVisible(ownerGuestFormMode, "customExternalLink")
```

For each predicate use `{predicate && (<existing JSX block>)}`. The external link condition becomes `showCustomExternalLink && isOwnerGuestFormFieldVisible(ownerGuestFormMode, "customExternalLink")`. Do not unregister hidden fields: `reset()` must continue loading the complete guest record so submission preserves hidden values.

- [ ] **Step 7: Verify focused tests and static checks**

Run: `npx vitest run tests/guest-form-payload.test.ts tests/owner-guest-form-mode.test.ts`

Run: `npx eslint components/admin/GuestForm.tsx components/admin/GuestListEditor.tsx components/admin/guest-form-payload.ts`

Expected: both commands PASS.

- [ ] **Step 8: Commit mode-aware form behavior**

```bash
git add lib/owner-guest-form-mode.ts components/admin/GuestForm.tsx components/admin/GuestListEditor.tsx tests/owner-guest-form-mode.test.ts tests/guest-form-payload.test.ts
git commit -m "feat: add minimal host guest form"
```

---

### Task 4: Wire Admin Controls and the Host Page

**Files:**
- Modify: `app/admin/invitations/InvitationForm.tsx`
- Modify: `app/admin/invitations/ExternalInvitationForm.tsx`
- Modify: `app/[locale]/confirmacoes/[token]/page.tsx`
- Modify: `app/[locale]/confirmacoes/[token]/GuestsTabClient.tsx`

**Interfaces:**
- Consumes: `OWNER_GUEST_FORM_MODE_OPTIONS` and `normalizeOwnerGuestFormMode` from Task 1.
- Consumes: `GuestListEditor.ownerGuestFormMode` from Task 3.
- Produces: an admin select in both invitation editors and host-only mode propagation.

- [ ] **Step 1: Add source-wiring regression assertions**

Extend `tests/owner-guest-form-mode.test.ts` with a focused source contract, following the repository's existing persistence-wiring tests:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

it("wires the stored mode only through the owner guest page", () => {
  const page = readFileSync(
    resolve("app/[locale]/confirmacoes/[token]/page.tsx"),
    "utf8",
  );
  const client = readFileSync(
    resolve("app/[locale]/confirmacoes/[token]/GuestsTabClient.tsx"),
    "utf8",
  );

  expect(page).toContain("ownerGuestFormMode={");
  expect(page).toContain("invitation.ownerGuestFormMode");
  expect(client).toContain("ownerGuestFormMode={ownerGuestFormMode}");
});

it.each([
  "app/admin/invitations/InvitationForm.tsx",
  "app/admin/invitations/ExternalInvitationForm.tsx",
])("offers complete and minimal mode in %s", (file) => {
  const source = readFileSync(resolve(file), "utf8");
  expect(source).toContain("OWNER_GUEST_FORM_MODE_OPTIONS");
  expect(source).toContain("ownerGuestFormMode");
});
```

- [ ] **Step 2: Run the wiring test and verify RED**

Run: `npx vitest run tests/owner-guest-form-mode.test.ts`

Expected: FAIL because the page and editor wiring are absent.

- [ ] **Step 3: Pass the normalized mode through the host page**

In `app/[locale]/confirmacoes/[token]/page.tsx`, import the normalizer and pass:

```tsx
ownerGuestFormMode={normalizeOwnerGuestFormMode(
  invitation.ownerGuestFormMode,
)}
```

In `GuestsTabClient.tsx`, add the typed prop, destructure it, and forward it:

```ts
ownerGuestFormMode: OwnerGuestFormMode;
```

```tsx
  <GuestListEditor
  ownerGuestFormMode={ownerGuestFormMode}
/>
```

No admin `GuestListEditor` call should pass this prop; omission deliberately selects the complete default.

- [ ] **Step 4: Add the control to both admin invitation editors**

In both form defaults, add:

```ts
ownerGuestFormMode: "complete",
```

Import `OWNER_GUEST_FORM_MODE_OPTIONS` and `normalizeOwnerGuestFormMode`. Near the existing host-add permission, render:

```tsx
<div className="space-y-1.5">
  <Label htmlFor="owner-guest-form-mode">Formulário do anfitrião</Label>
  <Select
    value={normalizeOwnerGuestFormMode(form.ownerGuestFormMode)}
    onValueChange={(value) =>
      setForm((prev) => ({
        ...prev,
        ownerGuestFormMode: normalizeOwnerGuestFormMode(value),
      }))
    }
  >
    <SelectTrigger id="owner-guest-form-mode">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {OWNER_GUEST_FORM_MODE_OPTIONS.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground">
    Completo mostra todos os campos. Mínimo mostra apenas nome e mesa.
  </p>
</div>
```

Use a unique `id` such as `external-owner-guest-form-mode` in `ExternalInvitationForm.tsx`. Keep the selector within the `guestManagementEnabled` section so it is shown only when guest management is active.

- [ ] **Step 5: Run focused verification and fix only wiring defects**

Run: `npx vitest run tests/owner-guest-form-mode.test.ts tests/invitation-create-data.test.ts tests/invitation-admin-initial-data.test.ts tests/invitation-duplication.test.ts tests/guest-form-payload.test.ts`

Run: `npx eslint app/admin/invitations/InvitationForm.tsx app/admin/invitations/ExternalInvitationForm.tsx app/[locale]/confirmacoes/[token]/page.tsx app/[locale]/confirmacoes/[token]/GuestsTabClient.tsx components/admin/GuestForm.tsx components/admin/GuestListEditor.tsx`

Expected: both commands PASS.

- [ ] **Step 6: Commit the UI and owner wiring**

```bash
git add app/admin/invitations/InvitationForm.tsx app/admin/invitations/ExternalInvitationForm.tsx app/[locale]/confirmacoes/[token]/page.tsx app/[locale]/confirmacoes/[token]/GuestsTabClient.tsx tests/owner-guest-form-mode.test.ts
git commit -m "feat: configure host guest form mode"
```

---

### Task 5: Full Verification

**Files:**
- Verify only; modify a file only to fix a failure caused by Tasks 1–4.

**Interfaces:**
- Consumes: the complete feature from Tasks 1–4.
- Produces: evidence that tests, lint, migrations, Prisma generation, and the production build agree.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: all Vitest tests PASS.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: ESLint exits successfully with no new errors.

- [ ] **Step 3: Run the repository build**

Run: `npm run build`

Expected: Prisma generation and migration deploy succeed, followed by a successful Next.js production build.

- [ ] **Step 4: Review the final diff**

Run: `git diff HEAD~4 --check`

Run: `git status --short`

Expected: no whitespace errors and no unintended or secret files. Generated `lib/generated/prisma/` remains ignored.

- [ ] **Step 5: Commit any verification-only correction**

If verification required a source correction, stage only the affected source and test files and commit:

```bash
git commit -m "fix: complete host guest form mode verification"
```

If no correction was needed, do not create an empty commit.
