# Invitation Details Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add localized editorial product-details pages for public Invitation and Save the Date models, with hybrid media galleries, embedded phone previews, and WhatsApp ordering.

**Architecture:** A server-side resolver turns either product type into one normalized `LandingProductDetails` view model after enforcing enabled landing-feature visibility. The localized route renders that model through focused client components for gallery selection, disclosures, and the preview dialog; all navigation, pricing, localization, and WhatsApp URL creation continue to use existing shared helpers.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7/PostgreSQL, next-intl, Tailwind CSS v4, Base UI Dialog, Framer Motion, Lucide React, Vitest.

## Global Constraints

- Support both full invitations and Save the Date products in Portuguese, English, and Spanish.
- Use `/[locale]/modelos/[kind]/[slug]` routing, with `kind` limited to `convite` and `save-the-date`; Portuguese remains the unprefixed default locale through existing locale routing.
- Only products referenced by an enabled public `LandingFeature` resolve; all others return the standard not-found page.
- The media order is dedicated detail images, then landing image, then suitable invitation media; trim, de-duplicate, and omit invalid values.
- A one-image page must remain complete and must not render thumbnails or empty media slots.
- Missing prices are omitted; no placeholder price is invented.
- Ordering remains a normal WhatsApp link built by existing helpers; there is no checkout or cart.
- Live preview opens in an accessible phone modal and includes a normal full-screen link to the real invitation.
- Respect reduced-motion preferences, visible keyboard focus, and minimum 40-by-40-pixel interactive hit areas.
- Do not add a DOM test environment; Vitest remains `node`. Keep behavior in pure helpers and use browser verification for rendered interaction.
- Do not add a new UI or animation dependency.
- Never run `next build` directly; final production verification uses `npm run build` so Prisma generation and migrations run first.

---

## File Structure

### New files

- `lib/landing-product-details.ts` — product-kind parsing, detail URL generation, dedicated-image sanitization, and hybrid-gallery resolution.
- `lib/landing-product-details-data.ts` — enabled-feature database lookup and normalized `LandingProductDetails` server view model.
- `components/admin/LandingDetailGalleryEditor.tsx` — ordered multi-image admin editor shared by invitations and Save the Dates.
- `components/landing/details/LandingProductDetailsPage.tsx` — editorial page composition and client interaction owner.
- `components/landing/details/ProductMediaGallery.tsx` — responsive primary image and thumbnail selection.
- `components/landing/details/ProductDetailsPanel.tsx` — title, description, price, tags, and desktop actions.
- `components/landing/details/ProductDetailsAccordions.tsx` — localized accessible disclosures.
- `components/landing/details/ProductPreviewDialog.tsx` — Base UI modal containing `PhoneIframePreview` and full-screen action.
- `components/landing/details/MobileRequestBar.tsx` — mobile sticky WhatsApp action.
- `app/[locale]/modelos/[kind]/[slug]/page.tsx` — dynamic page, metadata, visibility handling, and normalized data loading.
- `tests/landing-product-details.test.ts` — pure kind/path/gallery behavior.
- `tests/landing-product-details-data.test.ts` — mocked data-access visibility and normalization tests.
- `tests/landing-detail-gallery-persistence.test.ts` — persistence and admin wiring contract tests.
- `tests/landing-product-details-page.test.ts` — route/UI/translation integration contract tests in the existing node environment.
- `prisma/migrations/20260809143000_add_landing_detail_images/migration.sql` — nullable JSONB columns for both product models.

### Modified files

- `prisma/schema.prisma` — add `landingDetailImages Json?` to `Invitation` and `SaveTheDate`.
- `lib/types.ts` — expose `landingDetailImages?: string[] | null` on `InvitationData`.
- `lib/save-the-date.ts` — expose the persisted image list on `SaveTheDateData`.
- `lib/invitation-create-data.ts` — sanitize images on invitation creation.
- `lib/invitations.ts` — map images into public invitation data.
- `lib/invitation-admin-initial-data.ts` — map images back into the invitation edit form.
- `lib/invitation-duplication.ts` — clear detail images along with the other landing metadata on duplicates.
- `app/api/admin/invitations/[id]/route.ts` — sanitize partial image updates.
- `app/api/admin/save-the-date/route.ts` — sanitize images on Save the Date creation.
- `app/api/admin/save-the-date/[id]/route.ts` — sanitize partial image updates.
- `app/admin/save-the-dates/SaveTheDateForm.tsx` — carry detail images through form submit and shared metadata editing.
- `app/admin/save-the-dates/[id]/edit/page.tsx` — seed persisted detail images into the form.
- `components/admin/LandingMetadataFieldset.tsx` — include the shared detail-gallery editor and field.
- `lib/landing-features.ts` — give gallery and best-seller cards a details-page `href` while the detail resolver owns the separate live-preview URL.
- `components/landing/LandingModelCard.tsx` — navigate cards to details pages.
- `components/landing/GallerySection.tsx` — remove desktop card-preview modal state.
- `components/landing/BestSellersSection.tsx` — remove desktop card-preview modal state.
- `components/landing/PhoneIframePreview.tsx` — localize iframe and full-screen labels through explicit props.
- `messages/pt.json`, `messages/en.json`, `messages/es.json` — details-page, disclosure, modal, and navigation copy.
- `app/sitemap.ts` — include localized public product-details URLs.

---

### Task 1: Product Kind, URL, and Hybrid Gallery Domain

**Files:**
- Create: `lib/landing-product-details.ts`
- Create: `tests/landing-product-details.test.ts`

**Interfaces:**
- Consumes: no project state; accepts unknown persisted JSON and plain path inputs.
- Produces: `LandingProductKind`, `parseLandingProductKind(value)`, `buildLandingProductDetailsPath(kind, slug)`, `sanitizeLandingDetailImages(value)`, and `resolveLandingDetailImages(input)`.

- [ ] **Step 1: Write failing path and kind tests**

