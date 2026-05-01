# Social Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a customizable social preview (image + title + description) to every Invitation and every Save the Date, consumed exclusively by `<head>` Open Graph and Twitter Card meta tags.

**Architecture:** A new optional `socialPreview Json?` column on both `Invitation` and `SaveTheDate` tables, holding `{ image?, title?, description? }`. Two pure resolver functions in `lib/social-preview.ts` apply per-subsystem fallback chains. Each public page's `generateMetadata` calls its resolver and emits OG/Twitter tags. Admin forms gain a "Pré-visualização de partilha" section. The shared `sanitizeJsonField()` helper is extracted to `lib/json-sanitize.ts` and applied to all JSON fields on Save the Date admin routes (currently unsanitized).

**Tech Stack:** Next.js 16 App Router, Prisma 7 + PostgreSQL, TypeScript, Vitest, AWS S3 (existing presign flow), shadcn/ui + Tailwind v4. Test command: `npm test`. Migration command: `npm run db:migrate -- --name add_social_preview`.

**Spec:** `docs/superpowers/specs/2026-05-01-social-preview-design.md`

---

## File Structure

**New files:**
- `lib/json-sanitize.ts` — extracted `sanitizeJsonField()` helper used by both subsystems' admin routes.
- `lib/social-preview.ts` — shared `SocialPreview` types are re-exported from `lib/types.ts`; this module exports `DEFAULT_OG_IMAGE_PATH`, `DEFAULT_OG_DESCRIPTION`, `ResolvedSocialPreview` interface, and the two resolver functions.
- `components/admin/SocialPreviewCard.tsx` — pure presentational card mimicking a WhatsApp-style unfurled preview.
- `components/admin/SocialPreviewSection.tsx` — reusable accordion-section block with the three inputs + the preview card; consumed by all three admin forms.
- `prisma/migrations/20260501190000_add_social_preview/migration.sql` — adds `socialPreview` JSONB column to both tables.
- `public/og-default.jpg` — placeholder bundled default image (1200×630). Real asset replaces the placeholder later; no code change needed.
- `tests/social-preview.test.ts` — unit tests for both resolvers.
- `tests/social-preview-metadata.test.ts` — smoke tests for both `generateMetadata` exports.
- `tests/save-the-date-json-sanitize.test.ts` — regression tests for the broader STD sanitization change.

**Modified files:**
- `prisma/schema.prisma` — add `socialPreview Json?` to `Invitation` and `SaveTheDate`.
- `lib/types.ts` — add `SocialPreview` interface; add `socialPreview?: SocialPreview` to `InvitationData`.
- `lib/save-the-date.ts` — add `socialPreview?: SocialPreview` to `SaveTheDateData`; map column in `getSaveTheDate`.
- `lib/invitations.ts` — add `socialPreview` field in `InvitationWithTheme` and `toInvitationData`.
- `app/api/admin/invitations/route.ts` — replace inline `sanitizeJsonField` with import from `lib/json-sanitize`; persist `socialPreview` on POST.
- `app/api/admin/invitations/[id]/route.ts` — same import change; persist `socialPreview` on PUT.
- `app/api/admin/save-the-date/route.ts` — import `sanitizeJsonField`; apply to all JSON fields including new `socialPreview`.
- `app/api/admin/save-the-date/[id]/route.ts` — same.
- `app/[slug]/page.tsx` — replace ad-hoc OG block in `generateMetadata` with resolver output.
- `app/s/[slug]/page.tsx` — extend existing `generateMetadata` with resolver output (adds `openGraph.images` + `twitter`).
- `app/admin/invitations/InvitationForm.tsx` — render `<SocialPreviewSection>` in a new accordion item.
- `app/admin/invitations/ExternalInvitationForm.tsx` — same.
- `app/admin/save-the-dates/SaveTheDateForm.tsx` — add `socialPreview` to `SaveTheDateFormData`; render `<SocialPreviewSection>` as a new AccordionItem after Bottom Hero; include in submit payload.
- `app/admin/invitations/[id]/edit/page.tsx` — load `socialPreview` from row into `initialData`.
- `app/admin/invitations/new/page.tsx` — no change needed (initialData is partial; field is optional).
- `app/admin/save-the-dates/[id]/edit/page.tsx` — load `socialPreview` from row into `initialData`.

---

## Task 1: Extract `sanitizeJsonField` to a shared module

This task is pre-work for the broader STD sanitization change in Task 6. We extract the existing helper used in both invitation routes into a single shared module. The two existing copies have minor signature differences (POST also accepts `null`/`undefined`); the extracted version covers all cases.

**Files:**
- Create: `lib/json-sanitize.ts`
- Modify: `app/api/admin/invitations/route.ts:11-26`
- Modify: `app/api/admin/invitations/[id]/route.ts:11-21`
- Test: (no test in this task — covered by existing invitation API behavior; we'll add tests in Task 6)

- [ ] **Step 1: Create the shared module**

Create `lib/json-sanitize.ts` with:

```ts
import { Prisma } from "@/lib/generated/prisma/client";

/**
 * Reject empty strings for JSON columns — they cause `JSON.parse("")`
 * failures in the pg adapter. Returns `Prisma.JsonNull` for nullable
 * columns when the fallback is null, which satisfies Prisma's type system.
 *
 * - For nullable JSON columns, pass `null` as the fallback.
 * - For non-nullable JSON columns on UPDATE, pass the existing DB value as fallback.
 * - For non-nullable JSON columns on CREATE, pass the default object/array.
 */
export function sanitizeJsonField(
  value: unknown,
  fallback: Prisma.InputJsonValue | null,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return fallback === null
      ? Prisma.JsonNull
      : (fallback as Prisma.InputJsonValue);
  }
  return value as Prisma.InputJsonValue;
}
```

- [ ] **Step 2: Replace inline copy in POST route**

In `app/api/admin/invitations/route.ts`:
- Remove the local `sanitizeJsonField` function (current lines 11–26 including its doc comment) AND remove the `import { Prisma } from "@/lib/generated/prisma/client";` line at line 2 (no longer used here).
- Add a new import line: `import { sanitizeJsonField } from "@/lib/json-sanitize";`

- [ ] **Step 3: Replace inline copy in PUT route**

In `app/api/admin/invitations/[id]/route.ts`:
- Remove the local `sanitizeJsonField` function (current lines 11–21 including its doc comment) AND remove the `import { Prisma } from "@/lib/generated/prisma/client";` line at line 2 (no longer used here).
- Add a new import line: `import { sanitizeJsonField } from "@/lib/json-sanitize";`

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no new errors).

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS (no behavior change).

- [ ] **Step 6: Commit**

```bash
git add lib/json-sanitize.ts app/api/admin/invitations/route.ts app/api/admin/invitations/[id]/route.ts
git commit -m "refactor: extract sanitizeJsonField to lib/json-sanitize"
```

---

## Task 2: Add `SocialPreview` type and migration

**Files:**
- Modify: `lib/types.ts` (add `SocialPreview` interface and field on `InvitationData`)
- Modify: `lib/save-the-date.ts` (add field on `SaveTheDateData`)
- Modify: `prisma/schema.prisma` (add column to two models)
- Create: `prisma/migrations/20260501190000_add_social_preview/migration.sql`

- [ ] **Step 1: Add `SocialPreview` type to `lib/types.ts`**

Insert this block in `lib/types.ts` immediately AFTER the existing `AudioConfig` interface (current location near line 72, between `AudioConfig` and `FAQItem`):

