# Shared Custom Font Library Design

## Summary

Add one admin-wide custom font library whose families can be reused across themes, invitations, hero text, and Save-the-Date designs. A family can contain multiple weight and style variants uploaded as WOFF2, WOFF, TTF, or OTF files.

The feature preserves the application's current font contract: persisted font choices remain CSS `font-family` strings. Custom selections use a stable, ID-based family token, while relational database records hold the uploaded files and their metadata. This avoids migrating existing theme columns and JSON styling structures.

## Goals

- Let an authenticated admin upload and manage reusable custom font families.
- Support multiple normal and italic variants with weights from 100 through 900.
- Accept WOFF2, WOFF, TTF, and OTF uploads and validate their real contents server-side.
- Detect embedded family, weight, and style metadata, then let the admin correct those values before finalizing the upload.
- Make custom families available in every font-selection surface, including theme roles, invitation text overrides, hero text blocks, and Save-the-Date themes.
- Preserve existing invitations when a family is renamed or archived.
- Make variant replacement explicit and propagate it to every existing consumer.
- Prevent permanent deletion while a family remains referenced.
- Keep public font delivery same-origin, cacheable, and independent of S3 CORS configuration.

## Non-goals

- Converting uploaded files between formats or generating WOFF2 files.
- Font subsetting, variable-font axis controls, optical-size controls, or arbitrary font-stretch variants.
- Per-customer or per-invitation font ownership.
- Upload licensing confirmation or license/source metadata.
- Replacing the current CSS-string font representation with typed objects or foreign keys.
- Changing existing Google Font or built-in font selections.

## Existing System

Theme typography is stored in `Theme` string columns. Per-invitation role and element overrides are stored inside `Invitation.textStyles`, while hero block overrides live in `Invitation.heroTextLayer`. Save-the-Date themes use three string columns and individual Save-the-Date overrides use JSON.

`FontPicker` currently searches Google Fonts, and `useDynamicFont` / `useDynamicFonts` inject Google Fonts stylesheets for non-built-in selections. Media uploads already use authenticated S3 presigned PUT URLs. The custom font library extends these seams rather than creating a parallel typography system.

## Architecture Decision

Use relational custom-font records with stable CSS family tokens.

Each family receives a CSS identifier derived only from its immutable database ID:

```text
'custom-font-<family-id>', <fallback-category>
```

The admin-facing family name can change without changing persisted invitation or theme values. Existing CSS-string fields remain valid, and runtime loaders recognize the `custom-font-` prefix to distinguish a custom family from a built-in or Google family.

Alternatives rejected:

1. Typed font-reference objects would provide stronger persistence semantics but require a coordinated migration of theme columns, JSON overrides, editors, renderers, and duplication logic.
2. Copying complete `@font-face` definitions into each invitation would make replacements and archival inconsistent and would undermine shared reuse.

## Data Model

### `CustomFontFamily`

- `id`: UUID primary key, generated before insertion so `cssFamily` can be derived atomically.
- `name`: trimmed admin-facing name with the admin's preferred capitalization.
- `normalizedName`: unique lowercase, whitespace-normalized name for duplicate detection.
- `cssFamily`: unique immutable identifier in the form `custom-font-<id>`.
- `fallbackCategory`: one of `serif`, `sans-serif`, `display`, `handwriting`, or `monospace`.
- `revision`: positive integer incremented whenever family rendering metadata or any variant changes.
- `archivedAt`: nullable timestamp.
- `createdAt` and `updatedAt`.
- One-to-many relation to variants with cascade deletion after deletion eligibility has been established by the service.

### `CustomFontVariant`

- `id`: UUID primary key.
- `familyId`: parent family foreign key.
- `weight`: integer constrained by application validation to 100 through 900.
- `style`: `normal` or `italic`.
- `format`: `woff2`, `woff`, `ttf`, or `otf`.
- `objectKey`: permanent S3 key. Public clients never receive it.
- `originalFileName`: retained for admin diagnostics only.
- `mimeType`: server-detected delivery MIME type.
- `sizeBytes`: validated object size.
- `checksum`: SHA-256 of the validated bytes.
- `metadata`: JSON containing useful extracted diagnostics that are not part of the rendering contract.
- `revision`: positive integer incremented whenever the variant file or rendering metadata changes.
- `createdAt` and `updatedAt`.
- Unique constraint on `(familyId, weight, style)`.

A family is selectable only after it has at least one valid variant. Variable font files may be accepted as ordinary files only when the parser can expose a single usable weight/style; axis selection and ranges are outside this version.

## Upload and Metadata Flow