```ts
import { describe, expect, it } from "vitest";
import {
  buildLandingProductDetailsPath,
  parseLandingProductKind,
} from "@/lib/landing-product-details";

describe("landing product details paths", () => {
  it("accepts only the two public product kinds", () => {
    expect(parseLandingProductKind("convite")).toBe("convite");
    expect(parseLandingProductKind("save-the-date")).toBe("save-the-date");
    expect(parseLandingProductKind("invitation")).toBeNull();
  });

  it("builds stable unlocalized detail paths", () => {
    expect(buildLandingProductDetailsPath("convite", "amalfi")).toBe(
      "/modelos/convite/amalfi",
    );
    expect(buildLandingProductDetailsPath("save-the-date", "golden-heart")).toBe(
      "/modelos/save-the-date/golden-heart",
    );
  });
});
```

- [ ] **Step 2: Run the focused test and verify the missing module failure**

Run: `npx vitest run tests/landing-product-details.test.ts`

Expected: FAIL because `@/lib/landing-product-details` does not exist.

- [ ] **Step 3: Implement product kind and URL helpers**

```ts
export const LANDING_PRODUCT_KINDS = ["convite", "save-the-date"] as const;
export type LandingProductKind = (typeof LANDING_PRODUCT_KINDS)[number];

export function parseLandingProductKind(
  value: unknown,
): LandingProductKind | null {
  return typeof value === "string" &&
    LANDING_PRODUCT_KINDS.includes(value as LandingProductKind)
    ? (value as LandingProductKind)
    : null;
}

export function buildLandingProductDetailsPath(
  kind: LandingProductKind,
  slug: string,
): string {
  return `/modelos/${kind}/${encodeURIComponent(slug)}`;
}
```

- [ ] **Step 4: Add failing sanitation and fallback-order tests**

```ts
import {
  resolveLandingDetailImages,
  sanitizeLandingDetailImages,
} from "@/lib/landing-product-details";

describe("landing detail images", () => {
  it("normalizes persisted JSON into trimmed unique URLs", () => {
    expect(
      sanitizeLandingDetailImages([
        " https://cdn.test/a.jpg ",
        "",
        42,
        "https://cdn.test/a.jpg",
        "https://cdn.test/b.jpg",
      ]),
    ).toEqual(["https://cdn.test/a.jpg", "https://cdn.test/b.jpg"]);
    expect(sanitizeLandingDetailImages({ src: "x" })).toBeNull();
  });

  it("orders dedicated, landing, and fallback media without duplicates", () => {
    expect(
      resolveLandingDetailImages({
        dedicated: ["dedicated-a", "shared"],
        landingImageUrl: "landing",
        fallbackUrls: ["shared", "hero", undefined, ""],
      }),
    ).toEqual(["dedicated-a", "shared", "landing", "hero"]);
  });

  it("returns one complete image without manufacturing slots", () => {
    expect(
      resolveLandingDetailImages({
        dedicated: null,
        landingImageUrl: "landing-only",
        fallbackUrls: [],
      }),
    ).toEqual(["landing-only"]);
  });
});
```

- [ ] **Step 5: Implement sanitation and gallery resolution**

```ts
function normalizedStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sanitizeLandingDetailImages(value: unknown): string[] | null {
  const images = [...new Set(normalizedStrings(value))];
  return images.length ? images : null;
}

export function resolveLandingDetailImages(input: {
  dedicated: unknown;
  landingImageUrl?: unknown;
  fallbackUrls?: unknown[];
}): string[] {
  const candidates = [
    ...(sanitizeLandingDetailImages(input.dedicated) ?? []),
    input.landingImageUrl,
    ...(input.fallbackUrls ?? []),
  ];
  return [
    ...new Set(
      candidates
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}
```

- [ ] **Step 6: Run the domain tests**

Run: `npx vitest run tests/landing-product-details.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the domain unit**

```bash
git add lib/landing-product-details.ts tests/landing-product-details.test.ts
git commit -m "feat: add landing product detail helpers"
```

---

### Task 2: Persist and Edit Dedicated Detail Images

**Files:**
- Create: `prisma/migrations/20260809143000_add_landing_detail_images/migration.sql`
- Create: `components/admin/LandingDetailGalleryEditor.tsx`
- Create: `tests/landing-detail-gallery-persistence.test.ts`
- Modify: `prisma/schema.prisma`
- Modify: `lib/types.ts`
- Modify: `lib/save-the-date.ts`
- Modify: `lib/invitation-create-data.ts`
- Modify: `lib/invitations.ts`
- Modify: `lib/invitation-admin-initial-data.ts`
- Modify: `lib/invitation-duplication.ts`
- Modify: `app/api/admin/invitations/[id]/route.ts`
- Modify: `app/api/admin/save-the-date/route.ts`
- Modify: `app/api/admin/save-the-date/[id]/route.ts`
- Modify: `components/admin/LandingMetadataFieldset.tsx`
- Modify: `app/admin/invitations/InvitationForm.tsx`
- Modify: `app/admin/invitations/ExternalInvitationForm.tsx`
- Modify: `app/admin/save-the-dates/SaveTheDateForm.tsx`
- Modify: `app/admin/save-the-dates/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `sanitizeLandingDetailImages(value)` from Task 1 and existing `MediaUpload`.
- Produces: nullable `landingDetailImages` persistence on both models and an ordered admin editor returning `string[] | null`.

- [ ] **Step 1: Write the failing persistence contract test**

