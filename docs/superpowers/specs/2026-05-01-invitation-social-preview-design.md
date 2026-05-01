# Invitation Social Preview Design

**Date:** 2026-05-01
**Status:** Draft
**Scope:** Add a customizable social preview (image + title + description) to every invitation, consumed exclusively by `<head>` Open Graph and Twitter Card meta tags so that shared invitation links unfurl with a proper preview on WhatsApp, Facebook, iMessage, Telegram, Twitter, Slack, and similar platforms.

---

## Context

When a couple shares the public invitation URL `https://<host>/{slug}`, third-party platforms (WhatsApp, Facebook, iMessage, etc.) scrape that URL's HTML for Open Graph meta tags to render a preview card. Today the public page emits no `og:image`, `og:title`, or `og:description`, so previews are either empty or use whatever the scraper guesses.

This is most acute for `external_link` invitations. Their visible content lives inside an iframe (typically a Canva embed proxied through `app/canva-proxy/[...path]/route.ts`); third-party scrapers cannot see anything past the wrapper page, so they have nothing to fall back to. `standard` and `external_video` invitations at least render images on the page (`heroImage`, etc.), so scrapers can pick something — but the result is unpredictable and not under the couple's control.

The request is to give admins an explicit "this is the image (and text) used when the link is shared" field on every invitation, with sensible fallbacks so the feature works even when nothing is set.

---

## Decision

Add a single optional JSON column `socialPreview` to the `Invitation` model. It holds three optional fields: `image`, `title`, `description`. A pure resolver function applies a per-type fallback chain to produce a fully-resolved preview at request time. Next.js's `generateMetadata` API in `app/[slug]/page.tsx` reads the resolved values and emits Open Graph and Twitter Card meta tags. The admin UI exposes the three fields in a collapsible "Pré-visualização de partilha" section shown in both the standard invitation form and the external invitation form.

The image is consumed only by meta tags. It is never rendered inside the invitation page itself.

---

## Design

### Data Model

A single new column on `Invitation` (`prisma/schema.prisma`):

```prisma
socialPreview Json?  // SocialPreview — used only for OG/Twitter meta tags
```

TypeScript shape (in `lib/types.ts`):

```ts
export interface SocialPreview {
  image?: string;        // full S3 URL
  title?: string;
  description?: string;
}
```

`socialPreview` is added as an optional field on `InvitationData` and on the read-mapping in `lib/invitations.ts`. All three nested fields are optional; an absent column or empty object means "use the fallback chain entirely".

Sanitization on write reuses the existing `sanitizeJsonField()` helper in `app/api/admin/invitations/route.ts` so empty strings inside the object are normalized and a fully-empty object is stored as `Prisma.JsonNull` rather than `{}`.

A single Prisma migration introduces the column:

```sql
ALTER TABLE "Invitation" ADD COLUMN "socialPreview" JSONB;
```

### Fallback Resolver

A new pure module `lib/social-preview.ts` exports `resolveSocialPreview(invitation, siteOrigin)`. It always returns a fully-resolved object with no undefined fields, so the rendering layer never branches:

```ts
export interface ResolvedSocialPreview {
  image: string;        // absolute URL
  title: string;
  description: string;
  imageSource: "custom" | "hero" | "default";
}
```

Resolution rules per field:

- **image:** explicit `socialPreview.image` → for `standard` and `external_video`, fall back to `heroImage` (a required field on those types) → otherwise fall back to a bundled default at `public/og-default.jpg`, returned as an absolute URL using `siteOrigin`.
- **title:** explicit `socialPreview.title` → fall back to the existing couple-name formatter (e.g., "Ana & Bruno") → final fallback `"Convite"`.
- **description:** explicit `socialPreview.description` → fall back to a string derived from `eventType` (e.g., "Convite de Casamento" for `wedding`) → final fallback `"Convite digital"`.

`siteOrigin` is read from an environment variable (`NEXT_PUBLIC_SITE_URL`) at the call site. The resolver itself is pure and takes the origin as an argument so it stays trivially testable.

The bundled default image at `public/og-default.jpg` ships at 1200×630 with neutral branding. Providing the asset is part of the implementation plan; if it is not supplied at delivery time, a placeholder will be used and flagged.

### Meta Tag Rendering

`app/[slug]/page.tsx` adds (or extends) the App Router `generateMetadata` export:

```ts
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await getInvitationBySlug(slug);
  if (!invitation) return {};

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { image, title, description } = resolveSocialPreview(invitation, siteOrigin);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "website",
      url: `${siteOrigin}/${slug}`,
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
```

This emits meta tags consistently for all three invitation types because the resolver does. There is no per-type branching at render time.

