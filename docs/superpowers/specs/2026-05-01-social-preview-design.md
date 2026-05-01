# Social Preview Design (Invitation + Save the Date)

**Date:** 2026-05-01
**Status:** Draft
**Scope:** Add a customizable social preview (image + title + description) to every `Invitation` and every `SaveTheDate`, consumed exclusively by `<head>` Open Graph and Twitter Card meta tags so that shared public links unfurl with a proper preview on WhatsApp, Facebook, iMessage, Telegram, Twitter, Slack, and similar platforms.

---

## Context

When a couple shares a public URL — `https://<host>/{slug}` for an invitation or `https://<host>/s/{slug}` for a Save the Date — third-party platforms scrape that URL's HTML for Open Graph meta tags to render a preview card.

**Invitation (`app/[slug]/page.tsx`).** Today emits no `og:image`, `og:title`, or `og:description`. The problem is most acute for `external_link` invitations, whose visible content lives inside an iframe (typically a Canva embed proxied through `app/canva-proxy/[...path]/route.ts`); third-party scrapers cannot see anything past the wrapper page. `standard` and `external_video` invitations at least render images on the page (`heroImage`, etc.), but the result is unpredictable and not under the couple's control.

**Save the Date (`app/s/[slug]/page.tsx`).** Already has a `generateMetadata` export that emits `openGraph.title` and `openGraph.description` derived from couple names — but no `openGraph.images` array at all. The page itself contains **no top-level image**: the visible content is an animated SVG scratch-off heart, couple names, custom message, and an optional bottom hero section. Scrapers have nothing to choose from, so unfurled links are imageless.

The request is to give admins an explicit "this is the image (and text) used when the link is shared" field on both `Invitation` and `SaveTheDate`, with sensible per-subsystem fallbacks so the feature works even when nothing is set.

---

## Decision

Add a single optional JSON column `socialPreview` to **both** the `Invitation` model and the `SaveTheDate` model. It holds three optional fields: `image`, `title`, `description`. Two pure resolver functions (one per subsystem) apply per-subsystem fallback chains to produce a fully-resolved preview at request time. Each public page's `generateMetadata` reads the resolved values and emits Open Graph and Twitter Card meta tags. The admin UI exposes the three fields in a collapsible "Pré-visualização de partilha" section in both the invitation admin form(s) and the Save the Date admin form.

The image is consumed only by meta tags. It is never rendered inside the public page itself.

---

## Design

### Data Model

A new column on each subsystem's primary table.

`prisma/schema.prisma`:

```prisma
model Invitation {
  // ... existing fields
  socialPreview Json?  // SocialPreview — used only for OG/Twitter meta tags
}

model SaveTheDate {
  // ... existing fields
  socialPreview Json?  // SocialPreview — used only for OG/Twitter meta tags
}
```

Shared TypeScript shape (in `lib/types.ts`):

```ts
export interface SocialPreview {
  image?: string;        // full S3 URL
  title?: string;
  description?: string;
}
```

`socialPreview` is added as an optional field on `InvitationData` (defined in `lib/types.ts`) and on `SaveTheDateData` (defined in `lib/save-the-date.ts`). Both DB-to-domain mappings (`lib/invitations.ts` and `lib/save-the-date.ts`) cast the Prisma JSON value to `SocialPreview` (mirroring how existing JSON fields like `envelope` and `bottomHero` are typed) and expose it on the domain object. The cast is best-effort — defensive resolver behavior covers any unexpected shape.

A single Prisma migration introduces both columns:

```sql
ALTER TABLE "Invitation"   ADD COLUMN "socialPreview" JSONB;
ALTER TABLE "SaveTheDate" ADD COLUMN "socialPreview" JSONB;
```

### Fallback Resolver(s)

A new pure module `lib/social-preview.ts` exports two resolver functions plus shared types and constants:

```ts
export const DEFAULT_OG_IMAGE_PATH = "/og-default.jpg";  // bundled in /public
export const DEFAULT_OG_DESCRIPTION = "Convite digital";

export interface ResolvedSocialPreview {
  image: string;        // absolute URL
  title: string;
  description: string;
  imageSource: "custom" | "hero" | "bottomHero" | "default";
}

export function resolveInvitationSocialPreview(
  invitation: InvitationData,
  siteOrigin: string,
): ResolvedSocialPreview;

export function resolveSaveTheDateSocialPreview(
  saveTheDate: SaveTheDateData,
  siteOrigin: string,
): ResolvedSocialPreview;
```

Both resolvers always return a fully-resolved object with no undefined fields, so the rendering layer never branches.

**Invitation resolver — `resolveInvitationSocialPreview`:**

- **image:** explicit `socialPreview.image` (`"custom"`) → for `standard` and `external_video`, `heroImage` (`"hero"`) → otherwise `${siteOrigin}${DEFAULT_OG_IMAGE_PATH}` (`"default"`).
- **title:** explicit `socialPreview.title` → couple-name formatter (existing util) → final fallback `"Convite"`.
- **description:** explicit `socialPreview.description` → string derived from `eventType` (e.g., "Convite de Casamento" for `wedding`) → final fallback `DEFAULT_OG_DESCRIPTION`.

**Save the Date resolver — `resolveSaveTheDateSocialPreview`:**

- **image:** explicit `socialPreview.image` (`"custom"`) → `bottomHero.mediaUrl` if `bottomHero.enabled && bottomHero.mediaType === "image" && bottomHero.mediaUrl` is non-empty (`"bottomHero"`) → otherwise `${siteOrigin}${DEFAULT_OG_IMAGE_PATH}` (`"default"`).
- **title:** explicit `socialPreview.title` → `"${couple.bride} & ${couple.groom} — Save the Date"` (matches the existing STD `generateMetadata` title at `app/s/[slug]/page.tsx:23` and `:26`) → final fallback `"Save the Date"`.
- **description:** explicit `socialPreview.description` → `"${couple.bride} & ${couple.groom} invite you to save the date: ${date.display}"` (matches the existing page-level description at `app/s/[slug]/page.tsx:24`) → final fallback `"Save the Date"`. Note: today's `openGraph.description` at `app/s/[slug]/page.tsx:27` emits a shorter string (`"Save the date: ${date.display}"`) than the page-level description; consolidating through the resolver intentionally aligns both on the longer page-level string for consistency. This is a deliberate, minor user-visible change for STDs that have no `socialPreview.description` set.

`siteOrigin` is read from an environment variable (`NEXT_PUBLIC_SITE_URL`) at the call site. Both resolvers are pure and take the origin as an argument so they stay trivially testable.

The bundled default image at `public/og-default.jpg` ships at 1200×630 with neutral branding shared by both products. Providing the asset is part of the implementation plan; if it is not supplied at delivery time, a placeholder will be used and flagged.

### Meta Tag Rendering

Both public route entry points add (or extend) the App Router `generateMetadata` export.

**Invitation — `app/[slug]/page.tsx`:**

