# Shared Custom Font Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one admin-wide, reusable custom font library with validated multi-variant uploads, safe lifecycle management, and support in every invitation and Save-the-Date font picker.

**Architecture:** Keep persisted font choices as CSS `font-family` strings and represent custom families with immutable `custom-font-<id>` tokens. Store families and variants relationally, validate uploads from a temporary S3 prefix, expose minimal public manifests and same-origin byte routes, and extend the existing dynamic font hooks to load generated `@font-face` rules.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7/Postgres, AWS S3 SDK v3, `fontkit`, Vitest, shadcn/ui, Axios.

## Global Constraints

- The library is shared admin-wide; there is no per-customer or per-invitation ownership.
- Supported uploads are WOFF2, WOFF, TTF, and OTF, unchanged; TTC and variable-axis controls are unsupported.
- Each file is limited to exactly 10 MB, verified against S3 bytes rather than browser metadata.
- Families support weights 100 through 900 and styles `normal` or `italic`.
- Existing theme and invitation font fields remain CSS strings; no backfill is allowed.
- Custom CSS identifiers are immutable and ID-based; admin-facing names may change.
- Variant replacement always requires explicit confirmation and updates every existing consumer.
- Archive hides a family from new choices but keeps existing invitations renderable.
- Permanent deletion is blocked while any persisted theme, invitation, hero block, or Save-the-Date value references the family.
- Public responses never expose S3 keys, original filenames, checksums, or diagnostic metadata.
- Font bytes are served through same-origin application routes with revisioned immutable caching.
- Uploads do not require a license confirmation and do not store license/source notes.
- Server components remain the default; client components are introduced only for interactive upload, picker, and library controls.
- Import Prisma only from `@/lib/db`; never construct another `PrismaClient`.
- Use `npm run build`, never `next build` directly.

---

## File Structure

### New domain and service files

- `lib/custom-fonts/types.ts` — shared source/category/style/format DTOs and API response shapes.
- `lib/custom-fonts/domain.ts` — pure identifier, stack, format, metadata-normalization, catalog-sort, and `@font-face` helpers.
- `lib/custom-fonts/parser.ts` — server-only `fontkit` parsing and checksum calculation.
- `lib/custom-fonts/storage.ts` — pending/permanent S3 key validation and font-specific storage orchestration.
- `lib/custom-fonts/usage.ts` — recursive CSS-token detection and persisted usage reporting.
- `lib/custom-fonts/admin-service.ts` — create/add/replace/archive/restore/delete operations.
- `lib/custom-fonts/public-service.ts` — minimal public manifest and byte lookup operations.

### New routes

- `app/api/admin/custom-fonts/presign/route.ts` — authenticated pending-font presign.
- `app/api/admin/custom-fonts/analyze/route.ts` — authenticated analysis and pending-upload cancellation.
- `app/api/admin/custom-fonts/route.ts` — custom-family list and creation.
- `app/api/admin/custom-fonts/[id]/route.ts` — rename/category/archive/restore/delete.
- `app/api/admin/custom-fonts/[id]/variants/route.ts` — add or explicitly replace a variant.
- `app/api/fonts/families/[id]/route.ts` — public rendering manifest.
- `app/api/fonts/files/[variantId]/route.ts` — public same-origin font bytes.

### New admin UI

- `components/admin/CustomFontUploadDialog.tsx` — reusable upload/analyze/correct/confirm flow.
- `components/admin/CustomFontLibrary.tsx` — family/variant management client.
- `app/admin/fonts/page.tsx` — authenticated library page.

### Existing files changed

- `prisma/schema.prisma` and a new migration — custom font persistence.
- `package.json` / `package-lock.json` — `fontkit` dependency.
- `lib/s3.ts` — bounded buffer, copy, and response-stream helpers.
- `hooks/useDynamicFont.ts` — custom manifest acquisition and style lifecycle.
- `components/admin/FontPicker.tsx` — unified sources and upload shortcut.
- `components/shared/DynamicFontLoader.tsx` — reuse the source-aware family loader.
- `app/admin/save-the-date-themes/SaveTheDateThemeForm.tsx` — replace raw font inputs.
- `components/admin/app-sidebar.tsx` — Fonts navigation.
- `README.md` — pending-prefix lifecycle and manual rollout requirement.

---

### Task 1: Persistence and pure custom-font domain

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260804220000_add_custom_font_library/migration.sql`
- Create: `lib/custom-fonts/types.ts`
- Create: `lib/custom-fonts/domain.ts`
- Test: `tests/custom-font-domain.test.ts`

**Interfaces:**
- Produces: `FontCategory`, `CustomFontFormat`, `CustomFontStyle`, `FontCatalogEntry`, `CustomFontManifest`, `buildCustomFontCssFamily(id)`, `buildCustomFontStack(id, category)`, `extractCustomFontFamilyId(stack)`, `detectFontFormat(bytes)`, `fontMimeType(format)`, `normalizeCustomFontName(name)`, and `buildCustomFontFaceCss(manifest)`.
- Consumes: no earlier feature interfaces.

- [ ] **Step 1: Write failing identifier, format, catalog, and CSS tests**

```ts
// tests/custom-font-domain.test.ts
import { describe, expect, it } from "vitest";
import {
  buildCustomFontCssFamily,
  buildCustomFontFaceCss,
  buildCustomFontStack,
  detectFontFormat,
  extractCustomFontFamilyId,
  normalizeCustomFontName,
  sortFontCatalog,
} from "@/lib/custom-fonts/domain";

