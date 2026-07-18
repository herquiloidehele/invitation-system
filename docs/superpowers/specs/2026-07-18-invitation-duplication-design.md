# Invitation Duplication

## Purpose

Administrators need to create an invitation for a new customer by starting
from an existing invitation. The duplicate must preserve the source design and
editable configuration while remaining independent from the source and
starting without any customer activity.

Duplication is a draft-first workflow. Opening the duplication screen does not
write to the database. The new invitation and its independent theme are
created only after the administrator reviews the prefilled form, changes the
customer identity, supplies a new slug, and submits it.

## Scope

The first version supports both invitation editors:

- internal/standard invitations;
- external video invitations;
- external link invitations.

Save the Date duplication is out of scope. Save the Dates use separate models,
themes, forms, and RSVP relations and should be designed as a separate feature.

## User Flow

Duplication is available from two places:

- a `Duplicar convite` action on each row of the invitation list;
- a `Duplicar convite` secondary action on an invitation edit screen.

Both actions navigate to:

`/admin/invitations/[id]/duplicate`

The server page loads the source invitation and available themes. It converts
the source into duplication-safe initial data and renders the same form family
used to edit the source:

- `InvitationForm` for an internal/standard invitation;
- `ExternalInvitationForm` for an external video or external link invitation.

The page displays:

- the title `Duplicar convite`;
- a banner explaining that a new invitation is being created from the named
  source and that changes do not affect the original;
- the source customer names, prefilled and marked for review;
- an empty, required slug;
- the selected source theme and a note that an independent theme copy will be
  created;
- the primary action `Criar convite duplicado`.

Cancelling, navigating back, or abandoning the page creates no records.

## Form Modes

Both invitation forms gain a `duplicate` mode alongside their existing
`create` and `edit` modes. Duplicate mode:

- uses the duplication-safe initial data;
- keeps the preview and all editable controls available;
- treats name editing like create mode, including automatic slug and monogram
  derivation, while still allowing the generated slug to be edited;
- allows the administrator to select a different theme;
- submits to the dedicated duplication endpoint;
- does not expose an owner link or guest list because the invitation does not
  exist yet;
- disables submission while the request is running;
- preserves the form state after a validation or server error;
- redirects to the new invitation edit page after success.

The theme selected at submission time is the theme that is copied. It defaults
to the source invitation's theme.

## Duplication Contract

### Editable Invitation Data

The duplicate draft copies all editable invitation content and configuration.
The administrator may change any of it before saving. This includes:

- `couple`, `date`, `quote`, `location`, and `location2`;
- `rsvp`, including enabled state, deadline, presentation settings, and custom
  questions;
- `schedule`, `scheduleStyle`, `dressCode`, and `giftRegistry`, including gift
  items;
- `audio`, `heroImage`, `heroHeight`, `heroOverlay`,
  `heroScrollIndicator`, `videoUrl`, `videoPoster`, and `heroMediaFit`;
- `curtainVideoUrl`, `curtainVideoPoster`, `heroRevealSeconds`, `heroTopText`,
  `heroTapPrompt`, and `heroTextLayer`;
- `imageLayer`, `faqs`, `guestGuide`, `envelope`, and `coverVideos`;
- `saveDateStyle`, `cinematicImageUrl`, `sectionImages`, and `coupleGallery`;
- `places`, `parents`, `ourStory`, `scratchReveal`, `heroConfetti`,
  `countdown`, and `personalGuestCard`;
- `textStyles`, `cardStyles`, `spacingStyles`, `imageSettings`, and
  `customTexts`;
- `eventType`, `invitationType`, and `externalLink`;
- `guestManagementEnabled`, `ownerCanAddGuests`, and
  `guestMessageTemplate`;
- `socialPreview`.

All image, audio, and video URLs are reused as stored. Duplication does not copy
S3 objects. Uploading replacement media through either invitation continues to
produce a new object URL, so replacing media in one invitation does not update
the other invitation record.

### Reset Invitation Data

The following values are reset in the duplicate draft or forced by the server:

- `slug` starts empty and must be supplied;
- `isDemo` is always `false`;
- `priceFromCents` is `null`;
- `discountPriceFromCents` is `null`;
- `priceOverrides` is `null`;
- `currency` resets to `EUR`;
- `landingModelName` is `null`;
- `landingImageUrl` is `null`;
- `landingDescription` is `null`;
- `landingSubtitle` is `null`;
- `landingCustomizationLevel` resets to `fully_customizable`.