```ts
// ---------------------------------------------------------------------------
// Social preview / Open Graph
// ---------------------------------------------------------------------------

/** Optional override values shown when a public link is unfurled on social platforms. */
export interface SocialPreview {
  /** Full URL to a 1200×630 image. Falls back to per-subsystem fallback chain when absent. */
  image?: string;
  /** OG/Twitter title override. Falls back to per-subsystem default. */
  title?: string;
  /** OG/Twitter description override. Falls back to per-subsystem default. */
  description?: string;
}
```

- [ ] **Step 2: Add `socialPreview?: SocialPreview` to `InvitationData`**

In `lib/types.ts`, in the `InvitationData` interface (around lines 440–473), add this field at the very end (just before the closing `}` and the `guest` field — place it BEFORE `guest`, which is at line 472):

```ts
  /** Override values used only for OG/Twitter meta tags. Image is never rendered on the page. */
  socialPreview?: SocialPreview;
```

- [ ] **Step 3: Add field on `SaveTheDateData`**

In `lib/save-the-date.ts`, modify the `SaveTheDateData` interface (lines 63–80). Add a new field at the end, before the closing `}`:

```ts
  /** Override values used only for OG/Twitter meta tags. Image is never rendered on the page. */
  socialPreview: import("./types").SocialPreview | null;
```

(We use `import("./types").SocialPreview` to avoid restructuring the existing top-level imports of `./types`. If the existing import block already imports types from `./types`, prefer adding `SocialPreview` to that existing import statement; the current top-of-file import is `import type { AudioConfig, EnvelopeConfig, TextStyleOverrides } from "./types";` at line 2 — extend it to `import type { AudioConfig, EnvelopeConfig, SocialPreview, TextStyleOverrides } from "./types";` and use the bare `SocialPreview | null` in the field instead.)

- [ ] **Step 4: Add migration SQL**

Create file `prisma/migrations/20260501190000_add_social_preview/migration.sql`:

```sql
-- AlterTable
ALTER TABLE "Invitation"   ADD COLUMN "socialPreview" JSONB;
ALTER TABLE "SaveTheDate" ADD COLUMN "socialPreview" JSONB;
```

- [ ] **Step 5: Add columns to `prisma/schema.prisma`**

In `prisma/schema.prisma`, modify the `Invitation` model. Find this line (currently line 99):

```
  ownerToken   String   @unique @default(cuid())
```

Insert this line IMMEDIATELY BEFORE it:

```
  socialPreview Json?    // SocialPreview { image?, title?, description? } — used only for OG/Twitter meta tags
```

In the `SaveTheDate` model, find this line (currently line 179):

```
  ownerToken String   @unique @default(cuid())
```

Insert this line IMMEDIATELY BEFORE it:

```
  socialPreview Json?   // SocialPreview { image?, title?, description? } — used only for OG/Twitter meta tags
```

- [ ] **Step 6: Generate Prisma client**

Run: `npm run db:generate`
Expected: "Generated Prisma Client" success message.

- [ ] **Step 7: Apply the migration to dev database**

Run: `npm run db:push:dev`
Expected: Confirms schema applied. (We use `db:push:dev` for the local dev DB; the migration SQL file is the source of truth for production via `db:migrate:prod`.)

NOTE TO IMPLEMENTER: If `db:push:dev` complains about pending migrations, instead run `npm run db:migrate:dev -- --name add_social_preview` and overwrite the just-generated migration's SQL with the canonical SQL from Step 4 (Prisma may auto-format whitespace; the column definitions must match exactly). Then re-commit.

- [ ] **Step 8: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260501190000_add_social_preview lib/types.ts lib/save-the-date.ts lib/generated
git commit -m "feat(db): add socialPreview json column to Invitation and SaveTheDate"
```

---

## Task 3: Build the resolver module (TDD)

We write the unit tests first, then the implementation. The resolver is pure and easy to test.

**Files:**
- Test: `tests/social-preview.test.ts`
- Create: `lib/social-preview.ts`
- Create: `public/og-default.jpg` (placeholder)

- [ ] **Step 1: Add a placeholder default image**

Create a 1200×630 placeholder JPEG at `public/og-default.jpg` using a Node script that emits a minimal valid JPEG byte sequence (avoids shell-quoting issues with control characters):

```bash
mkdir -p public
node -e "
const fs = require('fs');
const b64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAACAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKpAB//Z';
fs.writeFileSync('public/og-default.jpg', Buffer.from(b64, 'base64'));
"
```

(This writes a 2×2 grayscale placeholder JPEG ≈ 200 bytes. The real branded 1200×630 asset replaces this file in a separate change. Verify: `file public/og-default.jpg` should report `JPEG image data`.)

- [ ] **Step 2: Write the failing test file**

Create `tests/social-preview.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  DEFAULT_OG_IMAGE_PATH,
  resolveInvitationSocialPreview,
  resolveSaveTheDateSocialPreview,
} from "../lib/social-preview";
import type { InvitationData } from "../lib/types";
import type { SaveTheDateData } from "../lib/save-the-date";

const SITE_ORIGIN = "https://example.com";
const DEFAULT_IMAGE_ABS = `${SITE_ORIGIN}${DEFAULT_OG_IMAGE_PATH}`;

// --- Fixtures -------------------------------------------------------------

function baseInvitation(overrides: Partial<InvitationData> = {}): InvitationData {
  return {
    slug: "ana-bruno",
    themeId: "theme_pink",
    template: "pink-floral",
    couple: { bride: "Ana", groom: "Bruno", monogram: "A&B" },
    date: {
      iso: "2027-09-14T16:00:00Z",
      display: "14 de Setembro de 2027",
      dayOfWeek: "Sábado",
      time: "16:00",
      day: "14",
      month: "09",
      year: "2027",
    },
    quote: "Para sempre.",
    location: {
      name: "Quinta",
      address: "Rua A",
      googleMapsUrl: "https://maps.example",
    },
    rsvp: { enabled: true } as InvitationData["rsvp"],
    schedule: [],
    dressCode: { enabled: false, text: "" },
    giftRegistry: { enabled: false, text: "" },
    audio: { enabled: false, src: "", artist: "", title: "" },
    heroImage: "https://cdn.example.com/hero.jpg",
    eventType: "wedding",
    invitationType: "standard",
    ...overrides,
  } as InvitationData;
}

function baseSaveTheDate(overrides: Partial<SaveTheDateData> = {}): SaveTheDateData {
  return {
    id: "std_1",
    slug: "ana-bruno",
    couple: { bride: "Ana", groom: "Bruno" },
    date: {
      iso: "2027-09-14",
      display: "14 de Setembro de 2027",
      day: "14",
      month: "09",
      year: "2027",
    },
    customMessage: null,
    theme: {
      id: "stdtheme_1",
      name: "golden-heart",
      label: "Golden Heart",
      description: "",
      heartColor: "#D4AF37",
      heartGlitterColors: ["#F5E6A3"],
      rsvpButtonBgColor: "#D4AF37",
      bgColor: "#fff",
      titleFont: "serif",
      coupleFont: "serif",
      dateFont: "serif",
      textColor: "#000",
      confettiColors: ["#D4AF37"],
      envelope: null,
    },
    envelope: null,
    textStyles: null,
    rsvp: null,
    audio: { enabled: false, src: "", artist: "", title: "" },
    bottomHero: null,
    socialPreview: null,
    ...overrides,
  };
}

// --- Invitation resolver -------------------------------------------------