```ts
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await getInvitationBySlug(slug);
  if (!invitation) return {};

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { image, title, description } = resolveInvitationSocialPreview(invitation, siteOrigin);

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

**Save the Date — `app/s/[slug]/page.tsx`:** the existing `generateMetadata` is extended (not replaced) to call `resolveSaveTheDateSocialPreview` and add the missing `openGraph.images` array plus a `twitter` block. The pre-existing `openGraph.title` / `openGraph.description` derivation is consolidated through the resolver so behavior is consistent (when no override is set, the resolver returns the same strings the page emits today).

Both pages emit meta tags consistently because each resolver returns a fully-populated object. There is no per-type branching at render time.

### Admin UI

A new collapsible section, **"Pré-visualização de partilha"**, is added to three places:

1. `app/admin/invitations/ExternalInvitationForm.tsx` — covers the `external_link` and `external_video` invitation subtypes.
2. The standard invitation admin form (the file holding the form for `invitationType === "standard"`; located during planning) — covers the `standard` subtype.
3. `app/admin/save-the-dates/SaveTheDateForm.tsx` — covers Save the Date. Added as a new `AccordionItem` at the bottom of the existing accordion, after "Secção Inferior" (Bottom Hero).

Section contents (identical across all three forms):

- Helper text at the top: *"Esta imagem aparece quando o link é partilhado em apps como WhatsApp, Facebook ou iMessage. Recomendado: 1200×630 pixels."*
- `MediaUpload` component for the image, reusing `components/admin/MediaUpload.tsx` with the `images` folder and the existing 5 MB / format limits.
- Optional text input for `socialPreview.title`. Placeholder shows the current fallback (couple names, etc.) so the admin sees what will be used if left blank.
- Optional textarea for `socialPreview.description`. Placeholder shows the current fallback.
- A small, presentational `<SocialPreviewCard>` component below the inputs that previews the unfurled card in a WhatsApp-style layout. It receives the resolved values so admins immediately see how fallbacks affect the output.

`<SocialPreviewCard>` is shared across both subsystems. It is purely presentational and receives a `ResolvedSocialPreview` plus an optional URL to display under the card.

Form state holds `socialPreview` as a nested object.

**Invitation API (admin):** the existing POST/PUT routes (`app/api/admin/invitations/route.ts`, `app/api/admin/invitations/[id]/route.ts`) accept the new field, run it through the existing `sanitizeJsonField()` helper, and persist to the new column.

**Save the Date API (admin):** the existing POST/PUT routes (`app/api/admin/save-the-date/route.ts`, `app/api/admin/save-the-date/[id]/route.ts`) currently do **no JSON sanitization** for any field. As part of this change, `sanitizeJsonField()` is applied to **every** JSON-shaped field handled by these two routes — `envelope`, `textStyles`, `rsvp`, `audio`, `bottomHero`, and the new `socialPreview` — bringing STD route handling in line with the invitation routes. This is a deliberate broader change documented in the verification section so reviewers can validate it does not regress existing fields.

### Scope Boundaries

This change does **not** include:

- Owner-token API exposure (`/api/owner/[token]/...`) for invitations. Admin-only for this iteration. Save the Date already has no owner-token write path, so no analog applies.
- Automatic Open Graph scraping of `externalLink` destinations.
- An in-app preview card that gates entry into the iframe — the image is meta-tag-only.
- Image cropping or strict dimension enforcement in the upload UI; only a recommended-size hint.
- Twitter-specific overrides (e.g., `twitterImage` distinct from `ogImage`).
- Per-locale variants of title/description.
- Backfill of `socialPreview` for existing rows in either subsystem. Existing rows simply use the fallback chain until edited.
- Rendering the social preview image inside the public page itself (it remains meta-tag-only).
- Any change to the Save the Date public view, the iframe proxy, or audio behavior.

---

## Implementation Notes

- New file: `lib/social-preview.ts` — shared types, constants (`DEFAULT_OG_IMAGE_PATH`, `DEFAULT_OG_DESCRIPTION`), and both resolvers (`resolveInvitationSocialPreview`, `resolveSaveTheDateSocialPreview`).
- New file: `public/og-default.jpg` — bundled 1200×630 default image (asset to be provided; placeholder otherwise).
- New migration: `prisma/migrations/<ts>_add_social_preview/migration.sql` adds the column to **both** tables in a single migration.
- New presentational component: `components/admin/SocialPreviewCard.tsx` — pure UI, no fetching, used in all three admin forms.
- Modified (invitation side): `prisma/schema.prisma`, `lib/types.ts` (add `SocialPreview`, extend `InvitationData`), `lib/invitations.ts` (read mapping), `app/api/admin/invitations/route.ts` (create payload + sanitization), `app/api/admin/invitations/[id]/route.ts` (update payload), `app/[slug]/page.tsx` (`generateMetadata`), `app/admin/invitations/ExternalInvitationForm.tsx`, the standard invitation admin form.
- Modified (Save the Date side): `prisma/schema.prisma`, `lib/save-the-date.ts` (add `socialPreview` to `SaveTheDateData` + read mapping), `app/api/admin/save-the-date/route.ts` (apply `sanitizeJsonField()` to all JSON fields including the new one), `app/api/admin/save-the-date/[id]/route.ts` (same), `app/s/[slug]/page.tsx` (extend `generateMetadata`), `app/admin/save-the-dates/SaveTheDateForm.tsx` (new AccordionItem at bottom).
- The `sanitizeJsonField()` helper currently lives in `app/api/admin/invitations/route.ts` (lines 11–26). Move it to `lib/json.ts` (or similar shared module) so both subsystems can import it without cross-route imports. This is a small refactor in service of the broader STD sanitization change above.
- Environment: `NEXT_PUBLIC_SITE_URL` must be set in deployment so absolute OG URLs resolve correctly. Document in `.env.example` if present.

---

## Verification

**Unit tests (Vitest) for `resolveInvitationSocialPreview`:**

- Custom values present → returned verbatim, `imageSource: "custom"`.
- No custom values, `standard` type with `heroImage` → image falls back to `heroImage`, `imageSource: "hero"`.
- No custom values, `external_link` type → image falls back to absolute default URL, `imageSource: "default"`.
- Title fallback to couple names; description fallback to event-type-derived string and final default.

**Unit tests (Vitest) for `resolveSaveTheDateSocialPreview`:**

- Custom values present → returned verbatim, `imageSource: "custom"`.
- No custom values, `bottomHero.enabled && mediaType === "image"` with non-empty `mediaUrl` → image falls back to `bottomHero.mediaUrl`, `imageSource: "bottomHero"`.
- No custom values, `bottomHero` disabled → image falls back to absolute default URL, `imageSource: "default"`.
- No custom values, `bottomHero.mediaType === "video"` → image falls back to default (video URL is **not** used), `imageSource: "default"`.
- Title fallback to `"${bride} & ${groom}"`; description matches the string previously emitted by the existing `generateMetadata` so behavior is unchanged when no override is set.

**Smoke tests for both `generateMetadata` exports:** with a fixture record, assert returned `Metadata` contains the expected `openGraph.images[0].url`, `openGraph.title`, `openGraph.description`, and `twitter.images`.

**Manual — Invitation:**
- Edit an `external_link` invitation, upload a social preview image, save, then unfurl the public URL via WhatsApp, the Facebook Sharing Debugger, and [opengraph.xyz](https://opengraph.xyz). Confirm the uploaded image, title, and description appear.
- Edit a `standard` invitation with no `socialPreview` set → confirm `heroImage` appears in the unfurled card.
- Create an `external_link` invitation with no `socialPreview` set → confirm the bundled default image appears.

**Manual — Save the Date:**
- Edit a Save the Date, upload a social preview image, save, then unfurl `https://<host>/s/{slug}` via WhatsApp, the Facebook Sharing Debugger, and opengraph.xyz. Confirm the uploaded image, title, and description appear.
- Confirm a Save the Date with `bottomHero.enabled && mediaType === "image"` and no explicit `socialPreview` uses the bottom-hero image in the unfurled card.
- Confirm a Save the Date with `bottomHero` disabled and no `socialPreview` shows the bundled default image.
- For a Save the Date with no `socialPreview.description` set, confirm the unfurled card shows the longer page-level description (`"... invite you to save the date: ..."`) rather than the previously shorter `openGraph.description` (`"Save the date: ..."`). This is the documented intentional consolidation.

**Manual — STD JSON sanitization regression:**
- Save a Save the Date with empty strings inside `envelope.coverBackground`, `audio.src`, and `bottomHero.mediaUrl`; confirm those fields persist as expected (sanitizer behavior matches what invitation routes already do for the same shapes).
- Save a Save the Date with an envelope hex color (e.g., `#ffffff`) → confirm color is preserved (sanitization must not mangle non-empty strings).
- Toggle `audio.enabled` from true to false with a non-empty `audio.src` → confirm src is retained or cleared per existing behavior; document any deliberate change.

**Run** the project's typecheck (`npm run typecheck` or equivalent) and the Vitest suite.