Use the repository's existing source-contract style so this remains a node-only test:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("landing detail gallery persistence", () => {
  it("declares the field on both Prisma product models", () => {
    const schema = read("prisma/schema.prisma");
    expect(schema.match(/landingDetailImages\s+Json\?/g)).toHaveLength(2);
  });

  it("sanitizes invitation create and update writes", () => {
    expect(read("lib/invitation-create-data.ts")).toContain(
      "sanitizeLandingDetailImages(body.landingDetailImages)",
    );
    expect(read("app/api/admin/invitations/[id]/route.ts")).toContain(
      "sanitizeLandingDetailImages(body.landingDetailImages)",
    );
  });

  it("sanitizes Save the Date create and update writes", () => {
    expect(read("app/api/admin/save-the-date/route.ts")).toContain(
      "sanitizeLandingDetailImages(landingDetailImages)",
    );
    expect(read("app/api/admin/save-the-date/[id]/route.ts")).toContain(
      "sanitizeLandingDetailImages(body.landingDetailImages)",
    );
  });

  it("round-trips the field through both admin forms", () => {
    expect(read("components/admin/LandingMetadataFieldset.tsx")).toContain(
      "LandingDetailGalleryEditor",
    );
    expect(read("app/admin/save-the-dates/SaveTheDateForm.tsx")).toContain(
      "landingDetailImages",
    );
  });
});
```

- [ ] **Step 2: Run the test and verify field/editor failures**

Run: `npx vitest run tests/landing-detail-gallery-persistence.test.ts`

Expected: FAIL on the absent Prisma fields and admin editor.

- [ ] **Step 3: Add the nullable JSONB fields and migration**

Add beside the existing landing image fields in both Prisma models:

```prisma
landingDetailImages Json? // ordered string[] of dedicated product-detail marketing images
```

Create the migration with exact SQL:

```sql
ALTER TABLE "Invitation" ADD COLUMN "landingDetailImages" JSONB;
ALTER TABLE "SaveTheDate" ADD COLUMN "landingDetailImages" JSONB;
```

Run: `npm run db:generate`

Expected: Prisma client regeneration succeeds.

- [ ] **Step 4: Thread the field through invitation persistence and mappers**

Add `landingDetailImages?: string[] | null` to `InvitationData`. In create/update writes, convert the sanitized array through `sanitizeJsonField(..., null)` because Prisma JSON fields require JSON-compatible values:

```ts
landingDetailImages: sanitizeJsonField(
  sanitizeLandingDetailImages(body.landingDetailImages),
  null,
),
```

For partial update:

```ts
...(body.landingDetailImages !== undefined && {
  landingDetailImages: sanitizeJsonField(
    sanitizeLandingDetailImages(body.landingDetailImages),
    null,
  ),
}),
```

Add the raw row field and normalized mapper result to both `toInvitationData` and `toAdminInvitationInitialData`. In `buildInvitationDuplicateData`, set `landingDetailImages: null` beside `landingImageUrl: null` so a duplicated invitation does not silently reuse product-marketing media.

- [ ] **Step 5: Thread the field through Save the Date persistence and form data**

Add `landingDetailImages: string[] | null` to `SaveTheDateData`. Map it in `getSaveTheDate`, accept it in the Save the Date form input type, include it in POST/PUT bodies, and seed it in the edit page.

Use the same sanitized JSON write shape as invitations. A missing update property must leave the stored value untouched; an explicit empty array must store `null`.

- [ ] **Step 6: Build the ordered shared admin editor**

Implement this public contract:

```ts
export function LandingDetailGalleryEditor({
  value,
  onChange,
}: {
  value: string[] | null;
  onChange: (next: string[] | null) => void;
})
```

The component must:

- show each image with its position;
- use `MediaUpload` to add one image at a time;
- expose 40-pixel move-up, move-down, and remove buttons with Lucide icons and Portuguese `aria-label`s;
- disable move controls at list boundaries;
- call `onChange(next.length ? next : null)` after mutations;
- avoid local mirrored image state so parent form state remains authoritative.

Core mutation logic:

```ts
const images = value ?? [];
const commit = (next: string[]) => onChange(next.length ? next : null);
const add = (url: string) => commit([...images, url]);
const remove = (index: number) =>
  commit(images.filter((_, current) => current !== index));
const move = (index: number, offset: -1 | 1) => {
  const target = index + offset;
  if (target < 0 || target >= images.length) return;
  const next = [...images];
  [next[index], next[target]] = [next[target], next[index]];
  commit(next);
};
```

- [ ] **Step 7: Add the editor to shared landing metadata**

Extend `LandingMetadata` with `landingDetailImages: string[] | null`. Render `LandingDetailGalleryEditor` immediately after the existing highlight-image uploader with the explanatory label “Galeria da página de detalhes”. Update every Invitation, External Invitation, and Save the Date caller to pass and persist the new property.

- [ ] **Step 8: Run persistence and affected mapper tests**

Run:

```bash
npx vitest run tests/landing-detail-gallery-persistence.test.ts tests/invitation-admin-initial-data.test.ts tests/invitation-duplication.test.ts tests/landing-metadata-fieldset.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit the persistence and admin unit**

```bash
git add prisma/schema.prisma prisma/migrations lib/types.ts lib/save-the-date.ts lib/invitation-create-data.ts lib/invitations.ts lib/invitation-admin-initial-data.ts lib/invitation-duplication.ts 'app/api/admin/invitations/[id]/route.ts' app/api/admin/save-the-date/route.ts 'app/api/admin/save-the-date/[id]/route.ts' components/admin/LandingDetailGalleryEditor.tsx components/admin/LandingMetadataFieldset.tsx app/admin/invitations/InvitationForm.tsx app/admin/invitations/ExternalInvitationForm.tsx app/admin/save-the-dates/SaveTheDateForm.tsx 'app/admin/save-the-dates/[id]/edit/page.tsx' tests/landing-detail-gallery-persistence.test.ts
git commit -m "feat: persist landing detail galleries"
```

---

### Task 3: Public Product Resolver and Normalized View Model

**Files:**
- Create: `lib/landing-product-details-data.ts`
- Create: `tests/landing-product-details-data.test.ts`
- Modify: `lib/landing-features.ts`

**Interfaces:**
- Consumes: `LandingProductKind`, `buildLandingProductDetailsPath`, `resolveLandingDetailImages`, existing landing localization, currency, price, and WhatsApp helpers.
- Produces: `LandingProductDetails` and `getLandingProductDetails(kind, slug, viewerCurrency, locale)`; catalogue model-card `href` values become details paths.