describe("resolveInvitationSocialPreview", () => {
  it("returns explicit values when all are set", () => {
    const inv = baseInvitation({
      socialPreview: {
        image: "https://cdn.example.com/custom-og.jpg",
        title: "Custom Title",
        description: "Custom Description",
      },
    });
    const r = resolveInvitationSocialPreview(inv, SITE_ORIGIN);
    expect(r).toEqual({
      image: "https://cdn.example.com/custom-og.jpg",
      title: "Custom Title",
      description: "Custom Description",
      imageSource: "custom",
    });
  });

  it("standard with no socialPreview falls back to heroImage", () => {
    const inv = baseInvitation();
    const r = resolveInvitationSocialPreview(inv, SITE_ORIGIN);
    expect(r.image).toBe("https://cdn.example.com/hero.jpg");
    expect(r.imageSource).toBe("hero");
    expect(r.title).toBe("Ana & Bruno");
    expect(r.description).toBe("Convite de Casamento");
  });

  it("external_video with no socialPreview falls back to heroImage", () => {
    const inv = baseInvitation({ invitationType: "external_video" });
    const r = resolveInvitationSocialPreview(inv, SITE_ORIGIN);
    expect(r.image).toBe("https://cdn.example.com/hero.jpg");
    expect(r.imageSource).toBe("hero");
  });

  it("external_link with no socialPreview falls back to global default", () => {
    const inv = baseInvitation({ invitationType: "external_link" });
    const r = resolveInvitationSocialPreview(inv, SITE_ORIGIN);
    expect(r.image).toBe(DEFAULT_IMAGE_ABS);
    expect(r.imageSource).toBe("default");
  });

  it("non-wedding eventType uses primary name only as title fallback", () => {
    const inv = baseInvitation({
      eventType: "baptism",
      couple: { bride: "Maria", groom: "", monogram: "M" },
    });
    const r = resolveInvitationSocialPreview(inv, SITE_ORIGIN);
    expect(r.title).toBe("Maria");
    expect(r.description).toBe("Convite");
  });

  it("custom title overrides fallback", () => {
    const inv = baseInvitation({ socialPreview: { title: "Pick" } });
    const r = resolveInvitationSocialPreview(inv, SITE_ORIGIN);
    expect(r.title).toBe("Pick");
  });

  it("custom description overrides fallback", () => {
    const inv = baseInvitation({ socialPreview: { description: "Vem celebrar" } });
    const r = resolveInvitationSocialPreview(inv, SITE_ORIGIN);
    expect(r.description).toBe("Vem celebrar");
  });

  it("custom image is used regardless of invitationType", () => {
    const inv = baseInvitation({
      invitationType: "external_link",
      socialPreview: { image: "https://cdn.example.com/c.jpg" },
    });
    const r = resolveInvitationSocialPreview(inv, SITE_ORIGIN);
    expect(r.image).toBe("https://cdn.example.com/c.jpg");
    expect(r.imageSource).toBe("custom");
  });
});

// --- Save the Date resolver ---------------------------------------------

