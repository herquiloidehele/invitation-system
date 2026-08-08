# Hero Video Default Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let administrators choose whether `Invitation.videoUrl` starts muted while preserving muted playback for every existing and new invitation by default.

**Architecture:** Persist one `heroVideoMuted` boolean on `Invitation`, expose it as an optional `InvitationData` field, and resolve missing values to `true` through one pure helper. A small reusable admin field updates the setting in every form context, while each hero renderer binds the resolved value to its actual or prefetched video element.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7/Postgres, Vitest, shadcn/ui.

## Global Constraints

- Existing and newly created invitations remain muted unless an administrator explicitly disables muting.
- The setting controls only `Invitation.videoUrl`; it must not alter `curtainVideoUrl` or `coverVideos`.
- The admin label is `Vídeo sem som`.
- Missing serialized values resolve to muted for backward compatibility.
- Do not silently force an administrator's unmuted choice back to muted after an autoplay rejection.
- Use `npm run build`, never `next build` directly.

---

## File Structure

- Create `prisma/migrations/20260808120000_add_hero_video_muted/migration.sql`: add the non-null database column with a true default.
- Create `lib/hero-video-audio.ts`: own the backward-compatible mute resolver.
- Create `components/admin/HeroVideoMutedField.tsx`: render the shared Portuguese admin switch and help text.
- Create `tests/hero-video-audio.test.ts`: test the resolver and renderer/form wiring without requiring a DOM environment.
- Modify `prisma/schema.prisma`, `lib/types.ts`: define the persisted and application contracts.
- Modify `lib/invitation-create-data.ts`, `lib/invitation-admin-initial-data.ts`, `lib/invitations.ts`, `app/api/admin/invitations/[id]/route.ts`, `prisma/seed.ts`: round-trip the setting.
- Modify `tests/invitation-create-data.test.ts`, `tests/invitation-admin-initial-data.test.ts`, `tests/invitation-duplication.test.ts`, `tests/fixtures/invitation-duplication.ts`: prove persistence and duplication behavior.
- Modify `app/admin/invitations/InvitationForm.tsx`, `app/admin/invitations/ExternalInvitationForm.tsx`, `app/admin/invitations/new/page.tsx`: initialize and expose the setting.
- Modify `components/shared/InvitationHero.tsx`, `components/shared/PrefetchedVideoSlot.tsx`, `components/shared/ExternalVideoPage.tsx`, `app/[locale]/[slug]/InvitationView.tsx`, `components/video-entrance/VideoEntranceHero.tsx`, `components/curtain-canva/CurtainsHero.tsx`, `components/curtain-canva/CurtainHeroVideo.tsx`: apply it to all hero-video paths.

### Task 1: Data Contract and Backward-Compatible Resolver

**Files:**
- Create: `lib/hero-video-audio.ts`
- Create: `tests/hero-video-audio.test.ts`
- Create: `prisma/migrations/20260808120000_add_hero_video_muted/migration.sql`
- Modify: `prisma/schema.prisma`
- Modify: `lib/types.ts`

**Interfaces:**
- Produces: `resolveHeroVideoMuted(value?: boolean | null): boolean`, returning false only for an explicit false.
- Produces: `InvitationData.heroVideoMuted?: boolean`.
- Produces: Prisma `Invitation.heroVideoMuted: boolean` with database default true.

- [ ] **Step 1: Write the failing resolver tests**

```ts
import { describe, expect, it } from "vitest";
import { resolveHeroVideoMuted } from "@/lib/hero-video-audio";

describe("resolveHeroVideoMuted", () => {
  it("keeps missing legacy values muted", () => {
    expect(resolveHeroVideoMuted()).toBe(true);
    expect(resolveHeroVideoMuted(null)).toBe(true);
  });

  it("preserves an explicit administrator choice", () => {
    expect(resolveHeroVideoMuted(true)).toBe(true);
    expect(resolveHeroVideoMuted(false)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run: `npx vitest run tests/hero-video-audio.test.ts`

Expected: FAIL because `@/lib/hero-video-audio` does not exist.

- [ ] **Step 3: Implement the resolver**

```ts
export function resolveHeroVideoMuted(value?: boolean | null): boolean {
  return value !== false;
}
```

- [ ] **Step 4: Add the TypeScript and Prisma fields**

Add beside `videoPoster` in `InvitationData`:

```ts
/** Whether the hero video starts muted. Missing values default to true. */
heroVideoMuted?: boolean;
```

Add beside `videoPoster` in `prisma/schema.prisma`:

```prisma
heroVideoMuted Boolean @default(true) // Whether videoUrl starts muted.
```

Create the migration with:

```sql
ALTER TABLE "Invitation"
ADD COLUMN "heroVideoMuted" BOOLEAN NOT NULL DEFAULT true;
```

- [ ] **Step 5: Regenerate Prisma and verify the focused test passes**

Run: `npm run db:generate`

Run: `npx vitest run tests/hero-video-audio.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the contract**