describe("custom font domain", () => {
  it("round-trips an immutable custom family token", () => {
    expect(buildCustomFontCssFamily("family-1")).toBe("custom-font-family-1");
    expect(buildCustomFontStack("family-1", "handwriting")).toBe(
      "'custom-font-family-1', cursive",
    );
    expect(
      extractCustomFontFamilyId("'custom-font-family-1', cursive"),
    ).toBe("family-1");
    expect(extractCustomFontFamilyId("'Playfair Display', serif")).toBeNull();
  });

  it("normalizes names for case-insensitive duplicate detection", () => {
    expect(normalizeCustomFontName("  Minha   Fonte ")).toBe("minha fonte");
  });

  it.each([
    ["woff2", [0x77, 0x4f, 0x46, 0x32]],
    ["woff", [0x77, 0x4f, 0x46, 0x46]],
    ["ttf", [0x00, 0x01, 0x00, 0x00]],
    ["otf", [0x4f, 0x54, 0x54, 0x4f]],
  ] as const)("detects %s from bytes", (format, bytes) => {
    expect(detectFontFormat(Uint8Array.from(bytes))).toBe(format);
  });

  it("rejects collections and unknown headers", () => {
    expect(() =>
      detectFontFormat(Uint8Array.from([0x74, 0x74, 0x63, 0x66])),
    ).toThrow("Font collections are not supported");
    expect(() => detectFontFormat(Uint8Array.from([1, 2, 3, 4]))).toThrow(
      "Unsupported font format",
    );
  });

  it("puts active custom families before Google families", () => {
    const sorted = sortFontCatalog([
      { source: "google", family: "Lato", category: "sans-serif", value: "'Lato', sans-serif", builtin: false },
      { source: "custom", id: "f1", family: "Atelier", category: "display", value: "'custom-font-f1', serif", archived: false, variants: [] },
      { source: "builtin", family: "Inter", category: "sans-serif", value: "'Inter', sans-serif", builtin: true },
    ]);
    expect(sorted.map((font) => font.source)).toEqual([
      "custom",
      "builtin",
      "google",
    ]);
  });

  it("builds one revisioned face per variant", () => {
    const css = buildCustomFontFaceCss({
      id: "f1",
      cssFamily: "custom-font-f1",
      fallbackCategory: "display",
      revision: 4,
      variants: [
        { id: "v1", weight: 400, style: "normal", format: "woff2", revision: 2, url: "/api/fonts/files/v1?v=2" },
        { id: "v2", weight: 700, style: "italic", format: "otf", revision: 1, url: "/api/fonts/files/v2?v=1" },
      ],
    });
    expect(css).toContain("font-family: 'custom-font-f1'");
    expect(css).toContain("font-weight: 400");
    expect(css).toContain("font-style: italic");
    expect(css).toContain("format('opentype')");
    expect(css.match(/@font-face/g)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the domain test and confirm the missing-module failure**

Run: `npx vitest run tests/custom-font-domain.test.ts`

Expected: FAIL because `@/lib/custom-fonts/domain` does not exist.

- [ ] **Step 3: Add shared types and pure helpers**

```ts
// lib/custom-fonts/types.ts
export type FontCategory =
  | "serif"
  | "sans-serif"
  | "display"
  | "handwriting"
  | "monospace";
export type CustomFontFormat = "woff2" | "woff" | "ttf" | "otf";
export type CustomFontStyle = "normal" | "italic";

export interface CustomFontManifestVariant {
  id: string;
  weight: number;
  style: CustomFontStyle;
  format: CustomFontFormat;
  revision: number;
  url: string;
}

export interface CustomFontManifest {
  id: string;
  cssFamily: string;
  fallbackCategory: FontCategory;
  revision: number;
  variants: CustomFontManifestVariant[];
}

export interface CustomFontAnalysis {
  familyName: string;
  weight: number;
  style: CustomFontStyle;
  format: CustomFontFormat;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  metadata: Record<string, string | number | null>;
}

export interface AdminCustomFontVariant extends CustomFontManifestVariant {
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  metadata: Record<string, string | number | null>;
}

export interface AdminCustomFontFamily {
  id: string;
  family: string;
  cssFamily: string;
  category: FontCategory;
  value: string;
  revision: number;
  archived: boolean;
  variants: AdminCustomFontVariant[];
}

export type FontCatalogEntry =
  | {
      source: "builtin" | "google";
      family: string;
      category: FontCategory;
      value: string;
      builtin: boolean;
    }
  | {
      source: "custom";
      id: string;
      family: string;
      category: FontCategory;
      value: string;
      archived: boolean;
      variants: Array<{ weight: number; style: CustomFontStyle }>;
    };
```

Implement `lib/custom-fonts/domain.ts` with `CUSTOM_FONT_PREFIX = "custom-font-"`, exact header checks, generic fallback mapping (`display -> serif`, `handwriting -> cursive`), safe single-quote escaping for CSS identifiers, and deterministic variant sorting by weight then style. `buildCustomFontFaceCss` must map `woff2 -> woff2`, `woff -> woff`, `ttf -> truetype`, and `otf -> opentype`.

- [ ] **Step 4: Add Prisma models and migration**

```prisma
model CustomFontFamily {
  id               String   @id @default(uuid())
  name             String
  normalizedName   String   @unique
  cssFamily        String   @unique
  fallbackCategory String
  revision         Int      @default(1)
  archivedAt       DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  variants CustomFontVariant[]
}

model CustomFontVariant {
  id               String   @id @default(uuid())
  familyId         String
  family           CustomFontFamily @relation(fields: [familyId], references: [id], onDelete: Cascade)
  weight           Int
  style            String
  format           String
  objectKey        String   @unique
  originalFileName String
  mimeType         String
  sizeBytes        Int
  checksum         String
  metadata         Json
  revision         Int      @default(1)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([familyId, weight, style])
  @@index([familyId])
}
```

Generate the migration with `npm run db:migrate:dev -- --name add_custom_font_library`, then edit the generated SQL to add explicit check constraints for `weight BETWEEN 100 AND 900`, supported styles, supported formats, and supported fallback categories; Prisma does not emit these application-level string constraints automatically. Keep the generated timestamp if Prisma chooses a timestamp different from the planned path.

- [ ] **Step 5: Regenerate Prisma and rerun the focused test**

Run: `npm run db:generate && npx vitest run tests/custom-font-domain.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the persistence foundation**

```bash
git add prisma/schema.prisma prisma/migrations lib/custom-fonts/types.ts lib/custom-fonts/domain.ts tests/custom-font-domain.test.ts
git commit -m "feat: add custom font persistence domain"
```

---

### Task 2: Font parsing and bounded S3 storage

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `lib/s3.ts`
- Create: `lib/custom-fonts/parser.ts`
- Create: `lib/custom-fonts/storage.ts`
- Test: `tests/custom-font-parser.test.ts`
- Test: `tests/custom-font-storage.test.ts`

**Interfaces:**
- Consumes: `CustomFontFormat`, `CustomFontStyle`, `detectFontFormat`, and `fontMimeType` from Task 1.
- Produces: `analyzeFontBuffer(buffer) -> CustomFontAnalysis`, `readFontObject(key)`, `copyPendingFontToPermanent(...)`, `deletePendingFont(key)`, `isPendingFontKey(key)`, `getObjectBufferLimited(key, maxBytes)`, `copyObject(sourceKey, destinationKey, contentType)`, and `getObjectStream(key)`.

- [ ] **Step 1: Install the parser dependency**

Run: `npm install fontkit`

Expected: `fontkit` is added to dependencies and the lockfile resolves without peer errors.

- [ ] **Step 2: Write failing parser and key-safety tests**

```ts
// tests/custom-font-parser.test.ts
import { describe, expect, it } from "vitest";
import { normalizeParsedMetadata } from "@/lib/custom-fonts/parser";

describe("custom font metadata", () => {
  it("normalizes an italic bold face", () => {
    expect(
      normalizeParsedMetadata({
        familyName: "  Atelier  ",
        subfamilyName: "Bold Italic",
        weightClass: 700,
        italicAngle: -12,
        postscriptName: "Atelier-BoldItalic",
      }),
    ).toMatchObject({ familyName: "Atelier", weight: 700, style: "italic" });
  });

  it("clamps malformed weight metadata to regular", () => {
    expect(
      normalizeParsedMetadata({ familyName: "Atelier", weightClass: 0 }),
    ).toMatchObject({ weight: 400, style: "normal" });
  });

  it("rejects an empty family name", () => {
    expect(() =>
      normalizeParsedMetadata({ familyName: "   ", weightClass: 400 }),
    ).toThrow("Font family metadata is missing");
  });
});
```

```ts
// tests/custom-font-storage.test.ts
import { describe, expect, it } from "vitest";
import {
  buildPermanentFontKey,
  isPendingFontKey,
} from "@/lib/custom-fonts/storage";

describe("custom font storage keys", () => {
  it("accepts only direct pending-font keys", () => {
    expect(isPendingFontKey("uploads/fonts/pending/uuid-face.woff2")).toBe(true);
    expect(isPendingFontKey("uploads/images/face.woff2")).toBe(false);
    expect(isPendingFontKey("uploads/fonts/pending/../secret")).toBe(false);
  });

  it("builds a random permanent key below its family", () => {
    expect(buildPermanentFontKey("f1", "woff2", "fixed-id")).toBe(
      "uploads/fonts/f1/fixed-id.woff2",
    );
  });
});
```

- [ ] **Step 3: Run the tests and confirm missing exports**

Run: `npx vitest run tests/custom-font-parser.test.ts tests/custom-font-storage.test.ts`

Expected: FAIL because parser/storage modules do not exist.

- [ ] **Step 4: Add bounded S3 primitives**

Extend `lib/s3.ts` with `CopyObjectCommand` and these exact public boundaries:

```ts
export async function getObjectBufferLimited(
  key: string,
  maxBytes: number,
): Promise<Buffer>;

export async function copyObject(
  sourceKey: string,
  destinationKey: string,
  contentType: string,
): Promise<void>;

export interface S3ObjectStream {
  body: ReadableStream<Uint8Array>;
  contentLength: number | null;
}

export async function getObjectStream(key: string): Promise<S3ObjectStream>;
```

`getObjectBufferLimited` must pipe the AWS web stream through the existing `createByteLimitTransform` before collecting chunks. `copyObject` must URL-encode each source-key segment in `CopySource` and replace metadata with the validated content type. `getObjectStream` must throw when S3 returns no body and must not expose the AWS response object.

- [ ] **Step 5: Implement font parsing and storage orchestration**

```ts
// lib/custom-fonts/parser.ts
import { createHash } from "node:crypto";
import fontkit from "fontkit";
import { detectFontFormat, fontMimeType } from "./domain";
import type { CustomFontAnalysis, CustomFontStyle } from "./types";

export function normalizeParsedMetadata(input: {
  familyName?: string | null;
  subfamilyName?: string | null;
  postscriptName?: string | null;
  weightClass?: number | null;
  italicAngle?: number | null;
}) {
  const familyName = input.familyName?.trim().replace(/\s+/g, " ") ?? "";
  if (!familyName) throw new Error("Font family metadata is missing");
  const weight =
    input.weightClass && input.weightClass >= 100 && input.weightClass <= 900
      ? Math.round(input.weightClass)
      : 400;
  const style: CustomFontStyle =
    (input.italicAngle ?? 0) !== 0 || /italic|oblique/i.test(input.subfamilyName ?? "")
      ? "italic"
      : "normal";
  return { familyName, weight, style };
}
```

`analyzeFontBuffer` must call `detectFontFormat`, call `fontkit.create(buffer)`, reject a collection result, read `familyName`, `subfamilyName`, `postscriptName`, OS/2 `usWeightClass`, and `italicAngle` through a small typed adapter, then return normalized metadata plus SHA-256. Keep the adapter isolated so a future `fontkit` type change affects one function.

`lib/custom-fonts/storage.ts` must define `FONT_MAX_BYTES = 10 * 1024 * 1024`, accept only `uploads/fonts/pending/<safe-name>`, build permanent names from `crypto.randomUUID()` plus the server-detected format extension, and provide best-effort cleanup helpers that log keys without logging credentials or presigned URLs.

- [ ] **Step 6: Run parser, storage, and existing stream-limit tests**

Run: `npx vitest run tests/custom-font-parser.test.ts tests/custom-font-storage.test.ts tests/s3-stream-limit.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit parsing and storage**

```bash
git add package.json package-lock.json lib/s3.ts lib/custom-fonts/parser.ts lib/custom-fonts/storage.ts tests/custom-font-parser.test.ts tests/custom-font-storage.test.ts tests/s3-stream-limit.test.ts
git commit -m "feat: validate and store custom font uploads"
```

---

### Task 3: Usage detection and lifecycle service

**Files:**
- Create: `lib/custom-fonts/usage.ts`
- Create: `lib/custom-fonts/admin-service.ts`
- Test: `tests/custom-font-usage.test.ts`
- Test: `tests/custom-font-admin-service.test.ts`

**Interfaces:**
- Consumes: Task 1 domain/types and Task 2 parser/storage functions.
- Produces: `containsCssFamily(value, cssFamily)`, `findCustomFontUsages(cssFamily)`, `listCustomFontFamilies(query)`, `createCustomFontFamily(input)`, `addCustomFontVariant(familyId, input)`, `updateCustomFontFamily(id, input)`, and `deleteCustomFontFamily(id)`.

- [ ] **Step 1: Write failing recursive-usage tests**

```ts
// tests/custom-font-usage.test.ts
import { describe, expect, it } from "vitest";
import { containsCssFamily } from "@/lib/custom-fonts/usage";

describe("containsCssFamily", () => {
  const cssFamily = "custom-font-family-1";

  it("finds tokens nested in text styles and hero blocks", () => {
    expect(
      containsCssFamily(
        {
          fonts: { display: `'${cssFamily}', serif` },
          blocks: [{ fontFamily: `'${cssFamily}', serif` }],
        },
        cssFamily,
      ),
    ).toBe(true);
  });

  it("does not match a prefix collision", () => {
    expect(
      containsCssFamily(`'${cssFamily}-other', serif`, cssFamily),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Write failing service tests with hoisted Prisma/S3 mocks**

```ts
// tests/custom-font-admin-service.test.ts (core cases)
it("returns replacement_required without mutating an occupied slot", async () => {
  db.variantFindUnique.mockResolvedValue({ id: "old", objectKey: "old-key" });
  await expect(
    addCustomFontVariant("f1", {
      pendingKey: "uploads/fonts/pending/new.woff2",
      weight: 400,
      style: "normal",
      replace: false,
    }),
  ).rejects.toMatchObject({ code: "replacement_required" });
  expect(storage.copyPendingFontToPermanent).not.toHaveBeenCalled();
});

it("switches the database before deleting the replaced object", async () => {
  const result = await addCustomFontVariant("f1", {
    pendingKey: "uploads/fonts/pending/new.woff2",
    weight: 400,
    style: "normal",
    replace: true,
  });
  expect(result.variant.revision).toBe(2);
  expect(db.transaction.mock.invocationCallOrder[0]).toBeLessThan(
    storage.deleteObject.mock.invocationCallOrder[0],
  );
});

it("blocks deletion and returns concrete usages", async () => {
  db.themeFindMany.mockResolvedValue([{ id: "t1", name: "rose" }]);
  await expect(deleteCustomFontFamily("f1")).rejects.toMatchObject({
    code: "font_in_use",
    usages: [{ kind: "theme", id: "t1", label: "rose" }],
  });
  expect(db.familyDelete).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Run the focused tests and confirm failures**

Run: `npx vitest run tests/custom-font-usage.test.ts tests/custom-font-admin-service.test.ts`

Expected: FAIL because the usage and service modules do not exist.

- [ ] **Step 4: Implement exact token matching and persisted usage reporting**

`containsCssFamily` must recurse through arrays and plain objects, and for strings must extract quoted/bare CSS family members rather than use substring matching. `findCustomFontUsages` must query only these fields:

```ts
type CustomFontUsage = {
  kind: "theme" | "invitation" | "save-the-date-theme" | "save-the-date";
  id: string;
  label: string;
};
```

- Theme: `id`, `name`, and all five font columns.
- Invitation: `id`, `slug`, `textStyles`, and `heroTextLayer`.
- Save-the-Date theme: `id`, `name`, and all three font columns.
- Save-the-Date: `id`, `slug`, and `textStyles`.

Return one usage per record even if several fields match, sorted by kind then label.

- [ ] **Step 5: Implement family creation, addition, replacement, archive, and deletion**

Use these input boundaries:

```ts
export interface CommitVariantInput {
  pendingKey: string;
  weight: number;
  style: CustomFontStyle;
  replace: boolean;
  expectedChecksum: string;
  originalFileName: string;
}

export interface CreateCustomFontFamilyInput extends CommitVariantInput {
  name: string;
  fallbackCategory: FontCategory;
}

export interface UpdateCustomFontFamilyInput {
  name?: string;
  fallbackCategory?: FontCategory;
  archived?: boolean;
}
```

For creation, generate the family ID with `crypto.randomUUID()`, derive `cssFamily` from it, re-read/re-parse the pending object, compare `expectedChecksum`, copy to the permanent key, and create family plus variant in one Prisma transaction. On transaction failure delete the newly copied object. On success delete the pending key.

For addition/replacement, load the family including the occupied slot, reject missing families, require `replace: true` for an occupied slot, revalidate and copy first, then transactionally create/update the variant and increment `family.revision`. Archived families remain manageable even though pickers hide them. Delete the old permanent object only after commit. Map Prisma `P2002` normalized-name collisions to a `duplicate_family` domain error.

For deletion, obtain usages before mutation. If empty, load all object keys, delete the family in a transaction, then `Promise.allSettled` the S3 deletions and log rejected keys. Archive/restore only updates `archivedAt`; name/category changes normalize the name and increment family revision.

- [ ] **Step 6: Run lifecycle tests**

Run: `npx vitest run tests/custom-font-usage.test.ts tests/custom-font-admin-service.test.ts`

Expected: PASS, including copy-before-commit, rollback cleanup, explicit replacement, and delete blocking.

- [ ] **Step 7: Commit lifecycle services**

```bash
git add lib/custom-fonts/usage.ts lib/custom-fonts/admin-service.ts tests/custom-font-usage.test.ts tests/custom-font-admin-service.test.ts
git commit -m "feat: manage custom font lifecycle"
```

---

### Task 4: Authenticated custom-font APIs

**Files:**
- Modify: `lib/s3.ts`
- Create: `app/api/admin/custom-fonts/presign/route.ts`
- Create: `app/api/admin/custom-fonts/analyze/route.ts`
- Create: `app/api/admin/custom-fonts/route.ts`
- Create: `app/api/admin/custom-fonts/[id]/route.ts`
- Create: `app/api/admin/custom-fonts/[id]/variants/route.ts`
- Test: `tests/custom-font-admin-routes.test.ts`

**Interfaces:**
- Consumes: Task 2 storage/parser and Task 3 service inputs/errors.
- Produces: stable JSON contracts consumed by `CustomFontUploadDialog` and `CustomFontLibrary`.

- [ ] **Step 1: Write failing route-contract tests**

Use `vi.hoisted` mocks following `tests/invitation-duplicate-route.test.ts`. Cover these exact responses:

```ts
expect((await presign({ fileName: "face.woff2", fileType: "font/woff2", fileSize: 1024 })).status).toBe(200);
expect((await presign({ fileName: "face.ttc", fileType: "font/collection", fileSize: 1024 })).status).toBe(400);
expect((await presign({ fileName: "huge.otf", fileType: "font/otf", fileSize: 10 * 1024 * 1024 + 1 })).status).toBe(413);

expect(await (await analyze({ pendingKey: "uploads/fonts/pending/a.woff2" })).json()).toMatchObject({
  familyName: "Atelier",
  weight: 400,
  style: "normal",
  checksum: "sha256",
});

expect((await createFamily(validCreateBody)).status).toBe(201);
expect((await addVariant("f1", occupiedBody)).status).toBe(409);
expect(await (await removeFamily("f1")).json()).toMatchObject({
  code: "font_in_use",
  usages: expect.any(Array),
});
```

- [ ] **Step 2: Run the route test and confirm missing-route failures**

Run: `npx vitest run tests/custom-font-admin-routes.test.ts`

Expected: FAIL because the route modules do not exist.

- [ ] **Step 3: Add a font-specific presign boundary**

Extend `generatePresignedUploadUrl`'s folder type so it accepts the literal `"fonts/pending"`; do not add fonts to the general `/api/upload/presign` allowlist. The new admin presign route accepts these MIME values only:

```ts
const FONT_MIME_TYPES = new Set([
  "font/woff2",
  "font/woff",
  "font/ttf",
  "font/otf",
  "application/font-woff",
  "application/x-font-ttf",
  "application/x-font-opentype",
  "application/octet-stream",
]);
```

It must also require a `.woff2`, `.woff`, `.ttf`, or `.otf` filename and `fileSize <= FONT_MAX_BYTES`. Return `{ presignedUrl, pendingKey: key }`; omit `publicUrl`.

- [ ] **Step 4: Implement analysis and cancellation handlers**

```ts
export async function POST(request: NextRequest) {
  const { pendingKey } = await request.json();
  if (!isPendingFontKey(pendingKey)) {
    return NextResponse.json({ code: "invalid_pending_key", error: "Invalid pending font key" }, { status: 400 });
  }
  try {
    return NextResponse.json(await analyzePendingFont(pendingKey));
  } catch (error) {
    return customFontErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  const { pendingKey } = await request.json();
  if (!isPendingFontKey(pendingKey)) return new NextResponse(null, { status: 204 });
  await deletePendingFont(pendingKey);
  return new NextResponse(null, { status: 204 });
}
```

Centralize domain-error-to-status mapping in `admin-service.ts`: invalid input `400`, not found `404`, duplicate/replacement/in-use `409`, too large `413`, and unknown storage/database errors `500` with a generic message.

- [ ] **Step 5: Implement list/create/update/variant/delete handlers**

Use this route mapping without accepting arbitrary Prisma data:

| Route | Method | Service call |
|---|---|---|
| `/api/admin/custom-fonts` | GET | `listCustomFontFamilies({ search, archived, page, limit })` |
| `/api/admin/custom-fonts` | POST | `createCustomFontFamily(parsedBody)` |
| `/api/admin/custom-fonts/[id]` | GET | Return one admin family DTO, including archived records |
| `/api/admin/custom-fonts/[id]` | PATCH | `updateCustomFontFamily(id, parsedBody)` |
| `/api/admin/custom-fonts/[id]` | DELETE | `deleteCustomFontFamily(id)` |
| `/api/admin/custom-fonts/[id]/variants` | POST | `addCustomFontVariant(id, parsedBody)` |

Clamp list pages to at least 1 and limits to 1–100. Validate category/style/weight with explicit allowlists. Reject empty update bodies. Return admin DTOs without `objectKey`; keep filename/checksum/diagnostics only on authenticated responses.

- [ ] **Step 6: Run admin route tests**

Run: `npx vitest run tests/custom-font-admin-routes.test.ts tests/custom-font-admin-service.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit authenticated APIs**

```bash
git add lib/s3.ts app/api/admin/custom-fonts tests/custom-font-admin-routes.test.ts
git commit -m "feat: expose custom font admin APIs"
```

---

### Task 5: Public manifests, same-origin bytes, and dynamic loading

**Files:**
- Create: `lib/custom-fonts/public-service.ts`
- Create: `app/api/fonts/families/[id]/route.ts`
- Create: `app/api/fonts/files/[variantId]/route.ts`
- Modify: `hooks/useDynamicFont.ts`
- Modify: `components/shared/DynamicFontLoader.tsx`
- Test: `tests/custom-font-public-routes.test.ts`
- Test: `tests/custom-font-loader.test.ts`

**Interfaces:**
- Consumes: `CustomFontManifest`, `extractCustomFontFamilyId`, `buildCustomFontFaceCss`, Prisma custom-font records, and `getObjectStream`.
- Produces: `GET /api/fonts/families/:id`, `GET /api/fonts/files/:variantId`, source-aware `useDynamicFont(s)` with unchanged public hook signatures, and `invalidateCustomFontManifest(familyId)`.

- [ ] **Step 1: Write failing public-contract and loader-state tests**

```ts
it("returns an archived family manifest without admin metadata", async () => {
  db.familyFindUnique.mockResolvedValue({
    id: "f1",
    name: "Private admin name",
    cssFamily: "custom-font-f1",
    fallbackCategory: "display",
    revision: 3,
    archivedAt: new Date(),
    variants: [{ id: "v1", weight: 400, style: "normal", format: "woff2", revision: 2 }],
  });
  const response = await getFamily("f1");
  const body = await response.json();
  expect(body).toEqual({
    id: "f1",
    cssFamily: "custom-font-f1",
    fallbackCategory: "display",
    revision: 3,
    variants: [{ id: "v1", weight: 400, style: "normal", format: "woff2", revision: 2, url: "/api/fonts/files/v1?v=2" }],
  });
  expect(JSON.stringify(body)).not.toContain("Private admin name");
  expect(response.headers.get("etag")).toBe('"font-family-f1-3"');
  expect(response.headers.get("cache-control")).toBe(
    "public, max-age=0, must-revalidate",
  );
  expect(
    (await getFamily("f1", { "if-none-match": '"font-family-f1-3"' })).status,
  ).toBe(304);
});

it("streams registered bytes with immutable caching", async () => {
  const response = await getFile("v1");
  expect(response.headers.get("content-type")).toBe("font/woff2");
  expect(response.headers.get("cache-control")).toBe(
    "public, max-age=31536000, immutable",
  );
});
```

In `tests/custom-font-loader.test.ts`, test pure exported `customFontLoadKey(manifest)`, `classifyFontFamily(stack)`, and `uniqueCustomFontIds(stacks)` so no DOM environment is required. Assert that duplicate custom stacks return one family ID and that revision changes alter the load key.

- [ ] **Step 2: Run tests and confirm missing public modules**

Run: `npx vitest run tests/custom-font-public-routes.test.ts tests/custom-font-loader.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement minimal public services and routes**

`getCustomFontManifest(id)` selects only `id`, `cssFamily`, `fallbackCategory`, `revision`, and variant `id/weight/style/format/revision`, ordered by weight/style. It returns archived families and constructs each URL as `/api/fonts/files/${id}?v=${revision}`.

The manifest route returns `404` for an unknown family, sets `ETag: "font-family-<id>-<revision>"`, honors a matching `If-None-Match` with `304`, and uses:

```text
Cache-Control: public, max-age=0, must-revalidate
```

The byte route selects only `objectKey`, `mimeType`, and `sizeBytes`, obtains `getObjectStream`, and returns a streaming `Response`. Set immutable caching and `Content-Length` when S3 provides it. Map unknown database rows or S3 missing keys to a generic 404.

- [ ] **Step 4: Refactor the loader into source-aware acquisition**

Preserve `useDynamicFont(family, weights?)` and `useDynamicFonts(families)` signatures. Split module state into Google links and custom-family records:

```ts
type CustomLoadState = {
  refs: number;
  revision?: number;
  promise?: Promise<void>;
  style?: HTMLStyleElement;
};
const customLoads = new Map<string, CustomLoadState>();
const manifestCache = new Map<string, CustomFontManifest>();
```

On acquire:

1. Classify the bare family.
2. Built-in: return.
3. Google: keep the existing link/ref-count behavior.
4. Custom: increment refs, fetch `/api/fonts/families/<id>` once, build CSS, and append a `<style id="custom-font-style-<id>">` only if refs remain above zero.

On release, decrement refs and remove the custom style when it reaches zero. If release occurs before fetch resolution, the resolved promise must not append a style. Failed fetches clear the promise so a later acquire can retry and log only the family ID/status.

Export `invalidateCustomFontManifest(familyId)` for authenticated mutations. It removes the cached manifest/style and reacquires the family immediately when its ref count remains positive; this makes a replacement visible in the current admin session without a reload.

Deduplicate identical family stacks inside `useDynamicFonts` before acquiring them. Keep Google weight behavior unchanged.

- [ ] **Step 5: Run public and regression tests**

Run: `npx vitest run tests/custom-font-public-routes.test.ts tests/custom-font-loader.test.ts tests/hero-text.test.ts tests/text-styles-places.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit public loading**

```bash
git add lib/custom-fonts/public-service.ts app/api/fonts hooks/useDynamicFont.ts components/shared/DynamicFontLoader.tsx tests/custom-font-public-routes.test.ts tests/custom-font-loader.test.ts
git commit -m "feat: load custom fonts on public pages"
```

---

### Task 6: Unified picker and reusable upload dialog

**Files:**
- Create: `components/admin/CustomFontUploadDialog.tsx`
- Modify: `components/admin/FontPicker.tsx`
- Modify: `lib/custom-fonts/domain.ts`
- Test: `tests/custom-font-catalog.test.ts`

**Interfaces:**
- Consumes: Task 4 admin JSON contracts, Task 5 source-aware loader, and `FontCatalogEntry`.
- Produces: `CustomFontUploadDialog({ open, onOpenChange, family?, onSaved })` and a backward-compatible `FontPicker` with the existing props.

- [ ] **Step 1: Write failing catalog merge/filter tests**

```ts
import { describe, expect, it } from "vitest";
import { filterFontCatalog, mergeFontCatalog } from "@/lib/custom-fonts/domain";

it("shows active custom fonts first and retains an archived selection", () => {
  const result = mergeFontCatalog({
    custom: [activeCustom],
    google: [googleFont],
    selected: archivedCustom,
  });
  expect(result.map((font) => font.family)).toEqual([
    archivedCustom.family,
    activeCustom.family,
    googleFont.family,
  ]);
});

it("filters by source, category, and normalized search", () => {
  expect(
    filterFontCatalog([activeCustom, googleFont], {
      source: "custom",
      category: "display",
      search: "atelier",
    }),
  ).toEqual([activeCustom]);
});
```

- [ ] **Step 2: Run the catalog test and confirm missing helper failures**

Run: `npx vitest run tests/custom-font-catalog.test.ts`

Expected: FAIL.

- [ ] **Step 3: Add deterministic catalog merge/filter helpers**

Implement `mergeFontCatalog` so the archived selected entry appears once at the top, followed by active custom, built-in, and Google entries. Implement normalized name/category/source filtering without mutating inputs. Adapt Google API responses to `FontCatalogEntry` at the `FontPicker` boundary; do not change the public Google Fonts library API in this task.

- [ ] **Step 4: Build the reusable upload state machine**

```ts
type UploadState =
  | { status: "idle" }
  | { status: "uploading"; file: File; progress: number }
  | { status: "analyzing"; file: File; pendingKey: string }
  | { status: "editing"; file: File; pendingKey: string; analysis: CustomFontAnalysis; form: UploadForm }
  | { status: "saving"; file: File; pendingKey: string; analysis: CustomFontAnalysis; form: UploadForm }
  | { status: "error"; file?: File; pendingKey?: string; message: string; recoverTo: "idle" | "editing" };
```

The dialog must:

- accept `.woff2,.woff,.ttf,.otf` and reject client-observed files over 10 MB;
- POST presign metadata, PUT via Axios with progress, then POST the pending key to analyze;
- prefill name/weight/style and let the admin edit name, category, weight, and style;
- support a new family or a preset existing family;
- submit `expectedChecksum` from analysis;
- on `replacement_required`, render the occupied slot summary and require an explicit Replace button that resubmits with `replace: true`;
- call `DELETE /api/admin/custom-fonts/analyze` on cancel after a pending key exists;
- retain `file`, pending key, analysis, and corrections for recoverable save failures;
- call `invalidateCustomFontManifest(family.id)` after adding or replacing a variant;
- call `onSaved(family)` and reset only after a successful response.

- [ ] **Step 5: Upgrade `FontPicker` without changing its callers**

Keep `{ label, value, onChange, optional }`. Add source tabs All/Custom/Google above existing category tabs, fetch active custom families from `/api/admin/custom-fonts?limit=100`, and fetch Google pages from the current endpoint. When `value` contains a custom ID absent from the active response, fetch `/api/admin/custom-fonts/<id>` and retain that archived family only as the current selection. Use each catalog entry's `value` rather than rebuilding custom stacks in the component.

Each visible row calls `useDynamicFont(font.value)` through a small row component so custom previews acquire their manifest. Preserve lazy Google loading or replace it with the same visible-row observer, but never eagerly load the entire Google catalog. Show variant labels such as `400`, `700 italic`, an Optimized badge for built-ins, and an Archived badge only for the retained current selection.

Add an Upload font button that opens `CustomFontUploadDialog`; after save, merge the returned family into state, call `onChange(family.value)`, and close both dialog and picker.

- [ ] **Step 6: Run catalog and existing font-consumer tests**

Run: `npx vitest run tests/custom-font-catalog.test.ts tests/hero-text.test.ts tests/hero-text-editor.test.ts tests/text-styles-places.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit picker/upload UX**

```bash
git add components/admin/CustomFontUploadDialog.tsx components/admin/FontPicker.tsx lib/custom-fonts/domain.ts tests/custom-font-catalog.test.ts
git commit -m "feat: select and upload custom fonts"
```

---

### Task 7: Admin font library management

**Files:**
- Create: `app/admin/fonts/page.tsx`
- Create: `components/admin/CustomFontLibrary.tsx`
- Modify: `components/admin/app-sidebar.tsx`
- Modify: `lib/custom-fonts/domain.ts`
- Test: `tests/custom-font-library.test.ts`

**Interfaces:**
- Consumes: Task 4 admin APIs and Task 6 upload dialog.
- Produces: the `/admin/fonts` management surface and Fonts sidebar link.

- [ ] **Step 1: Write failing library view-model tests**

```ts
import { describe, expect, it } from "vitest";
import { buildFontLibraryRows } from "@/lib/custom-fonts/domain";

it("groups variants by weight and style and exposes legal actions", () => {
  expect(buildFontLibraryRows([familyWithVariants])).toEqual([
    expect.objectContaining({
      id: "f1",
      variantLabels: ["400 normal", "700 italic"],
      actions: ["rename", "add-variant", "archive", "delete"],
    }),
  ]);
});

it("offers restore instead of archive for archived families", () => {
  expect(buildFontLibraryRows([archivedFamily])[0].actions).toEqual([
    "rename",
    "add-variant",
    "restore",
    "delete",
  ]);
});
```

- [ ] **Step 2: Run the test and confirm the missing-helper failure**

Run: `npx vitest run tests/custom-font-library.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement the library page and client state**

`app/admin/fonts/page.tsx` renders the heading and `CustomFontLibrary`; let the client fetch `/api/admin/custom-fonts?archived=all&limit=100` so archive/restore mutations do not require server-component data plumbing.

`CustomFontLibrary` must render:

- debounced search and Active/Archived/All filter;
- one family card or table row with actual-font sample, category, status, and sorted variant chips;
- Add family opening the shared dialog without a preset family;
- Add variant opening it with the selected family;
- rename/category edit dialog using PATCH;
- archive/restore confirmation using PATCH `{ archived: true|false }`;
- permanent-delete confirmation using DELETE;
- blocked-delete alert listing returned usage kind and label;
- success/error toasts and local refetch after every mutation.

Use existing shadcn `Table`, `Dialog`, `AlertDialog`, `Badge`, `Button`, `Input`, and `Select`. The family preview row must call `useDynamicFont(family.value)` only while rendered.

- [ ] **Step 4: Add sidebar navigation**

Add `Type` from Lucide and this `navMain` entry:

```ts
{
  title: "Fontes",
  url: "/admin/fonts",
  icon: Type,
}
```

Change active matching to `pathname === item.url || pathname.startsWith(item.url + "/")` so future font detail routes also highlight correctly.

- [ ] **Step 5: Run the library test and lint changed UI files**

Run: `npx vitest run tests/custom-font-library.test.ts && npx eslint app/admin/fonts/page.tsx components/admin/CustomFontLibrary.tsx components/admin/CustomFontUploadDialog.tsx components/admin/FontPicker.tsx components/admin/app-sidebar.tsx`

Expected: PASS with no lint errors.

- [ ] **Step 6: Commit the library UI**

```bash
git add app/admin/fonts/page.tsx components/admin/CustomFontLibrary.tsx components/admin/app-sidebar.tsx lib/custom-fonts/domain.ts tests/custom-font-library.test.ts
git commit -m "feat: add admin custom font library"
```

---

### Task 8: Save-the-Date integration, deployment notes, and full verification

**Files:**
- Modify: `app/admin/save-the-date-themes/SaveTheDateThemeForm.tsx`
- Modify: `README.md`
- Test: `tests/custom-font-save-the-date.test.ts`

**Interfaces:**
- Consumes: backward-compatible `FontPicker` and source-aware `useDynamicFonts`.
- Produces: custom-font selection and live preview for all three Save-the-Date theme roles.

- [ ] **Step 1: Write a failing Save-the-Date integration guard**

```ts
// tests/custom-font-save-the-date.test.ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Save-the-Date custom font integration", () => {
  const source = readFileSync(
    "app/admin/save-the-date-themes/SaveTheDateThemeForm.tsx",
    "utf8",
  );

  it("uses the shared picker for every typography role", () => {
    expect(source.match(/<FontPicker/g)).toHaveLength(3);
    expect(source).toContain('value={data.titleFont}');
    expect(source).toContain('value={data.coupleFont}');
    expect(source).toContain('value={data.dateFont}');
  });

  it("acquires all three fonts for the live preview", () => {
    expect(source).toContain(
      "useDynamicFonts([data.titleFont, data.coupleFont, data.dateFont])",
    );
  });
});
```

- [ ] **Step 2: Run the guard and confirm it fails**

Run: `npx vitest run tests/custom-font-save-the-date.test.ts`

Expected: FAIL because the form still uses three raw `Input` controls and does not load preview families.

- [ ] **Step 3: Replace raw inputs and load preview variants**

Import `FontPicker` and `useDynamicFonts`. At the top of `STDContentPreview`, call:

```ts
useDynamicFonts([data.titleFont, data.coupleFont, data.dateFont]);
```

Replace the three raw typography inputs with:

```tsx
<FontPicker
  label="Fonte do Título"
  value={data.titleFont}
  onChange={(value) => update("titleFont", value)}
/>
<FontPicker
  label="Fonte do Casal"
  value={data.coupleFont}
  onChange={(value) => update("coupleFont", value)}
/>
<FontPicker
  label="Fonte da Data"
  value={data.dateFont}
  onChange={(value) => update("dateFont", value)}
/>
```

Keep persisted request fields unchanged.

- [ ] **Step 4: Document the production storage requirement**

Add a README deployment note specifying an S3 lifecycle expiration of one day for prefix `uploads/fonts/pending/`, the 10 MB file limit, and the requirement that the application role can `GetObject`, `PutObject`, and `DeleteObject` below `uploads/fonts/`; the AWS SDK `CopyObject` operation is authorized through source `GetObject` plus destination `PutObject`. State that no public-bucket font CORS change is required because clients use `/api/fonts/files/:variantId`.

- [ ] **Step 5: Run all focused custom-font tests**

Run: `npx vitest run tests/custom-font-domain.test.ts tests/custom-font-parser.test.ts tests/custom-font-storage.test.ts tests/custom-font-usage.test.ts tests/custom-font-admin-service.test.ts tests/custom-font-admin-routes.test.ts tests/custom-font-public-routes.test.ts tests/custom-font-loader.test.ts tests/custom-font-catalog.test.ts tests/custom-font-library.test.ts tests/custom-font-save-the-date.test.ts`

Expected: PASS.

- [ ] **Step 6: Run complete automated verification**

Run: `npm test`

Expected: all Vitest files pass.

Run: `npm run lint`

Expected: exit 0 with no ESLint errors.

Run: `npm run typecheck`

Expected: exit 0 with no TypeScript errors.

Run: `npm run build`

Expected: Prisma generation and migration deployment complete, followed by a successful Next.js production build. Run this only with the intended development/production-like database environment configured, because the repository build command deploys migrations.

- [ ] **Step 7: Perform the manual acceptance matrix**

Verify in current Chrome, Safari, and Firefox:

1. Upload one valid file of each supported format and one rejected TTC/corrupt file.
2. Correct detected family/weight/style before saving.
3. Add 400 normal, 700 normal, and 700 italic to one family.
4. Select the family in a theme role, inline text toolbar, hero text block, and each Save-the-Date theme role.
5. Open public invitation and Save-the-Date URLs in a cold/private window and confirm the Network panel uses same-origin manifest/file URLs.
6. Replace 400 normal, reload an existing public invitation, and confirm the revisioned URL and new appearance.
7. Archive the family, confirm it disappears from new searches, and confirm existing pages/editor selections still render with an Archived badge.
8. Attempt deletion while referenced and verify the blocking records are named.
9. Remove all references, permanently delete, and verify the family and objects no longer resolve.
10. Interrupt an upload, retry while the pending key is valid, and cancel another upload to exercise cleanup.

- [ ] **Step 8: Commit final integration and documentation**

```bash
git add app/admin/save-the-date-themes/SaveTheDateThemeForm.tsx README.md tests/custom-font-save-the-date.test.ts
git commit -m "feat: complete custom font integration"
```

---

## Execution Notes

- Before Task 1, confirm the working tree is clean and create an isolated feature worktree using `superpowers:using-git-worktrees` if execution is not already isolated.
- Do not configure the S3 lifecycle rule from application code. Record the exact production configuration change in the deployment handoff.
- If `fontkit` exposes WOFF2 parsing differently in the installed version, keep `analyzeFontBuffer`'s interface unchanged and contain the package-specific adaptation in `lib/custom-fonts/parser.ts`.
- If the production S3 role cannot perform the SDK `CopyObject` operation with its `GetObject`/`PutObject` permissions, treat that as a deployment blocker; do not silently persist pending-prefix objects as permanent variants.
- Do not broaden the existing general media presign endpoint to accept fonts. Custom fonts use the authenticated `/api/admin/custom-fonts/presign` boundary.