describe("resolveSaveTheDateSocialPreview", () => {
  it("returns explicit values when all are set", () => {
    const std = baseSaveTheDate({
      socialPreview: {
        image: "https://cdn.example.com/custom.jpg",
        title: "Custom",
        description: "Desc",
      },
    });
    const r = resolveSaveTheDateSocialPreview(std, SITE_ORIGIN);
    expect(r).toEqual({
      image: "https://cdn.example.com/custom.jpg",
      title: "Custom",
      description: "Desc",
      imageSource: "custom",
    });
  });

  it("falls back to bottomHero image when enabled and image-typed", () => {
    const std = baseSaveTheDate({
      bottomHero: {
        enabled: true,
        mediaUrl: "https://cdn.example.com/bh.jpg",
        mediaType: "image",
        title: "",
        description: "",
      },
    });
    const r = resolveSaveTheDateSocialPreview(std, SITE_ORIGIN);
    expect(r.image).toBe("https://cdn.example.com/bh.jpg");
    expect(r.imageSource).toBe("bottomHero");
  });

  it("does NOT use bottomHero when disabled", () => {
    const std = baseSaveTheDate({
      bottomHero: {
        enabled: false,
        mediaUrl: "https://cdn.example.com/bh.jpg",
        mediaType: "image",
        title: "",
        description: "",
      },
    });
    const r = resolveSaveTheDateSocialPreview(std, SITE_ORIGIN);
    expect(r.image).toBe(DEFAULT_IMAGE_ABS);
    expect(r.imageSource).toBe("default");
  });

  it("does NOT use bottomHero when mediaType is video", () => {
    const std = baseSaveTheDate({
      bottomHero: {
        enabled: true,
        mediaUrl: "https://cdn.example.com/v.mp4",
        mediaType: "video",
        title: "",
        description: "",
      },
    });
    const r = resolveSaveTheDateSocialPreview(std, SITE_ORIGIN);
    expect(r.image).toBe(DEFAULT_IMAGE_ABS);
    expect(r.imageSource).toBe("default");
  });

  it("does NOT use bottomHero when mediaUrl is empty", () => {
    const std = baseSaveTheDate({
      bottomHero: {
        enabled: true,
        mediaUrl: "",
        mediaType: "image",
        title: "",
        description: "",
      },
    });
    const r = resolveSaveTheDateSocialPreview(std, SITE_ORIGIN);
    expect(r.image).toBe(DEFAULT_IMAGE_ABS);
    expect(r.imageSource).toBe("default");
  });

  it("title fallback is the existing combined string", () => {
    const std = baseSaveTheDate();
    const r = resolveSaveTheDateSocialPreview(std, SITE_ORIGIN);
    expect(r.title).toBe("Ana & Bruno — Save the Date");
  });

  it("description fallback matches existing page-level description", () => {
    const std = baseSaveTheDate();
    const r = resolveSaveTheDateSocialPreview(std, SITE_ORIGIN);
    expect(r.description).toBe(
      "Ana & Bruno invite you to save the date: 14 de Setembro de 2027",
    );
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- tests/social-preview.test.ts`
Expected: FAIL with "Cannot find module '../lib/social-preview'" (or similar).

- [ ] **Step 4: Write the resolver implementation**

Create `lib/social-preview.ts`:

```ts
import type { InvitationData, SocialPreview } from "./types";
import type { SaveTheDateData } from "./save-the-date";
import {
  buildInvitationDisplayName,
  isWeddingEventType,
} from "./invitation-event-types";
import type { InvitationEventType } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Path to the bundled default OG image (relative to the site origin). */
export const DEFAULT_OG_IMAGE_PATH = "/og-default.jpg";

/** Recommended image dimensions for OG images. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResolvedSocialPreview {
  /** Always an absolute URL. */
  image: string;
  title: string;
  description: string;
  imageSource: "custom" | "hero" | "bottomHero" | "default";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultImageUrl(siteOrigin: string): string {
  return `${siteOrigin}${DEFAULT_OG_IMAGE_PATH}`;
}

function nonEmpty(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function describeInvitationEvent(
  eventType: InvitationEventType,
  isWedding: boolean,
): string {
  if (isWedding) return "Convite de Casamento";
  switch (eventType) {
    case "anniversary":
      return "Convite de Aniversário";
    case "baptism":
      return "Convite de Batizado";
    case "engagement":
      return "Convite de Noivado";
    case "other":
    default:
      return "Convite";
  }
}

// ---------------------------------------------------------------------------
// Resolvers
// ---------------------------------------------------------------------------

/**
 * Resolve the social preview for an invitation, applying the per-type
 * fallback chain. Always returns a fully-populated object.
 */
export function resolveInvitationSocialPreview(
  invitation: InvitationData,
  siteOrigin: string,
): ResolvedSocialPreview {
  const sp: SocialPreview = invitation.socialPreview ?? {};
  const isWedding = isWeddingEventType(invitation.eventType);

  // image
  let image: string;
  let imageSource: ResolvedSocialPreview["imageSource"];
  if (nonEmpty(sp.image)) {
    image = sp.image;
    imageSource = "custom";
  } else if (
    invitation.invitationType !== "external_link" &&
    nonEmpty(invitation.heroImage)
  ) {
    image = invitation.heroImage;
    imageSource = "hero";
  } else {
    image = defaultImageUrl(siteOrigin);
    imageSource = "default";
  }

  // title
  const fallbackTitle = buildInvitationDisplayName({
    eventType: invitation.eventType,
    primaryName: invitation.couple.bride,
    secondaryName: invitation.couple.groom,
  });
  const title = nonEmpty(sp.title)
    ? sp.title
    : nonEmpty(fallbackTitle)
      ? fallbackTitle
      : "Convite";

  // description
  const description = nonEmpty(sp.description)
    ? sp.description
    : describeInvitationEvent(invitation.eventType, isWedding);

  return { image, title, description, imageSource };
}

/**
 * Resolve the social preview for a Save the Date, applying the
 * fallback chain. Always returns a fully-populated object.
 */
export function resolveSaveTheDateSocialPreview(
  saveTheDate: SaveTheDateData,
  siteOrigin: string,
): ResolvedSocialPreview {
  const sp: SocialPreview = saveTheDate.socialPreview ?? {};
  const { bride, groom } = saveTheDate.couple;

  // image
  let image: string;
  let imageSource: ResolvedSocialPreview["imageSource"];
  if (nonEmpty(sp.image)) {
    image = sp.image;
    imageSource = "custom";
  } else if (
    saveTheDate.bottomHero?.enabled === true &&
    saveTheDate.bottomHero.mediaType === "image" &&
    nonEmpty(saveTheDate.bottomHero.mediaUrl)
  ) {
    image = saveTheDate.bottomHero.mediaUrl;
    imageSource = "bottomHero";
  } else {
    image = defaultImageUrl(siteOrigin);
    imageSource = "default";
  }

  // title
  const title = nonEmpty(sp.title)
    ? sp.title
    : nonEmpty(bride) || nonEmpty(groom)
      ? `${bride} & ${groom} — Save the Date`
      : "Save the Date";

  // description (matches the existing page-level description previously
  // emitted by app/s/[slug]/page.tsx:24)
  const description = nonEmpty(sp.description)
    ? sp.description
    : `${bride} & ${groom} invite you to save the date: ${saveTheDate.date.display}`;

  return { image, title, description, imageSource };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- tests/social-preview.test.ts`
Expected: PASS — all test cases in both `describe` blocks green.

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: PASS (existing tests unaffected).

- [ ] **Step 7: Commit**

```bash
git add lib/social-preview.ts tests/social-preview.test.ts public/og-default.jpg
git commit -m "feat: add social preview resolvers for invitation and save the date"
```

---

## Task 4: Wire resolvers into both `generateMetadata` exports (TDD smoke tests)

**Files:**
- Test: `tests/social-preview-metadata.test.ts`
- Modify: `app/[slug]/page.tsx:23-58`
- Modify: `app/s/[slug]/page.tsx:8-30`

- [ ] **Step 1: Write the failing smoke tests**

Create `tests/social-preview-metadata.test.ts`. We test the resolvers' integration shape (since `generateMetadata` calls Prisma we don't run it directly here; instead this test asserts that the resolver output has the exact fields the metadata code will read).

```ts
import { describe, expect, it } from "vitest";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  resolveInvitationSocialPreview,
  resolveSaveTheDateSocialPreview,
} from "../lib/social-preview";
import type { InvitationData } from "../lib/types";
import type { SaveTheDateData } from "../lib/save-the-date";

const SITE_ORIGIN = "https://example.com";

function buildOpenGraphFromInvitation(invitation: InvitationData, slug: string) {
  const r = resolveInvitationSocialPreview(invitation, SITE_ORIGIN);
  return {
    title: r.title,
    description: r.description,
    openGraph: {
      title: r.title,
      description: r.description,
      images: [{ url: r.image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
      type: "website" as const,
      url: `${SITE_ORIGIN}/${slug}`,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: r.title,
      description: r.description,
      images: [r.image],
    },
  };
}

function buildOpenGraphFromSaveTheDate(std: SaveTheDateData, slug: string) {
  const r = resolveSaveTheDateSocialPreview(std, SITE_ORIGIN);
  return {
    title: r.title,
    description: r.description,
    openGraph: {
      title: r.title,
      description: r.description,
      images: [{ url: r.image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
      type: "website" as const,
      url: `${SITE_ORIGIN}/s/${slug}`,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: r.title,
      description: r.description,
      images: [r.image],
    },
  };
}

// Re-use fixtures from social-preview.test.ts shape.

const invitationFixture: InvitationData = {
  slug: "ana-bruno",
  themeId: "theme_pink",
  template: "pink-floral",
  couple: { bride: "Ana", groom: "Bruno", monogram: "A&B" },
  date: {
    iso: "2027-09-14T16:00:00Z",
    display: "14 de Setembro de 2027",
    dayOfWeek: "Sábado",
    time: "16:00",
    day: "14",
    month: "09",
    year: "2027",
  },
  quote: "Para sempre.",
  location: { name: "Q", address: "A", googleMapsUrl: "u" },
  rsvp: { enabled: true } as InvitationData["rsvp"],
  schedule: [],
  dressCode: { enabled: false, text: "" },
  giftRegistry: { enabled: false, text: "" },
  audio: { enabled: false, src: "", artist: "", title: "" },
  heroImage: "https://cdn.example.com/hero.jpg",
  eventType: "wedding",
  invitationType: "standard",
} as InvitationData;

const stdFixture: SaveTheDateData = {
  id: "1",
  slug: "ana-bruno",
  couple: { bride: "Ana", groom: "Bruno" },
  date: {
    iso: "2027-09-14",
    display: "14 de Setembro de 2027",
    day: "14",
    month: "09",
    year: "2027",
  },
  customMessage: null,
  theme: {
    id: "t",
    name: "n",
    label: "L",
    description: "",
    heartColor: "#000",
    heartGlitterColors: [],
    rsvpButtonBgColor: "#000",
    bgColor: "#fff",
    titleFont: "s",
    coupleFont: "s",
    dateFont: "s",
    textColor: "#000",
    confettiColors: [],
    envelope: null,
  },
  envelope: null,
  textStyles: null,
  rsvp: null,
  audio: { enabled: false, src: "", artist: "", title: "" },
  bottomHero: null,
  socialPreview: null,
};

describe("invitation generateMetadata shape", () => {
  it("emits openGraph.images and twitter card with resolver output", () => {
    const meta = buildOpenGraphFromInvitation(invitationFixture, "ana-bruno");
    expect(meta.openGraph.images).toEqual([
      { url: "https://cdn.example.com/hero.jpg", width: 1200, height: 630 },
    ]);
    expect(meta.openGraph.url).toBe("https://example.com/ana-bruno");
    expect(meta.twitter.card).toBe("summary_large_image");
    expect(meta.twitter.images).toEqual(["https://cdn.example.com/hero.jpg"]);
    expect(meta.title).toBe("Ana & Bruno");
    expect(meta.description).toBe("Convite de Casamento");
  });
});

describe("save the date generateMetadata shape", () => {
  it("emits openGraph.images using default and twitter card", () => {
    const meta = buildOpenGraphFromSaveTheDate(stdFixture, "ana-bruno");
    expect(meta.openGraph.images).toEqual([
      { url: "https://example.com/og-default.jpg", width: 1200, height: 630 },
    ]);
    expect(meta.openGraph.url).toBe("https://example.com/s/ana-bruno");
    expect(meta.twitter.card).toBe("summary_large_image");
    expect(meta.title).toBe("Ana & Bruno — Save the Date");
    expect(meta.description).toBe(
      "Ana & Bruno invite you to save the date: 14 de Setembro de 2027",
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they pass**

Run: `npm test -- tests/social-preview-metadata.test.ts`
Expected: PASS — these tests use the resolver from Task 3 directly.

(If they fail, check Task 3 was completed correctly. We are not yet writing into `app/[slug]/page.tsx` or `app/s/[slug]/page.tsx`; the smoke tests prove the resolver emits the right shape for the metadata code we are about to write.)

- [ ] **Step 3: Update invitation `generateMetadata`**

Replace the current function body in `app/[slug]/page.tsx` (currently lines 23–58). The replacement keeps the early-return for "not found" and uses the resolver.

Old code (current lines 23–58 — to be replaced entirely):

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await getInvitation(slug);

  if (!invitation) {
    return { title: "Convite não encontrado" };
  }

  const { bride, groom } = invitation.couple;
  const isWedding = isWeddingEventType(invitation.eventType);
  const invitationName = buildInvitationDisplayName({
    eventType: invitation.eventType,
    primaryName: bride,
    secondaryName: groom,
  });

  return {
    title: isWedding
      ? `${invitationName} — Convite de Casamento`
      : `${invitationName} — Convite`,
    description: isWedding
      ? `${bride} e ${groom} convidam você para celebrar o casamento em ${invitation.date.display}. ${invitation.quote}`
      : `${invitationName} convida você para celebrar este momento em ${invitation.date.display}. ${invitation.quote}`,
    openGraph: {
      title: invitationName,
      description: isWedding
        ? `Casamento em ${invitation.date.display}`
        : `Evento em ${invitation.date.display}`,
      images: invitation.heroImage ? [invitation.heroImage] : [],
    },
  };
}
```

New code:

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await getInvitation(slug);

  if (!invitation) {
    return { title: "Convite não encontrado" };
  }

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { image, title, description } = resolveInvitationSocialPreview(
    invitation,
    siteOrigin,
  );

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
      type: "website",
      url: `${siteOrigin}/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
```

Update the imports at the top of `app/[slug]/page.tsx`. Replace this block:

```ts
import {
  buildInvitationDisplayName,
  isWeddingEventType,
} from "@/lib/invitation-event-types";
```

with:

```ts
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  resolveInvitationSocialPreview,
} from "@/lib/social-preview";
```

(`buildInvitationDisplayName` and `isWeddingEventType` are no longer used in this file. If a downstream module imports them from this file by mistake, restore them — they remain available via `@/lib/invitation-event-types`.)

- [ ] **Step 4: Update Save the Date `generateMetadata`**

Replace the current function body in `app/s/[slug]/page.tsx` (currently lines 8–30) entirely.

Old code (lines 8–30 — to be replaced entirely):

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSaveTheDate(slug);

  if (!data) {
    return { title: "Save the Date — Not Found" };
  }

  const { bride, groom } = data.couple;

  return {
    title: `${bride} & ${groom} — Save the Date`,
    description: `${bride} & ${groom} invite you to save the date: ${data.date.display}`,
    openGraph: {
      title: `${bride} & ${groom} — Save the Date`,
      description: `Save the date: ${data.date.display}`,
    },
  };
}
```

New code:

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSaveTheDate(slug);

  if (!data) {
    return { title: "Save the Date — Not Found" };
  }

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { image, title, description } = resolveSaveTheDateSocialPreview(
    data,
    siteOrigin,
  );

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
      type: "website",
      url: `${siteOrigin}/s/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
```

Add this import to the top of `app/s/[slug]/page.tsx` (just below the existing imports):

```ts
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  resolveSaveTheDateSocialPreview,
} from "@/lib/social-preview";
```

- [ ] **Step 5: Run the smoke tests again**

Run: `npm test -- tests/social-preview-metadata.test.ts`
Expected: PASS.

- [ ] **Step 6: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add tests/social-preview-metadata.test.ts app/[slug]/page.tsx app/s/[slug]/page.tsx
git commit -m "feat: emit OG/Twitter meta tags via social preview resolvers"
```

---

## Task 5: Wire `socialPreview` through invitation read mapping and admin API

**Files:**
- Modify: `lib/invitations.ts:21-92`
- Modify: `app/api/admin/invitations/route.ts:98-146`
- Modify: `app/api/admin/invitations/[id]/route.ts:108-201`

- [ ] **Step 1: Add `socialPreview` to invitation row mapping**

In `lib/invitations.ts`:

Add to the `InvitationWithTheme` type (currently lines 21–55) — insert this field at the end of the type before the closing brace:

```ts
  socialPreview: unknown;
```

In `toInvitationData` (currently lines 57–92) — insert this field at the end of the returned object literal before the closing brace:

```ts
    socialPreview:
      (row.socialPreview as InvitationData["socialPreview"]) ?? undefined,
```

- [ ] **Step 2: Persist `socialPreview` on POST**

In `app/api/admin/invitations/route.ts`, inside the `prisma.invitation.create({ data: { ... } })` call (currently lines 99–142), add this property at the end (just before the closing brace of `data:`):

```ts
        socialPreview: sanitizeJsonField(body.socialPreview, null),
```

- [ ] **Step 3: Persist `socialPreview` on PUT**

In `app/api/admin/invitations/[id]/route.ts`, inside the `prisma.invitation.update({ data: { ... } })` call (currently lines 110–197), add this conditional spread at the end (just before the closing brace of `data:`):

```ts
        ...(body.socialPreview !== undefined && {
          socialPreview: sanitizeJsonField(body.socialPreview, null),
        }),
```

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/invitations.ts app/api/admin/invitations/route.ts app/api/admin/invitations/[id]/route.ts
git commit -m "feat(api): persist socialPreview on invitation admin routes"
```

---

## Task 6: Apply `sanitizeJsonField` to all Save the Date admin JSON fields (TDD)

This is the broader STD sanitization change explicitly approved during brainstorming. We add regression tests first, then refactor.

**Files:**
- Test: `tests/save-the-date-json-sanitize.test.ts`
- Modify: `app/api/admin/save-the-date/route.ts`
- Modify: `app/api/admin/save-the-date/[id]/route.ts`

- [ ] **Step 1: Write a focused regression test for the sanitizer behavior**

Create `tests/save-the-date-json-sanitize.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sanitizeJsonField } from "../lib/json-sanitize";
import { Prisma } from "../lib/generated/prisma/client";

describe("sanitizeJsonField (Save the Date use)", () => {
  it("preserves a non-empty object verbatim", () => {
    const obj = { enabled: true, mediaUrl: "https://x", mediaType: "image", title: "t", description: "d" };
    expect(sanitizeJsonField(obj, null)).toEqual(obj);
  });

  it("preserves an envelope object with hex color base", () => {
    const env = { base: "#ffffff" };
    expect(sanitizeJsonField(env, null)).toEqual(env);
  });

  it("returns Prisma.JsonNull for empty string + null fallback", () => {
    expect(sanitizeJsonField("", null)).toBe(Prisma.JsonNull);
  });

  it("returns Prisma.JsonNull for whitespace-only string + null fallback", () => {
    expect(sanitizeJsonField("   ", null)).toBe(Prisma.JsonNull);
  });

  it("returns Prisma.JsonNull for null + null fallback", () => {
    expect(sanitizeJsonField(null, null)).toBe(Prisma.JsonNull);
  });

  it("returns Prisma.JsonNull for undefined + null fallback", () => {
    expect(sanitizeJsonField(undefined, null)).toBe(Prisma.JsonNull);
  });

  it("preserves an object that contains an empty-string property (does NOT recurse)", () => {
    const env = { base: "" };
    expect(sanitizeJsonField(env, null)).toEqual(env);
  });
});
```

- [ ] **Step 2: Run the test — it should already pass**

Run: `npm test -- tests/save-the-date-json-sanitize.test.ts`
Expected: PASS (the sanitizer works the same as it did when used for invitations).

This locks in the contract: `sanitizeJsonField` is a top-level converter, not a deep one. It does NOT mangle non-empty strings inside nested objects.

- [ ] **Step 3: Refactor `app/api/admin/save-the-date/route.ts` POST**

Replace the current POST body (current lines 12–44). New body:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sanitizeJsonField } from "@/lib/json-sanitize";

export async function GET() {
  const items = await prisma.saveTheDate.findMany({
    include: { theme: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      slug,
      themeId,
      couple,
      date,
      customMessage,
      envelope,
      textStyles,
      rsvp,
      audio,
      bottomHero,
      socialPreview,
    } = body;

    if (!slug || !themeId || !couple || !date) {
      return NextResponse.json(
        { error: "Missing required fields: slug, themeId, couple, date" },
        { status: 400 },
      );
    }

    const item = await prisma.saveTheDate.create({
      data: {
        slug,
        themeId,
        couple: sanitizeJsonField(couple, {}),
        date: sanitizeJsonField(date, {}),
        customMessage: customMessage || null,
        envelope: sanitizeJsonField(envelope, null),
        textStyles: sanitizeJsonField(textStyles, null),
        rsvp: sanitizeJsonField(rsvp, null),
        audio: sanitizeJsonField(audio, null),
        bottomHero: sanitizeJsonField(bottomHero, null),
        socialPreview: sanitizeJsonField(socialPreview, null),
      },
      include: { theme: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

NOTE TO IMPLEMENTER: `couple` and `date` are required JSON columns on `SaveTheDate` (no `?` in the schema), so they cannot accept `Prisma.JsonNull`. We pass `{}` as fallback so the sanitizer would never return `JsonNull` for them. In practice the validation block above already rejects the request when they're missing, so the fallback is defensive belt-and-braces.

- [ ] **Step 4: Refactor `app/api/admin/save-the-date/[id]/route.ts` PUT**

Replace the current PUT body (lines 17–46). The new version mirrors the invitation PUT pattern: only set fields that were sent, and always sanitize JSON ones.

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sanitizeJsonField } from "@/lib/json-sanitize";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const item = await prisma.saveTheDate.findUnique({
    where: { id },
    include: { theme: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();

    const existing = await prisma.saveTheDate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = await prisma.saveTheDate.update({
      where: { id },
      data: {
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.themeId !== undefined && { themeId: body.themeId }),
        ...(body.couple !== undefined && {
          couple: sanitizeJsonField(body.couple, existing.couple),
        }),
        ...(body.date !== undefined && {
          date: sanitizeJsonField(body.date, existing.date),
        }),
        ...(body.customMessage !== undefined && {
          customMessage: body.customMessage || null,
        }),
        ...(body.envelope !== undefined && {
          envelope: sanitizeJsonField(body.envelope, null),
        }),
        ...(body.textStyles !== undefined && {
          textStyles: sanitizeJsonField(body.textStyles, null),
        }),
        ...(body.rsvp !== undefined && {
          rsvp: sanitizeJsonField(body.rsvp, null),
        }),
        ...(body.audio !== undefined && {
          audio: sanitizeJsonField(body.audio, null),
        }),
        ...(body.bottomHero !== undefined && {
          bottomHero: sanitizeJsonField(body.bottomHero, null),
        }),
        ...(body.socialPreview !== undefined && {
          socialPreview: sanitizeJsonField(body.socialPreview, null),
        }),
      },
      include: { theme: true },
    });
    return NextResponse.json(item);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await prisma.saveTheDateEvent.deleteMany({
      where: { saveTheDate: { id } },
    });
    await prisma.saveTheDate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

NOTE TO IMPLEMENTER: This change has two intentional behavior shifts beyond sanitization:
1. The PUT now refuses to update a non-existent STD with a 404 (previously Prisma would throw and we returned 500). This matches the invitation PUT pattern.
2. The PUT now only updates fields that are present in the body (previously it always wrote every field, including overwriting customMessage to null when the client omitted it). This also matches the invitation PUT pattern.

Both are part of the "broader STD sanitization change" the spec explicitly approved. Verify in Step 6 below.

- [ ] **Step 5: Wire `socialPreview` through `lib/save-the-date.ts`**

In `lib/save-the-date.ts`:
- Update the import line at line 2 to include `SocialPreview`:
  ```ts
  import type { AudioConfig, EnvelopeConfig, SocialPreview, TextStyleOverrides } from "./types";
  ```
- Update the `SaveTheDateData` interface field added in Task 2 (Step 3) to use the bare type:
  ```ts
    socialPreview: SocialPreview | null;
  ```
- Inside `getSaveTheDate` (lines 137–155), at the end of the returned object literal (before the closing brace), add:
  ```ts
    socialPreview: row.socialPreview
      ? (row.socialPreview as unknown as SocialPreview)
      : null,
  ```

- [ ] **Step 6: Run all tests**

Run: `npm test`
Expected: PASS — including the new `tests/save-the-date-json-sanitize.test.ts` and all earlier tests.

- [ ] **Step 7: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 8: Manual smoke (development environment)**

If dev DB is set up, run `npm run dev`, then in the admin UI:
1. Edit an existing Save the Date (without changing anything) and save it. Confirm: no error, all fields persisted.
2. Edit an existing Save the Date with `envelope.base = "#ffffff"`. Save. Reload the edit page. Confirm: hex color is preserved.
3. Toggle `bottomHero.enabled` from true to false on a record that has a `mediaUrl`. Save. Reload. Confirm: the mediaUrl is preserved (sanitizer does not recurse into the disabled object).

If issues are found, treat them as bugs in the broader sanitization change and fix before proceeding. Document the finding in the commit message.

- [ ] **Step 9: Commit**

```bash
git add tests/save-the-date-json-sanitize.test.ts app/api/admin/save-the-date/route.ts app/api/admin/save-the-date/[id]/route.ts lib/save-the-date.ts
git commit -m "refactor(save-the-date): sanitize JSON fields and align API with invitation pattern"
```

---

## Task 7: Build the shared `SocialPreviewCard` and `SocialPreviewSection` components

**Files:**
- Create: `components/admin/SocialPreviewCard.tsx`
- Create: `components/admin/SocialPreviewSection.tsx`

- [ ] **Step 1: Create `SocialPreviewCard`**

Create `components/admin/SocialPreviewCard.tsx`:

```tsx
"use client";

import Image from "next/image";

interface SocialPreviewCardProps {
  /** Resolved image URL — never empty. */
  image: string;
  /** Resolved title — never empty. */
  title: string;
  /** Resolved description — never empty. */
  description: string;
  /** Optional URL string shown under the card. */
  url?: string;
}

/**
 * Pure presentational card that mimics how a link unfurls on
 * WhatsApp / Facebook / iMessage. No data fetching.
 */
export default function SocialPreviewCard({
  image,
  title,
  description,
  url,
}: SocialPreviewCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden max-w-sm">
      <div className="relative aspect-[1200/630] w-full bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3 space-y-1">
        <div className="text-sm font-medium leading-tight line-clamp-2">
          {title}
        </div>
        <div className="text-xs text-muted-foreground line-clamp-2">
          {description}
        </div>
        {url && (
          <div className="text-[11px] text-muted-foreground/70 truncate pt-1">
            {url}
          </div>
        )}
      </div>
    </div>
  );
}
```

NOTE TO IMPLEMENTER: We use a plain `<img>` because the URL may be a full S3 URL that hasn't been added to the Next.js `images.remotePatterns` allowlist (which is configured in `next.config.ts` for the production bucket only). A plain `<img>` keeps this admin-only preview lightweight and avoids configuration drift.

- [ ] **Step 2: Create `SocialPreviewSection`**

Create `components/admin/SocialPreviewSection.tsx`:

```tsx
"use client";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MediaUpload from "@/components/admin/MediaUpload";
import SocialPreviewCard from "@/components/admin/SocialPreviewCard";
import type { SocialPreview } from "@/lib/types";

interface SocialPreviewSectionProps {
  /** Current value (may be undefined). */
  value: SocialPreview | undefined;
  /** Called whenever any field changes. */
  onChange: (next: SocialPreview | undefined) => void;
  /** Resolved values to show in the live preview card. */
  resolvedImage: string;
  resolvedTitle: string;
  resolvedDescription: string;
  /** Optional public URL to display under the preview card. */
  publicUrl?: string;
  /** Accordion item value (must be unique within the parent accordion). */
  accordionValue: string;
}

/**
 * Reusable accordion section for editing the social preview
 * (image + title + description) of an Invitation or Save the Date.
 *
 * Used by:
 * - app/admin/invitations/InvitationForm.tsx
 * - app/admin/invitations/ExternalInvitationForm.tsx
 * - app/admin/save-the-dates/SaveTheDateForm.tsx
 */
export default function SocialPreviewSection({
  value,
  onChange,
  resolvedImage,
  resolvedTitle,
  resolvedDescription,
  publicUrl,
  accordionValue,
}: SocialPreviewSectionProps) {
  function patch(patchValue: Partial<SocialPreview>) {
    const next: SocialPreview = {
      image: value?.image,
      title: value?.title,
      description: value?.description,
      ...patchValue,
    };
    // Normalize: if every field is empty, clear the whole object so the
    // payload is `undefined` (which the API converts to JsonNull).
    const allEmpty =
      !next.image && !next.title && !next.description;
    onChange(allEmpty ? undefined : next);
  }

  const image = value?.image ?? "";
  const title = value?.title ?? "";
  const description = value?.description ?? "";

  return (
    <AccordionItem value={accordionValue} className="border rounded-lg px-4">
      <AccordionTrigger className="text-sm font-medium">
        Pré-visualização de partilha
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pb-4">
        <p className="text-xs text-muted-foreground">
          Esta imagem aparece quando o link é partilhado em apps como WhatsApp,
          Facebook ou iMessage. Recomendado: 1200×630 pixels.
        </p>

        <div className="space-y-1.5">
          <Label>Imagem</Label>
          <MediaUpload
            kind="image"
            maxSizeMB={5}
            value={image || undefined}
            onUpload={(url) => patch({ image: url })}
            onClear={() => patch({ image: undefined })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="socialPreviewTitle">Título</Label>
          <Input
            id="socialPreviewTitle"
            value={title}
            placeholder={resolvedTitle}
            onChange={(e) => patch({ title: e.target.value || undefined })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="socialPreviewDescription">Descrição</Label>
          <Textarea
            id="socialPreviewDescription"
            value={description}
            placeholder={resolvedDescription}
            rows={2}
            onChange={(e) =>
              patch({ description: e.target.value || undefined })
            }
          />
        </div>

        <div className="pt-2">
          <Label className="block mb-2">Pré-visualização</Label>
          <SocialPreviewCard
            image={resolvedImage}
            title={resolvedTitle}
            description={resolvedDescription}
            url={publicUrl}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
```

NOTE TO IMPLEMENTER: Verify the import path for `Textarea`, `Input`, `Label`, and `Accordion*` matches the patterns already used in `SaveTheDateForm.tsx` and `InvitationForm.tsx`. If those forms import from `@/components/ui/textarea`, `@/components/ui/input`, etc., use the same paths here.

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/admin/SocialPreviewCard.tsx components/admin/SocialPreviewSection.tsx
git commit -m "feat(admin): add SocialPreviewCard and SocialPreviewSection components"
```

---

## Task 8: Wire SocialPreviewSection into `InvitationForm.tsx`

**Files:**
- Modify: `app/admin/invitations/InvitationForm.tsx`

- [ ] **Step 1: Add resolver import**

At the top of `app/admin/invitations/InvitationForm.tsx`, add:

```ts
import SocialPreviewSection from "@/components/admin/SocialPreviewSection";
import { resolveInvitationSocialPreview } from "@/lib/social-preview";
```

- [ ] **Step 2: Compute resolved values inside the component**

Inside the `InvitationForm` component body, after the existing `useState` for `form` and the `isWedding` derivation (around line 396), add:

```ts
  const resolvedSocialPreview = resolveInvitationSocialPreview(
    form,
    typeof window !== "undefined" ? window.location.origin : "",
  );
```

NOTE TO IMPLEMENTER: We use `window.location.origin` so the preview card shows the realistic absolute URL the resolver would emit at runtime. Server-rendering this component is not relevant since it is `"use client"`.

- [ ] **Step 3: Render the new accordion item**

The form currently has many `<AccordionItem>` blocks. Add a new one **after the very last existing AccordionItem in the form's main accordion**, just before the closing `</Accordion>` tag. The accordion-item value `socialPreview` must be unique.

Find the last `</AccordionItem>` inside the main `<Accordion>` block. Insert this block immediately after it (and before the closing `</Accordion>`):

```tsx
            <SocialPreviewSection
              accordionValue="socialPreview"
              value={form.socialPreview}
              onChange={(next) =>
                setForm((prev) => ({ ...prev, socialPreview: next }))
              }
              resolvedImage={resolvedSocialPreview.image}
              resolvedTitle={resolvedSocialPreview.title}
              resolvedDescription={resolvedSocialPreview.description}
              publicUrl={
                form.slug
                  ? `${typeof window !== "undefined" ? window.location.origin : ""}/${form.slug}`
                  : undefined
              }
            />
```

NOTE TO IMPLEMENTER: If the existing accordion uses a `defaultValue={[...]}` array prop to control which sections are expanded by default, do NOT add `"socialPreview"` to that array — the section should start collapsed.

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/admin/invitations/InvitationForm.tsx
git commit -m "feat(admin): add social preview section to standard invitation form"
```

---

## Task 9: Wire SocialPreviewSection into `ExternalInvitationForm.tsx`

**Files:**
- Modify: `app/admin/invitations/ExternalInvitationForm.tsx`

- [ ] **Step 1: Add imports**

At the top of `app/admin/invitations/ExternalInvitationForm.tsx`, add:

```ts
import SocialPreviewSection from "@/components/admin/SocialPreviewSection";
import { resolveInvitationSocialPreview } from "@/lib/social-preview";
```

- [ ] **Step 2: Compute resolved values**

Inside the `ExternalInvitationForm` component body, after the existing `subType` derivation (around line 228), add:

```ts
  const resolvedSocialPreview = resolveInvitationSocialPreview(
    form,
    typeof window !== "undefined" ? window.location.origin : "",
  );
```

- [ ] **Step 3: Render the new accordion item**

In the rendered JSX, find the last `<AccordionItem>` inside the main `<Accordion>` block (this is the audio section, around line 918). Insert this block immediately after the audio section's closing `</AccordionItem>` and before the closing `</Accordion>`:

```tsx
            <SocialPreviewSection
              accordionValue="socialPreview"
              value={form.socialPreview}
              onChange={(next) =>
                setForm((prev) => ({ ...prev, socialPreview: next }))
              }
              resolvedImage={resolvedSocialPreview.image}
              resolvedTitle={resolvedSocialPreview.title}
              resolvedDescription={resolvedSocialPreview.description}
              publicUrl={
                form.slug
                  ? `${typeof window !== "undefined" ? window.location.origin : ""}/${form.slug}`
                  : undefined
              }
            />
```

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/admin/invitations/ExternalInvitationForm.tsx
git commit -m "feat(admin): add social preview section to external invitation form"
```

---

## Task 10: Wire SocialPreviewSection into `SaveTheDateForm.tsx`

**Files:**
- Modify: `app/admin/save-the-dates/SaveTheDateForm.tsx`

- [ ] **Step 1: Add `socialPreview` to `SaveTheDateFormData`**

In `app/admin/save-the-dates/SaveTheDateForm.tsx`, the `SaveTheDateFormData` interface is at lines 54–79. Add this field at the end (just before the closing `}`):

```ts
  socialPreview?: import("@/lib/types").SocialPreview;
```

If the file already imports types from `@/lib/types`, prefer adding `SocialPreview` to that existing import statement and using the bare type. Search the file for `from "@/lib/types"`; if a type-only import exists (e.g., `import type { TextStyleOverrides, EnvelopeConfig } from "@/lib/types";`), extend it.

- [ ] **Step 2: Add resolver and component imports**

Near the existing imports at the top of the file, add:

```ts
import SocialPreviewSection from "@/components/admin/SocialPreviewSection";
import { resolveSaveTheDateSocialPreview } from "@/lib/social-preview";
```

- [ ] **Step 3: Compute resolved values**

Inside the `SaveTheDateForm` component body, after the existing `previewData` `useMemo` (around line 191), add:

```ts
  const resolvedSocialPreview = resolveSaveTheDateSocialPreview(
    {
      ...previewData,
      socialPreview: data.socialPreview ?? null,
    },
    typeof window !== "undefined" ? window.location.origin : "",
  );
```

(`previewData` already has the right shape minus `socialPreview`; adding the field inline keeps the resolver happy and avoids a second `useMemo`.)

- [ ] **Step 4: Add `socialPreview` to the submit payload**

In the `handleSubmit` function (around lines 274–332), the `body: JSON.stringify({ ... })` block (lines 297–308) lists every field sent to the API. Add a new line at the end of that object literal (before the closing `}`):

```ts
          socialPreview: data.socialPreview ?? null,
```

- [ ] **Step 5: Render the accordion item at the bottom**

The bottom hero `</AccordionItem>` is at line 1010. Insert this block immediately after line 1010 and before the closing `</Accordion>`:

```tsx
            <SocialPreviewSection
              accordionValue="socialPreview"
              value={data.socialPreview}
              onChange={(next) =>
                setData((p) => ({ ...p, socialPreview: next }))
              }
              resolvedImage={resolvedSocialPreview.image}
              resolvedTitle={resolvedSocialPreview.title}
              resolvedDescription={resolvedSocialPreview.description}
              publicUrl={
                data.slug
                  ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${data.slug}`
                  : undefined
              }
            />
```

- [ ] **Step 6: Hydrate `socialPreview` on the edit page**

Modify `app/admin/save-the-dates/[id]/edit/page.tsx`. The `initialData` object literal is at lines 58–71. Add a new line at the end of the object literal (before the closing `}`):

```ts
    socialPreview:
      (item.socialPreview as import("@/lib/types").SocialPreview | null) ??
      undefined,
```

- [ ] **Step 7: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 8: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add app/admin/save-the-dates/SaveTheDateForm.tsx app/admin/save-the-dates/[id]/edit/page.tsx
git commit -m "feat(admin): add social preview section to save the date form"
```

---

## Task 11: Hydrate `socialPreview` on the invitation edit page

**Files:**
- Modify: `app/admin/invitations/[id]/edit/page.tsx`

- [ ] **Step 1: Map the new column into `initialData`**

In `app/admin/invitations/[id]/edit/page.tsx`, the `initialData` object literal is at lines 47–85. Add a new line at the end (before the closing `}`):

```ts
    socialPreview:
      (row.socialPreview as unknown as InvitationData["socialPreview"]) ??
      undefined,
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/admin/invitations/[id]/edit/page.tsx
git commit -m "feat(admin): hydrate socialPreview on invitation edit page"
```

---

## Task 12: End-to-end manual verification

This task is purely manual. No code changes. It exists to formally check the spec's verification checklist before declaring the feature done.

**Setup:**
- Ensure `NEXT_PUBLIC_SITE_URL` is set in your dev/staging environment to a publicly reachable HTTPS URL (e.g., a Vercel preview URL). Without a public URL the OG/Twitter unfurlers cannot fetch the page.
- Replace the placeholder `public/og-default.jpg` with a real 1200×630 branded asset before deploying to production.

- [ ] **Step 1: Invitation — custom social preview**

In the admin UI, edit an `external_link` invitation. Expand "Pré-visualização de partilha". Upload a 1200×630 image. Set a custom title and description. Save.

Then deploy / push to staging and unfurl the public URL via:
- WhatsApp (paste the URL into a chat)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [opengraph.xyz](https://opengraph.xyz)

Expected: All three show your uploaded image, your title, and your description.

- [ ] **Step 2: Invitation — fallback to heroImage**

Edit a `standard` invitation that has a `heroImage` set but no `socialPreview`. Save (no changes).

Unfurl the public URL. Expected: the unfurled card shows the `heroImage`, the couple-name title, and the event-type description.

- [ ] **Step 3: Invitation — fallback to default image**

Create or edit a fresh `external_link` invitation. Do NOT set `socialPreview.image`. Save.

Unfurl the public URL. Expected: the unfurled card shows the bundled `og-default.jpg`.

- [ ] **Step 4: Save the Date — custom social preview**

Edit a Save the Date. Upload a 1200×630 image in the new section. Set custom title and description. Save.

Unfurl `https://<host>/s/{slug}` via WhatsApp / Facebook Debugger / opengraph.xyz. Expected: uploaded image, custom title, custom description.

- [ ] **Step 5: Save the Date — fallback to bottomHero image**

Edit a Save the Date with `bottomHero.enabled === true && mediaType === "image"` and a non-empty `mediaUrl`. Clear any `socialPreview.image`. Save.

Unfurl. Expected: bottom-hero image appears in the unfurled card.

- [ ] **Step 6: Save the Date — fallback to default image**

Edit a Save the Date with `bottomHero` disabled or absent. Clear `socialPreview.image`. Save.

Unfurl. Expected: bundled `og-default.jpg` appears.

- [ ] **Step 7: Save the Date description consolidation**

For a Save the Date with no `socialPreview.description` set, view the unfurled card. Confirm the description matches the longer string from the resolver:

```
"<bride> & <groom> invite you to save the date: <date.display>"
```

This is the documented intentional consolidation (was `Save the date: <date.display>` previously in `openGraph.description` only).

- [ ] **Step 8: STD JSON sanitization regression**

Open the dev DB (e.g., `npm run db:studio`). For an existing `SaveTheDate`:
1. Save it from the admin UI without changes. Confirm: all JSON fields persisted unchanged.
2. Set `envelope.base = "#ffffff"` in the form, save, reload edit page. Confirm: the hex color is preserved (sanitizer must not strip non-empty strings).
3. Toggle `audio.enabled` from true to false on a record with a non-empty `audio.src`. Save. Confirm: behavior matches admin expectations (the src is stored as-is; the application layer honors the disabled flag).

Any regression here is a Task 6 bug — fix and re-verify.

- [ ] **Step 9: Final test + lint**

Run: `npm test && npm run lint && npx tsc --noEmit`
Expected: PASS for all three.

- [ ] **Step 10: Push and announce completion**

If everything passes:

```bash
git push origin <branch>
```

Announce the feature is ready for review. Include in the PR description:
- A reference to this plan and the spec.
- Note that `NEXT_PUBLIC_SITE_URL` is required in production.
- Note that the bundled `public/og-default.jpg` is currently a placeholder and should be replaced with a real branded 1200×630 asset.