- [ ] **Step 1: Write a failing mocked resolver test**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: { landingFeature: { findFirst } },
}));

import { getLandingProductDetails } from "@/lib/landing-product-details-data";

const sharedPricing = {
  priceFromCents: 8900,
  discountPriceFromCents: null,
  currency: "EUR",
  priceOverrides: null,
};

const invitationFeatureFixture = {
  invitation: {
    slug: "amalfi",
    couple: { bride: "Ana", groom: "Miguel" },
    landingModelName: "Amalfi",
    landingSubtitle: "Editorial",
    landingDescription: "A quiet, elegant invitation.",
    landingTranslations: {
      en: {
        landingModelName: "Amalfi",
        landingSubtitle: "Editorial",
        landingDescription: "A quiet, elegant invitation.",
      },
    },
    landingCustomizationLevel: "fully_customizable",
    landingDetailImages: ["detail"],
    landingImageUrl: "landing",
    heroImage: "hero",
    coupleGallery: {
      enabled: true,
      style: "grid",
      images: [{ id: "one", src: "gallery" }],
    },
    ...sharedPricing,
  },
  saveTheDate: null,
};

const saveTheDateFeatureFixture = {
  invitation: null,
  saveTheDate: {
    slug: "golden-heart",
    couple: { bride: "Lucía", groom: "Diego" },
    landingModelName: "Golden Heart",
    landingSubtitle: null,
    landingDescription: "Reserva la fecha.",
    landingTranslations: null,
    landingCustomizationLevel: "pre_designed",
    landingDetailImages: null,
    landingImageUrl: "landing",
    bottomHero: {
      enabled: true,
      mediaType: "image",
      mediaUrl: "bottom-image",
      title: "",
      description: "",
    },
    ...sharedPricing,
  },
};

describe("getLandingProductDetails", () => {
  beforeEach(() => findFirst.mockReset());

  it("requires an enabled invitation landing feature", async () => {
    findFirst.mockResolvedValue(null);
    await expect(
      getLandingProductDetails("convite", "hidden", "EUR", "pt"),
    ).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ enabled: true }),
      }),
    );
  });

  it("normalizes invitation media and purchase data", async () => {
    findFirst.mockResolvedValue(invitationFeatureFixture);
    const result = await getLandingProductDetails(
      "convite",
      "amalfi",
      "EUR",
      "en",
    );
    expect(result).toMatchObject({
      kind: "convite",
      slug: "amalfi",
      previewHref: "/amalfi",
      detailsHref: "/modelos/convite/amalfi",
      title: "Amalfi",
      images: ["detail", "landing", "hero", "gallery"],
    });
    expect(result?.whatsappHref).toMatch(/^https:\/\/wa\.me\//);
  });

  it("normalizes image-based Save the Date bottom media", async () => {
    findFirst.mockResolvedValue(saveTheDateFeatureFixture);
    const result = await getLandingProductDetails(
      "save-the-date",
      "golden-heart",
      "USD",
      "es",
    );
    expect(result?.previewHref).toBe("/s/golden-heart");
    expect(result?.images).toEqual(["landing", "bottom-image"]);
  });
});
```

- [ ] **Step 2: Run the test and verify the missing resolver failure**

Run: `npx vitest run tests/landing-product-details-data.test.ts`

Expected: FAIL because the resolver module does not exist.

- [ ] **Step 3: Define the normalized view model**

```ts
export type LandingProductDetails = {
  kind: LandingProductKind;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  customizationLevel: LandingCustomizationLevel;
  price: LandingPrice | null;
  images: string[];
  previewHref: string;
  detailsHref: string;
  whatsappHref: string;
};
```

Keep this model JSON-serializable and free of Prisma types so the page client receives only presentation data.

- [ ] **Step 4: Implement enabled-feature lookup for both product kinds**

For `convite`, query `landingFeature.findFirst` with `enabled: true`, a non-null invitation whose `slug` matches, and an include/select containing all landing metadata plus `heroImage`, `coupleGallery`, and `landingDetailImages`.

For `save-the-date`, use the same enabled rule with `saveTheDate.slug` and select `bottomHero` plus its landing metadata and detail images.

Normalize:

- title and description through `localizeLandingMetadata` and `resolveLandingGalleryMetadata`;
- price through the existing template-price pipeline used by `lib/landing-features.ts`;
- WhatsApp through `buildPurchaseMessage` and `buildWhatsappUrl`;
- invitation fallback URLs from `heroImage` and `coupleGallery.images[].src`;
- Save the Date fallback URL only when `bottomHero.enabled`, `mediaType === "image"`, and `mediaUrl` is non-empty.

- [ ] **Step 5: Point catalogue card URLs at details pages**

In `getGalleryFeaturesByCategory` and `mapBestSellerRowToFeature`, replace the old invitation/Save the Date `href` with `buildLandingProductDetailsPath(kind, slug)`. The normalized `LandingProductDetails.previewHref` remains the only source for the real invitation URL. Leave hero and live-demo links unchanged because they are not catalogue model cards.

- [ ] **Step 6: Run resolver and landing feature tests**

Run:

```bash
npx vitest run tests/landing-product-details-data.test.ts tests/landing-feature-translations.test.ts tests/landing-data.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit the server data unit**

```bash
git add lib/landing-product-details-data.ts lib/landing-features.ts tests/landing-product-details-data.test.ts
git commit -m "feat: resolve public landing product details"
```

---

### Task 4: Localized Details Route, Metadata, Copy, and Sitemap

**Files:**
- Create: `app/[locale]/modelos/[kind]/[slug]/page.tsx`
- Create: `tests/landing-product-details-page.test.ts`
- Modify: `messages/pt.json`
- Modify: `messages/en.json`
- Modify: `messages/es.json`
- Modify: `app/sitemap.ts`
- Modify: `lib/landing-product-details-data.ts`

**Interfaces:**
- Consumes: `parseLandingProductKind`, `getLandingProductDetails`, `getViewerCurrency`, `buildLocalePath`, `buildAbsoluteUrl`, and `buildLanguageAlternates`.
- Produces: localized metadata/page data, translation namespace `LandingProductDetails`, and sitemap entries from `getPublicLandingProductPaths()`.