The server never accepts a copied invitation ID, owner token, creation time, or
update time. Prisma generates a new invitation ID, owner token, `createdAt`,
and `updatedAt`.

### Relations That Are Not Copied

The new invitation starts with no operational or customer-specific relations:

- no `Guest` records or guest-specific tokens and links;
- no `RsvpResponse` records;
- no `GiftReservation` records or management tokens;
- no `LandingFeature` records.

Guest-management settings and message templates are invitation configuration,
so they are copied even though the guest list starts empty. RSVP configuration
is copied even though responses start empty. Gift-registry configuration and
items are copied even though reservations start empty.

### Independent Theme

The submitted theme is copied into a new `Theme` row. The new theme copies:

- description and layout;
- envelope configuration;
- page, card, border, palette, and text colors;
- display, body, script, UI, and section-title typography;
- CTA colors, borders, text, radius, and glow;
- monogram and tap-text colors;
- gradient and decorative settings.

Theme media URLs inside JSON fields are reused rather than copied in S3.

The new theme receives:

- a new Prisma ID;
- new timestamps;
- a unique internal `name` based on the selected theme name and new invitation
  slug;
- a `label` containing the selected theme label and the new customer display
  name.

If the preferred theme name already exists, the server appends an incrementing
numeric suffix. The new invitation connects only to this copied theme. Later
theme edits therefore cannot affect the source invitation.

## Customer Identity Validation

The administrator must deliberately change the customer identity before the
duplicate can be created.

Identity comparison trims whitespace, collapses repeated internal whitespace,
and compares case-insensitively. For a wedding, the normalized pair is compared
without relying on name order, so swapping the two source names does not count
as a new customer. For a single-name event, the normalized primary name is
compared.

The endpoint rejects:

- missing names according to the event type;
- an identity equal to the source identity;
- a missing or invalid slug;
- a slug already used by another invitation;
- a missing or nonexistent selected theme.

The slug must be lowercase kebab-case as produced by the existing
`buildInvitationSlug` helper: letters without diacritics, digits, and single
hyphens, with no leading or trailing hyphen. The initial availability check
improves the error message, while the database unique constraint handles
concurrency races.

## Server Architecture

No Prisma migration is required. The existing `Invitation` to `Theme`
relationship already permits every duplicate to own a separately created
theme, and the existing relation defaults generate the required tokens and
timestamps.

### Duplicate Page

The duplicate page performs a read-only server query for the source invitation
and its theme. A missing source uses the normal not-found response.

The page uses a pure duplication mapper to:

1. hydrate the complete admin invitation data;
2. clear the slug;
3. reset demo, price, and landing catalogue fields;
4. remove system identity;
5. retain the selected theme and all editable content.

It then chooses the appropriate existing form from `invitationType`.

### Duplicate Endpoint

The form submits to:

`POST /api/admin/invitations/[id]/duplicate`

The source ID comes from the route, not the request body. The endpoint:

1. parses the edited draft;
2. reloads the source invitation needed for identity comparison;
3. validates the customer identity, slug, and selected theme;
4. normalizes invitation fields through the shared create-data mapper;
5. opens a Prisma transaction;
6. allocates a collision-safe theme name and creates the independent theme;
7. creates the invitation connected to that theme, while forcing all reset
   values;
8. commits both records and returns the new invitation ID.

Only the theme and invitation are created in the transaction. No nested writes
create guests, confirmations, reservations, or landing placements.

If either create fails, the transaction leaves neither record behind.

### Shared Create Mapper

The existing ordinary invitation `POST` route currently contains the complete
field-by-field create mapping inline. That mapping should be extracted into a
shared server-side create-data function and reused by:

- ordinary invitation creation;
- invitation duplication.

The mapper is an explicit allowlist. It applies the existing JSON sanitizers,
event-type normalization, object-fit validation, spacing sanitization, price
normalization, landing customization normalization, and defaults. Duplication
adds its forced reset values after normalization so a browser payload cannot
restore demo or catalogue data.

This keeps the large invitation field contract in one place and prevents
ordinary creation and duplication from silently diverging as fields are added.

### Duplication Helpers

`lib/invitation-duplication.ts` owns pure, independently testable rules for:

- building duplication-safe form initial data;
- normalizing and comparing customer identities;
- deriving a preferred theme name and suffixed candidates;
- deriving the copied theme label;
- building theme create data while omitting IDs, unique identity, and
  timestamps.

The UI must not implement or be the sole enforcer of these rules.

## Security and Trust Boundaries

The page and endpoint are covered by the existing middleware matchers for
`/admin/*` and `/api/admin/*`.

The endpoint treats the browser draft as untrusted:

- the source comes from the route and database;
- the selected theme is reloaded by ID;
- invitation data passes through the same sanitizers as ordinary creation;
- IDs, tokens, timestamps, demo state, prices, and landing catalogue fields
  are generated or forced on the server;
- child relations cannot be supplied in the request.

## Error Handling

Expected endpoint outcomes are:

- `400` for invalid fields, unchanged customer identity, or a selected theme
  that no longer exists;
- `404` if the source invitation was removed;
- `409` if the requested invitation slug already exists or loses a
  concurrency race;
- `201` with the new invitation ID after successful creation;
- `500` for an unexpected transaction or database failure.

Known Prisma unique-constraint failures for the invitation slug are translated
to `409`. Theme-name allocation uses suffix candidates; a collision does not
overwrite an existing theme.

The form shows field-specific guidance for unchanged identity and slug
conflicts. Unexpected errors use the existing toast pattern. A failed request
does not clear the draft.

## UI Integration

A shared navigation helper returns
`/admin/invitations/${id}/duplicate`. It is used by:

- the invitation-list row action;
- the standard invitation edit header;
- the external invitation edit header.

The row action stops event propagation so it does not trigger the row's edit
navigation. It includes a visible tooltip/title and screen-reader label.

Duplicate mode reuses both existing forms rather than introducing parallel
forms. Owner-link and guest-management panels that require a persisted
invitation remain hidden until the duplicate has been created and the browser
has redirected to edit mode.

## Testing

The project remains on its Node-only Vitest environment. DOM-dependent tests
are not added.

### Unit Tests

Add tests for:

- copying all editable invitation field categories;
- clearing the slug and resetting every demo, price, and landing field;
- preserving guest-management, RSVP, and gift-registry configuration;
- excluding system identity and all child relations;
- reusing media URLs unchanged;
- producing standard, external video, and external link drafts;
- customer identity comparison across casing and whitespace;
- treating swapped wedding names as the same source customer;
- accepting a genuinely different wedding pair or single-name customer;
- accepting lowercase kebab-case slugs and rejecting malformed slugs;
- copying all theme fields while omitting ID, name, label, and timestamps;
- generating preferred and numeric-suffix theme names;
- generating a theme label from the new customer display name;
- generating duplicate navigation paths.

### Route Tests

Use the repository's existing Prisma mocking patterns to test:

- source not found;
- invalid or unchanged customer identity;
- missing or deleted selected theme;
- pre-existing invitation slug;
- successful theme and invitation creation in one transaction;
- forced reset values despite conflicting browser input;
- no nested creation of guests, RSVP responses, gift reservations, or landing
  features;
- unique-slug race translated to `409`;
- transaction failure returning `500` without a successful result.

### Regression and Manual Verification

Run:

- focused duplication tests;
- the complete Vitest suite;
- ESLint;
- `npm run build`, never `next build` directly.

Manually verify:

- list and edit-screen entry points;
- standard, external video, and external link source invitations;
- empty slug and prefilled customer names;
- editable theme selection and the independent-copy notice;
- unchanged-identity and slug-conflict errors preserving the draft;
- disabled submission during the request;
- cancellation producing no records;
- successful redirect to the new invitation edit page;
- a new owner link and empty guest/confirmation/reservation state;
- editing the duplicated theme does not change the source invitation.

## Acceptance Criteria

The feature is complete when:

- an administrator can start duplication from the list or either edit form;
- opening or abandoning duplication causes no database writes;
- both invitation form families open with the source content prefilled;
- the slug is empty and the source customer identity cannot be submitted
  unchanged;
- successful submission atomically creates one independent theme and one
  invitation;
- the duplicate reuses media URLs but shares no theme record or operational
  relations with the source;
- the duplicate receives fresh system identity and starts as a non-demo,
  non-catalogue customer invitation;
- all specified errors are handled without losing the draft;
- automated tests, lint, and the project build pass.