```bash
git add prisma/schema.prisma prisma/migrations/20260808120000_add_hero_video_muted/migration.sql lib/types.ts lib/hero-video-audio.ts tests/hero-video-audio.test.ts
git commit -m "feat: add hero video muted setting"
```

### Task 2: Persistence, Hydration, and Duplication

**Files:**
- Modify: `tests/invitation-create-data.test.ts`
- Modify: `tests/invitation-admin-initial-data.test.ts`
- Modify: `tests/invitation-duplication.test.ts`
- Modify: `tests/fixtures/invitation-duplication.ts`
- Modify: `lib/invitation-create-data.ts`
- Modify: `lib/invitation-admin-initial-data.ts`
- Modify: `lib/invitations.ts`
- Modify: `app/api/admin/invitations/[id]/route.ts`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `InvitationData.heroVideoMuted?: boolean`.
- Produces: create/update data that stores explicit false and defaults missing values to true.
- Produces: admin and public invitation mappers that expose the stored boolean.

- [ ] **Step 1: Add failing persistence tests**

In `tests/invitation-create-data.test.ts`, extend the complete-contract test:

```ts
const body = duplicateForm({
  // existing overrides
  heroVideoMuted: false,
});
expect(data.heroVideoMuted).toBe(false);
```

Extend the defaults test:

```ts
const body = duplicateForm({ heroVideoMuted: undefined });
expect(data.heroVideoMuted).toBe(true);
```

In the admin hydration fixture add `heroVideoMuted: true`, then add:

```ts
describe("toAdminInvitationInitialData — hero video audio", () => {
  it("hydrates an explicit unmuted setting", () => {
    const result = toAdminInvitationInitialData({
      ...baseRow,
      heroVideoMuted: false,
    });
    expect(result.heroVideoMuted).toBe(false);
  });
});
```

In `tests/fixtures/invitation-duplication.ts`, set `heroVideoMuted: false`. Add `"heroVideoMuted"` to `copiedKeys` and assert:

```ts
expect(result.heroVideoMuted).toBe(false);
```

In `tests/hero-video-audio.test.ts`, add `import { readFileSync } from "node:fs";` and prove the public mapper is wired without importing the database module:

```ts
it("maps the stored preference into public invitation data", () => {
  const invitations = readFileSync("lib/invitations.ts", "utf8");
  expect(invitations).toContain("heroVideoMuted: row.heroVideoMuted");
});
```

- [ ] **Step 2: Run the persistence tests and verify they fail for the missing mapping**

Run: `npx vitest run tests/hero-video-audio.test.ts tests/invitation-create-data.test.ts tests/invitation-admin-initial-data.test.ts tests/invitation-duplication.test.ts`

Expected: FAIL because the field is not yet mapped.

- [ ] **Step 3: Map create, admin hydration, and public reads**

In `buildInvitationCreateData` add:

```ts
heroVideoMuted: body.heroVideoMuted !== false,
```

Add `heroVideoMuted: boolean` to both row types and add this property to both mapper returns:

```ts
heroVideoMuted: row.heroVideoMuted,
```

- [ ] **Step 4: Map partial updates and seed operations**

In the update route add:

```ts
...(typeof body.heroVideoMuted === "boolean" && {
  heroVideoMuted: body.heroVideoMuted,
}),
```

In both seed create/update data blocks add:

```ts
heroVideoMuted: data.heroVideoMuted !== false,
```

- [ ] **Step 5: Run persistence tests and the Prisma type check**

Run: `npx vitest run tests/hero-video-audio.test.ts tests/invitation-create-data.test.ts tests/invitation-admin-initial-data.test.ts tests/invitation-duplication.test.ts`

Run: `npx tsc --noEmit`

Expected: all commands PASS.

- [ ] **Step 6: Commit persistence wiring**

```bash
git add lib/invitation-create-data.ts lib/invitation-admin-initial-data.ts lib/invitations.ts 'app/api/admin/invitations/[id]/route.ts' prisma/seed.ts tests/hero-video-audio.test.ts tests/invitation-create-data.test.ts tests/invitation-admin-initial-data.test.ts tests/invitation-duplication.test.ts tests/fixtures/invitation-duplication.ts
git commit -m "feat: persist hero video audio preference"
```