### Admin UI

A new collapsible section, **"Pré-visualização de partilha"**, is added to two places:

1. `app/admin/invitations/ExternalInvitationForm.tsx` — covers the `external_link` and `external_video` subtypes.
2. The standard invitation admin form (the file holding the form for `invitationType === "standard"`; located during planning) — covers the `standard` subtype.

Section contents:

- Helper text at the top: *"Esta imagem aparece quando o link do convite é partilhado em apps como WhatsApp, Facebook ou iMessage. Recomendado: 1200×630 pixels."*
- `MediaUpload` component for the image, reusing `components/admin/MediaUpload.tsx` with the `images` folder and the existing 5 MB / format limits.
- Optional text input for `socialPreview.title`. Placeholder shows the current fallback (e.g., the couple names) so the admin sees what will be used if left blank.
- Optional textarea for `socialPreview.description`. Placeholder shows the current fallback.
- A small, presentational `<SocialPreviewCard>` component below the inputs that previews the unfurled card using a WhatsApp-style layout. It receives the resolved values so admins immediately see how fallbacks affect the output.

Form state holds `socialPreview` as a nested object. The existing admin POST/PUT routes (`app/api/admin/invitations/route.ts`, `app/api/admin/invitations/[id]/route.ts`) accept the new field, run it through `sanitizeJsonField()`, and persist to the new column. The Prisma read mapping in `lib/invitations.ts` casts the JSON value to `SocialPreview` (mirroring how existing JSON fields like `envelope` and `location` are typed) and exposes it on the domain object. The cast is best-effort — defensive resolver behavior covers any unexpected shape.

### Scope Boundaries

This change does **not** include:

- Owner-token API exposure (`/api/owner/[token]/...`). Admin-only for this iteration.
- Automatic Open Graph scraping of `externalLink` destinations.
- An in-app preview card that gates entry into the iframe — the image is meta-tag-only.
- Image cropping or strict dimension enforcement in the upload UI; only a recommended-size hint.
- Twitter-specific overrides (e.g., `twitterImage` distinct from `ogImage`).
- Per-locale variants of title/description.
- Backfill of `socialPreview` for existing invitations. Existing rows simply use the fallback chain until edited.

---

## Implementation Notes

- New file: `lib/social-preview.ts` — pure resolver and constants (`DEFAULT_OG_IMAGE_URL`, `DEFAULT_OG_DESCRIPTION`).
- New file: `public/og-default.jpg` — bundled 1200×630 default image (asset to be provided; placeholder otherwise).
- New migration: `prisma/migrations/<ts>_add_invitation_social_preview/migration.sql`.
- New presentational component: `components/admin/SocialPreviewCard.tsx` — pure UI, no fetching.
- Modified: `prisma/schema.prisma` (add column), `lib/types.ts` (add `SocialPreview`, extend `InvitationData`), `lib/invitations.ts` (read mapping), `app/api/admin/invitations/route.ts` (create payload + sanitization), `app/api/admin/invitations/[id]/route.ts` (update payload), `app/[slug]/page.tsx` (`generateMetadata`), `app/admin/invitations/ExternalInvitationForm.tsx` (admin section), the standard invitation admin form.
- Environment: `NEXT_PUBLIC_SITE_URL` must be set in deployment so absolute OG URLs resolve correctly. Document in `.env.example` if present.
- Reuse `sanitizeJsonField()` for the `socialPreview` payload to mirror the pattern used for `envelope`, `location`, and similar JSON columns.

---

## Verification

- Unit tests (Vitest) for `resolveSocialPreview`:
  - Custom values present → returned verbatim, `imageSource: "custom"`.
  - No custom values, `standard` type with `heroImage` → image falls back to `heroImage`, `imageSource: "hero"`.
  - No custom values, `external_link` type → image falls back to absolute default URL, `imageSource: "default"`.
  - Title fallback to couple names; description fallback to event-type-derived string and final default.
- Smoke test for `generateMetadata` with a fixture invitation: assert returned `Metadata` contains the expected `openGraph.images[0].url`, `openGraph.title`, `openGraph.description`, and `twitter.images`.
- Manual: edit an `external_link` invitation, upload a social preview image, save, then unfurl the public URL via WhatsApp, the Facebook Sharing Debugger, and [opengraph.xyz](https://opengraph.xyz). Confirm the uploaded image, title, and description appear.
- Manual: with a `standard` invitation that has no `socialPreview` set, confirm `heroImage` appears in the unfurled card.
- Manual: with a fresh `external_link` invitation that has no `socialPreview` set, confirm the bundled default image appears.
- Run the project's typecheck and Vitest suite.