1. From the library page or a picker shortcut, the admin chooses one WOFF2, WOFF, TTF, or OTF file.
2. The browser requests an authenticated presigned URL and uploads the file to a random key below `uploads/fonts/pending/`.
3. The browser submits the pending key to an authenticated analysis endpoint.
4. The server verifies the key prefix, obtains the object with a hard 10 MB download limit, calculates SHA-256, identifies the real container format, and parses it with `fontkit` or an equivalent maintained server-side parser.
5. The endpoint rejects malformed files, unsupported containers such as TTC, unparseable metadata, files above 10 MB, and files whose contents do not match a supported format.
6. The endpoint returns detected family, weight, style, format, and safe diagnostic fields. The upload dialog pre-fills these values and allows the admin to correct family name, fallback category, weight, and style.
7. On confirmation, the server revalidates the pending key and creates the family/variant or adds the variant to an existing family.
8. The server copies the validated object to a unique permanent key below `uploads/fonts/<family-id>/`, persists the record transactionally, and then removes the pending object.

Invalid uploads are deleted immediately when possible. Cancelling the dialog triggers best-effort deletion of the pending object. Deployment must also configure a one-day S3 lifecycle rule for `uploads/fonts/pending/` so abandoned browser sessions do not leak storage.

No format conversion occurs. WOFF2 is preferred in the UI for transfer efficiency, but all four accepted formats are served unchanged.

## Variant Creation and Replacement

The unique family/weight/style slot makes variant selection deterministic.

- Adding an unused slot creates a new variant.
- Attempting to add an occupied slot returns HTTP `409 Conflict` with a machine-readable replacement-required code and the existing variant summary.
- The UI must display an explicit confirmation before resubmitting as a replacement.
- Replacement copies the new file to a new unique permanent key before changing the database.
- A database transaction updates the variant metadata and increments its revision.
- The old object is deleted only after the transaction commits.
- If the transaction fails, the new permanent object is removed and the previous variant remains active.
- Failure to remove an obsolete object after a successful commit is logged for operational cleanup and does not roll back the valid database state.

Replacing a slot intentionally updates every invitation and theme using that family. Renaming a family only changes its admin-facing name and never its CSS identifier.

Changing the fallback category changes the CSS stack produced for future selections and the catalog preview. Previously persisted CSS stacks keep their existing generic fallback; the uploaded family itself still resolves through the immutable custom identifier.

## Public Rendering

### Family manifest

A public read-only manifest endpoint accepts a custom family ID and returns only:

- immutable CSS family identifier;
- fallback category;
- family manifest revision;
- active variant IDs, weights, styles, formats, and variant revisions;
- same-origin delivery URLs.

It does not return names intended only for admin management, S3 keys, original filenames, checksums, or extracted metadata. A manifest requested directly by ID remains available when its family is archived.

### Font bytes

A public same-origin route such as `/fonts/<variant-id>?v=<revision>` resolves the registered variant, reads its S3 object, and returns the bytes with:

- the server-detected font MIME type;
- `Cache-Control: public, max-age=31536000, immutable`;
- content length when available;
- no exposure of arbitrary S3 keys.

The revision query changes after replacement, so browsers do not reuse stale bytes. Archived families remain deliverable. Deleted variants return 404.

### Loader behavior

`useDynamicFont` and `useDynamicFonts` become source-aware while retaining their current call signatures:

- built-in families remain no-ops;
- Google families continue injecting Google stylesheet links;
- `custom-font-<id>` values acquire the public manifest and inject one `@font-face` rule per variant.

Each rule declares the stable family identifier, weight, style, source URL, format hint, and `font-display: swap`. Manifests and generated styles are cached by family and revision. Existing reference counting prevents duplicate styles and removes them only when the last active consumer releases the family.

The shared loader covers theme roles, invitation role/element overrides, hero text blocks, and Save-the-Date rendering. It must recognize all custom tokens in a family list even when the same family appears more than once.

## Admin Font Catalog

The catalog entry consumed by `FontPicker` gains a source discriminator: `builtin`, `google`, or `custom`. All sources still produce a CSS font-family value for existing callers.

`FontPicker` changes:

- source filters for All, Custom, and Google;
- custom families before Google families in the All view;
- actual uploaded-font previews;
- available weight/style summaries;
- an Archived badge when an archived family is the current value;
- archived families excluded from new search results;
- an Upload font action opening the shared upload dialog;
- automatic selection of a newly saved family.

The existing picker call sites in `ThemeForm`, `TextStyleToolbar`, and `HeroTextEditor` inherit custom-font support. The Save-the-Date theme form's raw typography inputs are replaced with the same `FontPicker`, covering its title, couple, and date fonts. Save-the-Date per-element text editing continues through the shared dynamic loader.

## Font Library Page

Add a Fonts destination to the authenticated admin sidebar and a dedicated management page. It supports:

- searching active or archived families;
- creating a family from the first uploaded variant;
- previewing a family at each registered weight/style;
- adding missing variants;
- renaming and changing fallback category;
- explicitly replacing an occupied variant;
- archiving and restoring a family;
- requesting permanent deletion and viewing blocking usages.