### Task 3: Reusable Admin Switch and Form Wiring

**Files:**
- Create: `components/admin/HeroVideoMutedField.tsx`
- Modify: `tests/hero-video-audio.test.ts`
- Modify: `app/admin/invitations/InvitationForm.tsx`
- Modify: `app/admin/invitations/ExternalInvitationForm.tsx`
- Modify: `app/admin/invitations/new/page.tsx`

**Interfaces:**
- Consumes: `id: string`, `value?: boolean`, `onChange(value: boolean): void`.
- Produces: a checked-by-default `HeroVideoMutedField` reusable beside every hero uploader.

- [ ] **Step 1: Add a failing admin wiring test**

Append a source-wiring test to `tests/hero-video-audio.test.ts`:

```ts
it("offers the shared muted-by-default field in both invitation forms", () => {
  const field = readFileSync("components/admin/HeroVideoMutedField.tsx", "utf8");
  const standard = readFileSync("app/admin/invitations/InvitationForm.tsx", "utf8");
  const external = readFileSync("app/admin/invitations/ExternalInvitationForm.tsx", "utf8");

  expect(field).toContain("Vídeo sem som");
  expect(field).toContain("checked={value !== false}");
  expect(field).toContain("onCheckedChange={onChange}");
  expect(standard).toContain("<HeroVideoMutedField");
  expect(external).toContain("<HeroVideoMutedField");
  expect(standard).toContain('update("heroVideoMuted", value)');
  expect(external).toContain('update("heroVideoMuted", value)');
});
```

- [ ] **Step 2: Run the test and verify the missing component failure**

Run: `npx vitest run tests/hero-video-audio.test.ts`

Expected: FAIL because `HeroVideoMutedField.tsx` does not exist.

- [ ] **Step 3: Create the shared field**

Implement a client component using the existing `Label` and `Switch` components:

```tsx
"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function HeroVideoMutedField({
  id,
  value,
  onChange,
}: {
  id: string;
  value?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-3">
      <div className="space-y-0.5">
        <Label htmlFor={id}>Vídeo sem som</Label>
        <p className="text-xs text-muted-foreground">
          Desative para iniciar o vídeo com som quando o navegador permitir.
        </p>
      </div>
      <Switch
        id={id}
        checked={value !== false}
        onCheckedChange={onChange}
      />
    </div>
  );
}
```

- [ ] **Step 4: Initialize and render the field**

Set `heroVideoMuted: true` in the default form objects in `InvitationForm.tsx`, `ExternalInvitationForm.tsx`, and `new/page.tsx`.

Import and render the field after every `videoUrl` `MediaUpload` context:

```tsx
<HeroVideoMutedField
  id="standardHeroVideoMuted"
  value={form.heroVideoMuted}
  onChange={(value) => update("heroVideoMuted", value)}
/>
```

Do not place it beside curtain-video or cover-video uploaders.

- [ ] **Step 5: Run the focused test and type check**

Run: `npx vitest run tests/hero-video-audio.test.ts`

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Commit the admin setting**

```bash
git add components/admin/HeroVideoMutedField.tsx app/admin/invitations/InvitationForm.tsx app/admin/invitations/ExternalInvitationForm.tsx app/admin/invitations/new/page.tsx tests/hero-video-audio.test.ts
git commit -m "feat: add hero video mute admin control"
```

### Task 4: Apply the Setting to Every Hero Renderer

**Files:**
- Modify: `tests/hero-video-audio.test.ts`
- Modify: `components/shared/InvitationHero.tsx`
- Modify: `components/shared/PrefetchedVideoSlot.tsx`
- Modify: `components/shared/ExternalVideoPage.tsx`
- Modify: `app/[locale]/[slug]/InvitationView.tsx`
- Modify: `components/video-entrance/VideoEntranceHero.tsx`
- Modify: `components/curtain-canva/CurtainsHero.tsx`
- Modify: `components/curtain-canva/CurtainHeroVideo.tsx`

**Interfaces:**
- Consumes: `resolveHeroVideoMuted(invitation.heroVideoMuted)`.
- Produces: matching `HTMLVideoElement.muted` state across direct, entrance, curtain-background, external, and prefetched hero video paths.

- [ ] **Step 1: Add a failing renderer wiring test**

Append:

```ts
it("applies the resolved preference to every hero video path", () => {
  const paths = [
    "components/shared/InvitationHero.tsx",
    "app/[locale]/[slug]/InvitationView.tsx",
    "components/video-entrance/VideoEntranceHero.tsx",
    "components/curtain-canva/CurtainsHero.tsx",
  ];
  for (const path of paths) {
    expect(readFileSync(path, "utf8")).toContain("resolveHeroVideoMuted(");
  }

  const prefetched = readFileSync("components/shared/PrefetchedVideoSlot.tsx", "utf8");
  const curtainVideo = readFileSync("components/curtain-canva/CurtainHeroVideo.tsx", "utf8");
  const externalVideo = readFileSync("components/shared/ExternalVideoPage.tsx", "utf8");
  expect(prefetched).toContain("video.muted = muted");
  expect(curtainVideo).toContain("muted={muted}");
  expect(externalVideo).not.toContain("v.muted = true");
});
```

- [ ] **Step 2: Run the test and verify hard-coded mute wiring fails**

Run: `npx vitest run tests/hero-video-audio.test.ts`

Expected: FAIL because renderers still hard-code `muted` and the external player still forces a retry as muted.

- [ ] **Step 3: Wire standard and prefetched videos**

In `InvitationHero`, resolve once:

```ts
const heroVideoMuted = resolveHeroVideoMuted(invitation.heroVideoMuted);
```

Use `muted={heroVideoMuted}` on the direct `<video>` and pass `muted={heroVideoMuted}` to `PrefetchedVideoSlot`.

Add a required `muted: boolean` prop to `PrefetchedVideoSlot`; set `video.muted = muted` before calling `play()` and include `muted` in the effect dependencies.

In `InvitationView`, change the persistent prefetch element to:

```tsx
muted={resolveHeroVideoMuted(invitation.heroVideoMuted)}
```

- [ ] **Step 4: Wire entrance and curtain hero videos**

In `VideoEntranceHero`, resolve from its existing `invitation` prop and use:

```tsx
muted={resolveHeroVideoMuted(invitation.heroVideoMuted)}
```

In `CurtainsHero`, pass this only to the hero background:

```tsx
<CurtainHeroVideo
  // existing props
  muted={resolveHeroVideoMuted(invitation.heroVideoMuted)}
/>
```

Add `muted?: boolean` to `CurtainHeroVideoProps`, default it to true, and bind `muted={muted}` to its `<video>`. Keep the separate curtain animation's hard-coded `muted` attribute unchanged.

- [ ] **Step 5: Remove the unrequested fallback override**

In `ExternalVideoPage.play()`, replace:

```ts
v.play().catch(() => {
  v.muted = true;
  v.play().catch(() => {});
});
```

with:

```ts
v.play().catch(() => {});
```

This preserves an explicit unmuted choice rather than silently muting after rejection.

- [ ] **Step 6: Run focused and related video tests**

Run: `npx vitest run tests/hero-video-audio.test.ts tests/video-poster-rendering.test.ts tests/curtain-hero-video.test.ts tests/video-entrance.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit renderer behavior**

```bash
git add tests/hero-video-audio.test.ts components/shared/InvitationHero.tsx components/shared/PrefetchedVideoSlot.tsx components/shared/ExternalVideoPage.tsx 'app/[locale]/[slug]/InvitationView.tsx' components/video-entrance/VideoEntranceHero.tsx components/curtain-canva/CurtainsHero.tsx components/curtain-canva/CurtainHeroVideo.tsx
git commit -m "feat: honor hero video audio preference"
```

### Task 5: Full Verification

**Files:**
- Verify only; modify implementation or tests only if a command exposes a defect.

**Interfaces:**
- Consumes: the complete feature from Tasks 1–4.
- Produces: verified migration, generated Prisma contract, lint-clean UI, and production build.

- [ ] **Step 1: Check migration and generated-client consistency**

Run: `npm run db:generate`

Run: `git diff --check`

Expected: both commands succeed with no whitespace errors.

- [ ] **Step 2: Run the full test suite**

Run: `npm test`

Expected: all Vitest tests PASS.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: ESLint exits successfully.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: Prisma generation and migration deployment complete, then Next.js builds successfully.

- [ ] **Step 5: Review the final diff against the design**

Run: `git status --short`

Run: `git diff --stat HEAD~4..HEAD`

Confirm that only `videoUrl` renderers consume `heroVideoMuted`, the curtain animation remains hard-coded muted, all admin defaults are true, and no environment files are staged.