- [ ] **Step 1: Write failing route and translation contract tests**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("landing product details page", () => {
  it("rejects invalid kinds and missing public products", () => {
    const page = read("app/[locale]/modelos/[kind]/[slug]/page.tsx");
    expect(page).toContain("parseLandingProductKind");
    expect(page.match(/notFound\(\)/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("builds localized canonical metadata and language alternates", () => {
    const page = read("app/[locale]/modelos/[kind]/[slug]/page.tsx");
    expect(page).toContain("buildLanguageAlternates");
    expect(page).toContain("buildLocalePath(details.detailsHref, locale)");
  });

  it.each(["pt", "en", "es"])("defines complete %s details copy", (locale) => {
    const messages = JSON.parse(read(`messages/${locale}.json`));
    expect(messages.LandingProductDetails).toMatchObject({
      backToModels: expect.any(String),
      requestViaWhatsapp: expect.any(String),
      viewLive: expect.any(String),
      openFullScreen: expect.any(String),
      includedTitle: expect.any(String),
      customizationTitle: expect.any(String),
      orderingTitle: expect.any(String),
    });
  });
});
```

- [ ] **Step 2: Run the page test and verify the missing route/copy failures**

Run: `npx vitest run tests/landing-product-details-page.test.ts`

Expected: FAIL because the route and namespace do not exist.

- [ ] **Step 3: Add exact localized copy**

Add `LandingProductDetails` with these keys in every message file:

```json
{
  "backToModels": "Voltar aos modelos",
  "invitationEyebrow": "Convite digital",
  "saveTheDateEyebrow": "Save the Date",
  "requestViaWhatsapp": "Pedir este convite",
  "viewLive": "Ver convite ao vivo",
  "selectImage": "Ver imagem {position}",
  "previewTitle": "Pré-visualização de {title}",
  "closePreview": "Fechar pré-visualização",
  "openFullScreen": "Abrir em ecrã inteiro",
  "includedTitle": "O que está incluído",
  "customizationTitle": "Personalização",
  "orderingTitle": "Como encomendar",
  "madeForYouTitle": "Feito à medida da vossa história",
  "madeForYouBody": "Nomes, cores, fotografias, textos e detalhes adaptados à celebração.",
  "shareTitle": "Partilhado num instante",
  "shareBody": "Uma experiência elegante e preparada para qualquer telemóvel.",
  "fullyCustomizableTag": "Totalmente personalizável",
  "preDesignedTag": "Design predefinido",
  "rsvpTag": "RSVP online",
  "mapsTag": "Mapas",
  "invitationIncludedBody": "Convite digital, confirmação de presença, informações do evento e partilha por link.",
  "saveTheDateIncludedBody": "Anúncio digital da data, experiência interativa e partilha por link.",
  "fullyCustomizableBody": "Estrutura, cores, textos, imagens e detalhes podem ser adaptados ao vosso evento.",
  "preDesignedBody": "Personalizamos o conteúdo e a identidade visual mantendo a estrutura deste design.",
  "orderingBody": "Envie-nos uma mensagem no WhatsApp. Confirmamos os detalhes, recebemos o conteúdo e preparamos a primeira versão para revisão."
}
```

Use fluent equivalents—not literal machine phrasing—in English and Spanish:

```json
{
  "backToModels": "Back to designs",
  "invitationEyebrow": "Digital invitation",
  "saveTheDateEyebrow": "Save the Date",
  "requestViaWhatsapp": "Request this invitation",
  "viewLive": "View live invitation",
  "selectImage": "View image {position}",
  "previewTitle": "Preview of {title}",
  "closePreview": "Close preview",
  "openFullScreen": "Open full screen",
  "includedTitle": "What’s included",
  "customizationTitle": "Customization",
  "orderingTitle": "How ordering works",
  "madeForYouTitle": "Made around your story",
  "madeForYouBody": "Names, colours, photographs, wording and details shaped around your celebration.",
  "shareTitle": "Shared in one tap",
  "shareBody": "An elegant experience prepared for every phone.",
  "fullyCustomizableTag": "Fully customizable",
  "preDesignedTag": "Pre-designed",
  "rsvpTag": "Online RSVP",
  "mapsTag": "Maps",
  "invitationIncludedBody": "A digital invitation, RSVP, event information and a shareable link.",
  "saveTheDateIncludedBody": "A digital date announcement, an interactive experience and a shareable link.",
  "fullyCustomizableBody": "The structure, colours, wording, images and details can be adapted to your event.",
  "preDesignedBody": "We personalize the content and visual identity while keeping this design’s structure.",
  "orderingBody": "Message us on WhatsApp. We confirm the details, collect your content and prepare the first version for review."
}
```

```json
{
  "backToModels": "Volver a los diseños",
  "invitationEyebrow": "Invitación digital",
  "saveTheDateEyebrow": "Save the Date",
  "requestViaWhatsapp": "Solicitar esta invitación",
  "viewLive": "Ver invitación en vivo",
  "selectImage": "Ver imagen {position}",
  "previewTitle": "Vista previa de {title}",
  "closePreview": "Cerrar vista previa",
  "openFullScreen": "Abrir a pantalla completa",
  "includedTitle": "Qué incluye",
  "customizationTitle": "Personalización",
  "orderingTitle": "Cómo hacer el pedido",
  "madeForYouTitle": "Creado alrededor de vuestra historia",
  "madeForYouBody": "Nombres, colores, fotografías, textos y detalles adaptados a vuestra celebración.",
  "shareTitle": "Compartido en un instante",
  "shareBody": "Una experiencia elegante y preparada para cualquier móvil.",
  "fullyCustomizableTag": "Totalmente personalizable",
  "preDesignedTag": "Diseño predefinido",
  "rsvpTag": "Confirmación online",
  "mapsTag": "Mapas",
  "invitationIncludedBody": "Invitación digital, confirmación de asistencia, información del evento y enlace para compartir.",
  "saveTheDateIncludedBody": "Anuncio digital de la fecha, experiencia interactiva y enlace para compartir.",
  "fullyCustomizableBody": "La estructura, los colores, los textos, las imágenes y los detalles se pueden adaptar a vuestro evento.",
  "preDesignedBody": "Personalizamos el contenido y la identidad visual manteniendo la estructura de este diseño.",
  "orderingBody": "Escríbenos por WhatsApp. Confirmamos los detalles, recibimos el contenido y preparamos la primera versión para revisión."
}
```

- [ ] **Step 4: Implement dynamic metadata and page loading**

The route exports `dynamic = "force-dynamic"`. Both `generateMetadata` and the page:

1. resolve `locale`, `kind`, `slug`, and viewer currency;
2. return not-found metadata or `notFound()` for invalid kind/non-public product;
3. derive the canonical URL from `buildLocalePath(details.detailsHref, locale)`;
4. use `details.title` and `details.description` for Open Graph/Twitter metadata, adding `images: [{ url: details.images[0] }]` only when the first resolved image exists;
5. render `LandingProductDetailsPage` with the normalized model, `currentCurrency`, and a localized models-back-link built as `${buildLocalePath("/", locale)}#modelos`.

Use `createPublicPageRobotsMetadata(true)` because enabled landing products are intentionally public; the data resolver remains the visibility gate.

- [ ] **Step 5: Add detail pages to the sitemap**

Add `getPublicLandingProductPaths()` to the data module. It returns de-duplicated `{ kind, slug }[]` for enabled features with a linked product. In `app/sitemap.ts`, expand each path through `SUPPORTED_LOCALES` and `buildLocalePath(buildLandingProductDetailsPath(kind, slug), locale)`.

- [ ] **Step 6: Run route, localization, SEO, and sitemap tests**

Run:

```bash
npx vitest run tests/landing-product-details-page.test.ts tests/i18n-locales.test.ts tests/social-preview-metadata.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit the route and localized content unit**

```bash
git add 'app/[locale]/modelos/[kind]/[slug]/page.tsx' lib/landing-product-details-data.ts app/sitemap.ts messages/pt.json messages/en.json messages/es.json tests/landing-product-details-page.test.ts
git commit -m "feat: add localized invitation detail routes"
```

---

### Task 5: Editorial Gallery and Details Content

**Files:**
- Create: `components/landing/details/ProductMediaGallery.tsx`
- Create: `components/landing/details/ProductDetailsPanel.tsx`
- Create: `components/landing/details/ProductDetailsAccordions.tsx`
- Create: `components/landing/details/LandingProductDetailsPage.tsx`
- Modify: `tests/landing-product-details-page.test.ts`

**Interfaces:**
- Consumes: `LandingProductDetails`, `currentCurrency`, `modelsHref`, and the `LandingProductDetails` next-intl namespace from Task 4.
- Produces: responsive editorial page shell; `onPreview()` is passed from the composition to the details panel.

- [ ] **Step 1: Extend the failing source contract for visual and accessibility requirements**

```ts
it("assembles focused editorial detail components", () => {
  const page = read(
    "components/landing/details/LandingProductDetailsPage.tsx",
  );
  expect(page).toContain("ProductMediaGallery");
  expect(page).toContain("ProductDetailsPanel");
  expect(page).toContain("ProductDetailsAccordions");
  expect(page).toContain("MobileRequestBar");
  expect(page).toContain("ProductPreviewDialog");
});

it("keeps one-image galleries free of empty thumbnails", () => {
  const gallery = read("components/landing/details/ProductMediaGallery.tsx");
  expect(gallery).toContain("images.length > 1");
  expect(gallery).toContain('aria-label={labels.selectImage(index + 1)}');
  expect(gallery).toContain("images.length === 0");
});
```

- [ ] **Step 2: Run the page contract and verify component failures**

Run: `npx vitest run tests/landing-product-details-page.test.ts`

Expected: FAIL because the detail components do not exist.

- [ ] **Step 3: Implement `ProductMediaGallery`**

Use this contract:

```ts
type ProductMediaGalleryProps = {
  title: string;
  images: string[];
  labels: { selectImage: (position: number) => string };
};
```

Implementation requirements:

- first image is initially active;
- active state is an index, never a duplicated URL;
- primary image uses `next/image` with `fill`, `sizes="(min-width: 1024px) 58vw, 100vw"`, `object-cover`, and a pure-black 10% outline;
- desktop thumbnails form the asymmetric secondary column; mobile thumbnails form a horizontal row;
- render thumbnail controls only when `images.length > 1`;
- when `images.length === 0`, render one quiet editorial placeholder containing the model title and no `<Image>` or thumbnail controls;
- selected thumbnails expose `aria-current="true"`;
- controls have 40-pixel hit areas and visible focus rings;
- image changes use opacity/scale transitions only and disable those transitions under reduced motion;
- no `transition-all` and no persistent `will-change`.

- [ ] **Step 4: Implement localized disclosures**

Use native `<details>`/`<summary>` so keyboard and no-JavaScript behavior work without a custom state machine:

```ts
type ProductDetailsAccordionsProps = {
  items: Array<{ title: string; body: string }>;
};
```

Each disclosure has a hairline divider, a 44-pixel minimum summary row, a Lucide `ChevronDown` that rotates via `group-open`, and body text with `text-wrap: pretty`. Do not add decorative numbering because the sections are not a sequence.

- [ ] **Step 5: Implement the sticky product panel**

Use this contract:

```ts
type ProductDetailsPanelProps = {
  details: LandingProductDetails;
  eyebrow: string;
  tags: string[];
  accordionItems: Array<{ title: string; body: string }>;
  requestLabel: string;
  previewLabel: string;
  onPreview: () => void;
};
```

The desktop panel is `lg:sticky lg:top-24`, uses a restrained serif display face already available as `--font-cormorant-garamond`, balances the model name, prettifies body wrapping, applies tabular numerals to price, and renders:

1. product eyebrow;
2. model name;
3. optional original/effective price;
4. description;
5. capability tags;
6. WhatsApp anchor as the primary dark pill;
7. preview button as the secondary outlined pill;
8. accordions.

Both actions use `active:scale-[0.96]`, explicit transform/colour transitions, and visible focus rings.

- [ ] **Step 6: Compose the responsive page**

Use this public contract:

```ts
export function LandingProductDetailsPage({
  details,
  currentCurrency,
  modelsHref,
}: {
  details: LandingProductDetails;
  currentCurrency: Currency;
  modelsHref: string;
})
```

The component owns only `previewOpen` state and calls `useTranslations("LandingProductDetails")`. It derives translated tags and disclosure bodies from `details.kind` and `details.customizationLevel`, then renders:

- a non-fixed detail-page header with Brindeal logo, back link, and existing `LocaleCurrencyMenu`;
- `lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,.65fr)]` editorial main area;
- gallery on the left and panel on the right;
- the two approved editorial statements below the main area;
- mobile sticky action and preview dialog after main content.

Keep the page background in the existing landing design tokens rather than adding route-global CSS. Apply `pb-24 lg:pb-0` so the mobile request bar never covers content.

- [ ] **Step 7: Run page and full unit tests**

Run:

```bash
npx vitest run tests/landing-product-details-page.test.ts
npm test
```

Expected: all tests PASS.

- [ ] **Step 8: Commit the editorial content unit**

```bash
git add components/landing/details/ProductMediaGallery.tsx components/landing/details/ProductDetailsPanel.tsx components/landing/details/ProductDetailsAccordions.tsx components/landing/details/LandingProductDetailsPage.tsx tests/landing-product-details-page.test.ts
git commit -m "feat: build editorial invitation detail layout"
```

---

### Task 6: Phone Preview Dialog and Mobile Request Action

**Files:**
- Create: `components/landing/details/ProductPreviewDialog.tsx`
- Create: `components/landing/details/MobileRequestBar.tsx`
- Modify: `components/landing/PhoneIframePreview.tsx`
- Modify: `components/landing/details/LandingProductDetailsPage.tsx`
- Modify: `tests/landing-product-details-page.test.ts`

**Interfaces:**
- Consumes: `title`, `previewHref`, `whatsappHref`, localized labels, and `open/onOpenChange` from the page composition.
- Produces: accessible Base UI preview dialog and mobile-only sticky request link.

- [ ] **Step 1: Add failing modal/mobile contract tests**

```ts
it("uses Base UI dialog and the existing phone preview", () => {
  const dialog = read(
    "components/landing/details/ProductPreviewDialog.tsx",
  );
  expect(dialog).toContain('Dialog as DialogPrimitive');
  expect(dialog).toContain("PhoneIframePreview");
  expect(dialog).toContain("DialogPrimitive.Title");
  expect(dialog).toContain("DialogPrimitive.Close");
  expect(dialog).toContain('target="_blank"');
});

it("renders a mobile-only normal WhatsApp link", () => {
  const bar = read("components/landing/details/MobileRequestBar.tsx");
  expect(bar).toContain("lg:hidden");
  expect(bar).toContain("href={whatsappHref}");
  expect(bar).toContain("min-h-10");
});
```

- [ ] **Step 2: Run the contract and verify missing component failures**

Run: `npx vitest run tests/landing-product-details-page.test.ts`

Expected: FAIL because dialog and mobile bar files do not exist.

- [ ] **Step 3: Make `PhoneIframePreview` copy explicit and localizable**

Replace hard-coded Portuguese labels with required props:

```ts
{
  title: string;
  src: string;
  iframeTitle: string;
  openLabel: string;
  showCaption?: boolean;
  loading?: "eager" | "lazy";
  lazyExternalIframe?: boolean;
}
```

Use `iframeTitle` directly on the iframe and `openLabel` on the optional caption link. Update all current call sites in `GallerySection`/`BestSellersSection` only if they still exist at this point; Task 7 removes those modals.

- [ ] **Step 4: Implement `ProductPreviewDialog`**

Use Base UI `DialogPrimitive.Root`, `Portal`, `Backdrop`, `Popup`, `Title`, and `Close`. Requirements:

- `open` and `onOpenChange` are controlled by the page;
- backdrop is `bg-ink/70 backdrop-blur-md`;
- popup fits `calc(100dvh - 2rem)` and never introduces horizontal overflow;
- `PhoneIframePreview` loads eagerly only after the dialog is open;
- close button is at least 40 by 40 pixels with localized `aria-label`;
- full-screen anchor uses `previewHref`, `target="_blank"`, and `rel="noreferrer"`;
- use opacity and `scale(.96 → 1)` transitions with the existing landing easing, and suppress them when reduced motion is requested;
- do not animate on initial closed render.

- [ ] **Step 5: Implement `MobileRequestBar`**

Render a `lg:hidden fixed inset-x-0 bottom-0 z-40` translucent surface with safe-area bottom padding. Its inner WhatsApp anchor uses the existing dark primary style, `min-h-10`, full width, a WhatsApp icon, visible focus, and `active:scale-[0.96]`.

- [ ] **Step 6: Wire the dialog and mobile action into the page**

The preview button sets `previewOpen` true. The dialog receives localized `previewTitle`, `closePreview`, and `openFullScreen` labels. `MobileRequestBar` receives the same `whatsappHref` and request label as the desktop action. Verify the desktop action is hidden from the sticky bar breakpoint and the bar is absent on `lg` screens.

- [ ] **Step 7: Run focused and full tests**

Run:

```bash
npx vitest run tests/landing-product-details-page.test.ts
npm test
```

Expected: all tests PASS.

- [ ] **Step 8: Commit the interaction unit**

```bash
git add components/landing/PhoneIframePreview.tsx components/landing/details/ProductPreviewDialog.tsx components/landing/details/MobileRequestBar.tsx components/landing/details/LandingProductDetailsPage.tsx tests/landing-product-details-page.test.ts
git commit -m "feat: add invitation detail preview dialog"
```

---

### Task 7: Send Catalogue Cards Through Details Pages

**Files:**
- Modify: `components/landing/LandingModelCard.tsx`
- Modify: `components/landing/GallerySection.tsx`
- Modify: `components/landing/BestSellersSection.tsx`
- Modify: `tests/landing-product-details-data.test.ts`
- Modify: `tests/landing-product-details-page.test.ts`

**Interfaces:**
- Consumes: card `href` as details URL; the details-page resolver separately owns the live `previewHref`.
- Produces: native card navigation without desktop interception or duplicate preview dialogs.

- [ ] **Step 1: Add failing navigation cleanup tests**

```ts
it("does not intercept catalogue model navigation", () => {
  const gallery = read("components/landing/GallerySection.tsx");
  const bestSellers = read("components/landing/BestSellersSection.tsx");
  for (const source of [gallery, bestSellers]) {
    expect(source).not.toContain("previewItem");
    expect(source).not.toContain("setPreviewItem");
    expect(source).not.toContain("PhoneIframePreview");
  }
});

it("uses the detail href for the complete card interaction", () => {
  const card = read("components/landing/LandingModelCard.tsx");
  expect(card).toContain("href={item.href}");
  expect(card).not.toContain("onPreviewClick");
});
```

- [ ] **Step 2: Run the test and verify old preview behavior fails it**

Run: `npx vitest run tests/landing-product-details-page.test.ts`

Expected: FAIL because desktop sections still own preview modal state and click interception.

- [ ] **Step 3: Simplify `LandingModelCard` to native navigation**

Remove `onPreviewClick` from its props and both anchor handlers. Keep the main image/title/body and price links pointing to `item.href`. Change the image overlay copy from “click to preview” to a `viewDetails` key in both `LandingBestSellers` and `LandingGallery`, using exact values `Ver detalhes` (Portuguese), `View details` (English), and `Ver detalles` (Spanish).

Keep the WhatsApp button as a direct secondary action. It must stop propagation naturally because it is a separate sibling anchor, not a nested anchor.

- [ ] **Step 4: Remove obsolete section dialog state and imports**

In both `GallerySection` and `BestSellersSection`, remove:

- `useIsMobile`;
- `previewItem` state;
- `handleCardClick`;
- Base UI Dialog imports and markup;
- `PhoneIframePreview` and close-icon imports;
- `onPreviewClick` props.

Do not change category filtering, card animations, ordering, or empty states.

- [ ] **Step 5: Run landing and full tests**

Run:

```bash
npx vitest run tests/landing-product-details-data.test.ts tests/landing-product-details-page.test.ts tests/landing-feature-translations.test.ts
npm test
```

Expected: all tests PASS.

- [ ] **Step 6: Commit the navigation unit**

```bash
git add components/landing/LandingModelCard.tsx components/landing/GallerySection.tsx components/landing/BestSellersSection.tsx messages/pt.json messages/en.json messages/es.json tests/landing-product-details-data.test.ts tests/landing-product-details-page.test.ts
git commit -m "feat: route catalogue cards through details"
```

---

### Task 8: Visual QA, Accessibility, and Production Verification

**Files:**
- Modify only files found deficient during verification.

**Interfaces:**
- Consumes: the complete feature from Tasks 1–7.
- Produces: verified responsive behavior, clean lint/tests/build, and a final reviewable implementation.

- [ ] **Step 1: Seed or identify one public product of each kind**

Use existing development data. Ensure one enabled invitation landing feature and one enabled Save the Date landing feature have:

- at least three dedicated images for the full gallery state;
- one product with no dedicated images to verify fallback behavior;
- one product with no price to verify omission;
- one localized English or Spanish metadata overlay.

Do not modify production environment files or production data.

- [ ] **Step 2: Start the development server**

Run: `npm run dev`

Expected: server starts without Prisma or route errors.

- [ ] **Step 3: Verify desktop at 1440 by 1000**

Check both product kinds and confirm:

- asymmetric gallery and secondary media align without empty slots;
- details panel stays visible while gallery content scrolls;
- title wrapping is balanced and description wrapping is clean;
- current currency and localized price match the home page;
- WhatsApp action opens the correct model-specific message;
- preview dialog traps focus, closes with Escape and close button, and opens full-screen correctly;
- image edges use a subtle pure-black 10% outline;
- there is no horizontal overflow or layout jump.

- [ ] **Step 4: Verify mobile at 390 by 844 and narrow mobile at 320 pixels**

Confirm:

- primary image and thumbnails fit without clipping;
- one-image fallback has no blank thumbnail strip;
- sticky WhatsApp bar respects safe-area padding and never covers final content;
- every control remains at least 40 by 40 pixels;
- long Spanish and English labels wrap without overlap;
- modal fits within the dynamic viewport height.

- [ ] **Step 5: Verify keyboard and reduced motion**

Tab through back link, locale/currency menu, thumbnails, actions, disclosures, modal controls, and mobile action. Confirm focus is always visible, dialog focus returns to its trigger, and reduced-motion mode removes nonessential gallery/modal animation.

- [ ] **Step 6: Run format, lint, tests, and production build**

Run:

```bash
npx prettier --check app components lib tests prisma messages
npm run lint
npm test
npm run build
```

Expected: every command exits 0. `npm run build` must run Prisma generation/migrations before the Next.js build; do not substitute `next build`.

- [ ] **Step 7: Review the final diff**

Run:

```bash
git status --short
git diff --check
git diff --stat
```

Confirm only invitation-details feature files are present, generated Prisma client files remain ignored, no environment file is staged, and no unrelated user changes are included.

- [ ] **Step 8: Resolve verification changes through their owning task**

If verification changed a file, return to the task that owns that file, repeat its focused test and commit step with the exact changed paths, then rerun Steps 6 and 7 above. If verification required no changes, do not create an empty commit. The handoff is ready only when `git status --short` contains no uncommitted feature changes.