A family without a committed variant is never shown in normal picker results. The analysis step alone does not create a family record.

## Lifecycle and Deletion Safety

Archiving is the default removal operation. It hides a family from new selections while preserving its manifest and font-byte routes for all existing uses. Restoring it makes it selectable again.

Permanent deletion is available only when no persisted value references the family's stable CSS identifier. The deletion service performs a source-of-truth scan over:

- `Theme.displayFont`, `bodyFont`, `scriptFont`, `uiFont`, and `sectionTitleFont`;
- `SaveTheDateTheme.titleFont`, `coupleFont`, and `dateFont`;
- every string nested in `Invitation.textStyles`;
- every string nested in `Invitation.heroTextLayer`;
- every string nested in `SaveTheDate.textStyles`.

The scan returns identifying details for every blocking theme, invitation, Save-the-Date theme, or Save-the-Date. The API responds with `409 Conflict` and does not delete records or objects while any use exists.

When no usage exists, deletion removes the database family and variants transactionally, then deletes their S3 objects. Object-deletion failures are logged for cleanup, because restoring database records after a committed deletion would not reliably restore referential state.

## API Boundaries

The existing Google Fonts search endpoint remains responsible for Google catalog searches. New authenticated custom-font endpoints cover:

- paginated active/archived family search;
- pending-upload analysis and cancellation;
- family creation with its first variant;
- family rename/category update;
- adding or replacing variants;
- archive and restore;
- deletion eligibility and permanent deletion.

Public endpoints cover only family rendering manifests and registered font bytes. Mutation and management paths are placed under `/api/admin/` and therefore remain protected by the existing middleware matcher. If any new authenticated route falls outside the current matcher, the matcher must be extended in the same change.

## Validation and Errors

Validation trusts server-observed bytes and parser output, not extensions or browser MIME types. User-facing errors distinguish:

- unsupported container;
- corrupt or unparseable font;
- file larger than 10 MB;
- invalid pending key;
- duplicate normalized family name;
- occupied family/weight/style slot;
- interrupted S3 upload;
- storage or database failure;
- deletion blocked by active usages.

Recoverable errors retain the admin's corrected metadata. Retry does not require reselecting the local file while the pending object remains valid. The public endpoints return generic 404 responses for unknown records and never reveal storage configuration.

## Testing Strategy

Vitest remains in its Node environment. Domain logic is split into focused pure modules so it can be tested without adding jsdom or initializing Prisma.

Automated tests cover:

- stable CSS token creation and family-ID extraction;
- supported format sniffing and MIME mapping;
- size limits, corrupt input, spoofed MIME, TTC rejection, and parser failures;
- metadata normalization and admin corrections;
- `@font-face` generation across formats, weights, and styles;
- manifest and variant revision cache keys;
- catalog source filtering, custom-first sorting, and archived-current-value behavior;
- duplicate-family and duplicate-variant conflicts;
- explicit replacement, rollback, and object-cleanup paths using mocked S3 and Prisma boundaries;
- recursive usage detection across the persisted JSON shapes;
- archive, restore, blocked deletion, and unused-family deletion;
- regression behavior for built-in and Google fonts.

Manual acceptance checks cover:

- each accepted upload format;
- regular, bold, and italic variants in one family;
- detected metadata correction;
- replacement updating an already-published invitation;
- selection in theme roles, inline invitation text, hero text, and Save-the-Date themes;
- public invitation and Save-the-Date cold loads;
- archive, restore, and blocked deletion details;
- interrupted upload retry;
- current Chrome, Safari, and Firefox.

## Migration and Rollout

1. Add the two Prisma models, constraints, and migration. Existing font values need no data migration.
2. Deploy storage helpers, validation, admin APIs, public manifest delivery, and the byte route.
3. Deploy the source-aware loader and picker/catalog UI.
4. Add the library page and Save-the-Date picker upgrades.
5. Configure the one-day lifecycle rule on the pending S3 prefix before enabling uploads in production.
6. Verify tests, lint, type checking, the repository's full `npm run build`, and the manual acceptance matrix in a production-like environment.

The feature is backward-compatible: before any custom family is created, persisted records and runtime behavior remain equivalent to the existing application.

## Acceptance Criteria

- An admin can upload any supported format, review detected metadata, correct it, and create a shared family.
- A family supports multiple uniquely identified weight/style variants.
- A custom family appears in every font-selection surface and renders in its preview.
- Selecting a custom font does not change the shape of existing persisted theme or invitation font values.
- Public invitation and Save-the-Date pages load only registered custom font variants through same-origin URLs.
- Explicit replacement updates existing consumers without stale cache behavior.
- Archiving prevents new selection but never breaks existing rendering.
- Permanent deletion is blocked with usage details until all references are removed.
- Built-in and Google fonts continue working as before.
