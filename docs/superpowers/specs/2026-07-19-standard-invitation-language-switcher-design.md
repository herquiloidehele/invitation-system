# Standard Invitation Language Switcher Design

**Date:** 2026-07-19

## Summary

Add opt-in multilingual support to standard invitations. An admin can enable
Portuguese, English, and/or Spanish per invitation, enter translations through
one language-aware editing mode, and preview the selected language. Guests can
change between the enabled languages from the top-right corner of the
invitation hero after opening the envelope.

Portuguese remains the canonical source language. Missing translations fall
back to the existing Portuguese value, allowing invitations to be published
with incomplete translations.

In this design, a standard invitation means an invitation whose
`invitationType` is `standard`, including its theme-specific renderers. It does
not include `external_link`, `external_video`, or the separate Save the Date
product.

## Goals

- Let an admin activate a language switcher per standard invitation.
- Keep Portuguese mandatory and let the admin enable English and Spanish
  independently.
- Translate built-in interface copy with the existing `next-intl` messages.
- Support translations for every guest-visible, admin-authored text.
- Keep non-text content and invitation structure shared by all languages.
- Preserve existing invitations and their current Portuguese data without a
  content migration.
- Keep the guest inside the opened invitation when changing language.

## Non-Goals

- Automatic or machine translation.
- Arbitrary locales beyond `pt`, `en`, and `es`.
- Translator accounts, review states, or translation approval workflows.
- Locale-specific media, styling, dates, times, URLs, phone numbers, payment
  values, or list structure.
- Language switching for external-link invitations, external-video
  invitations, or Save the Date products.
- Translating admin-only landing metadata, social-preview overrides, guest
  management messages, or internal operational copy.

## Product Rules

1. Portuguese is the canonical source language and cannot be disabled.
2. The switcher is active only when `languageSwitcherEnabled` is true and at
   least one of English or Spanish is enabled.
3. Turning the feature or an individual language off preserves its saved
   translations.
4. A missing or blank English/Spanish translation renders the Portuguese
   source value.
5. Built-in interface copy uses the requested locale when the invitation has
   no Portuguese per-invitation override for that key.
6. Guests who request a locale that is not effective for the invitation are
   redirected to Portuguese with their query parameters preserved.
7. The switcher appears only inside the invitation hero, in its top-right
   corner. It is not displayed on the unopened envelope.
8. Switching language preserves the personal guest token and returns to the
   hero without replaying the envelope.

## Persistence Model

Add three fields to `Invitation`:

```prisma
languageSwitcherEnabled Boolean  @default(false)
enabledLocales           String[] @default(["pt"])
translations             Json?
```

`enabledLocales` records the admin's selection, including selections preserved
while the feature is off. Effective public locales are derived rather than
stored:

```ts
effectiveLocales =
  languageSwitcherEnabled && enabledLocales includes at least one of "en" | "es"
    ? normalized enabledLocales
    : ["pt"];
```

`translations` is a sparse JSON overlay keyed by the non-source locale:

```ts
type TranslationLocale = "en" | "es";

interface InvitationTranslations {
  en?: InvitationTranslationOverlay;
  es?: InvitationTranslationOverlay;
}
```

The overlay contains text only. It must not duplicate shared booleans, media,
layout settings, dates, times, URLs, coordinates, phone numbers, payment
values, IDs, or ordering.

## Translation Coverage

The overlay supports the following admin-authored guest copy:

- Invitation quote.
- Location and secondary-location names and addresses.
- Schedule labels and venue text.
- Dress-code text, headings, notes, labels, and palette color names.
- Gift introduction, gift item names, bank-transfer introduction, and
  bank-detail labels. Prices, links, and bank-detail values remain shared.
- Hero top text and free-positioned hero text block content.
- FAQ questions and answers.
- Guest-guide item labels.
- Gallery title and image captions.
- Places section titles, place titles, and place descriptions.
- Parents-mode blessing and invitation messages. Person names remain shared.
- Our Story title and description.
- RSVP custom-field labels and option labels.
- All per-invitation `customTexts` overrides.

Names of the couple, monograms, dates, times, audio metadata, phone numbers,
URLs, and other identifiers remain shared. Date-derived display strings
continue to come from the existing locale-aware formatters.

## Stable Identity for Repeated Content

Translations for repeated items are keyed by item ID, never by array index.
This prevents translations from moving to the wrong item after reordering.

The following existing repeated entities already have IDs and keep using them:

- Gift items and bank-transfer rows.
- Guest-guide items.
- Place sections and place items.
- Hero text blocks.
- RSVP custom fields and their options.

Add optional stable IDs to repeated translatable entities that do not currently
have them:

- `ScheduleEvent`
- `FAQItem`
- `DressColor`
- `CoupleGalleryImage`

The admin hydration layer normalizes missing or duplicate IDs. Existing
invitations receive IDs when they are first opened and saved in the admin
editor; no eager data backfill is required. Public rendering continues to
accept legacy items without IDs, which have no translations and therefore use
their Portuguese values.

## Translation Overlay Shape

The overlay mirrors fixed objects and uses ID-keyed records for repeated
content. The exact TypeScript interface is maintained in one domain module,
but follows this structure:

```ts
interface InvitationTranslationOverlay {
  quote?: string;
  heroTopText?: string;
  location?: { name?: string; address?: string };
  location2?: { name?: string; address?: string };
  schedule?: Record<string, { label?: string; venue?: string }>;
  dressCode?: {
    text?: string;
    title?: string;
    intro?: string;
    ladies?: { label?: string; note?: string };
    gentlemen?: { label?: string; note?: string };
    reservedNote?: string;
    palette?: Record<string, { name?: string }>;
  };
  giftRegistry?: {
    text?: string;
    bankTransferText?: string;
    items?: Record<string, { name?: string }>;
    bankTransfer?: Record<string, { label?: string }>;
  };
  heroTextBlocks?: Record<string, { content?: string }>;
  faqs?: Record<string, { question?: string; answer?: string }>;
  guestGuideItems?: Record<string, { label?: string }>;
  coupleGallery?: {
    title?: string;
    images?: Record<string, { caption?: string }>;
  };
  places?: {
    sections?: Record<
      string,
      {
        title?: string;
        items?: Record<string, { title?: string; description?: string }>;
      }
    >;
  };
  parents?: { blessingMessage?: string; inviteMessage?: string };
  ourStory?: { title?: string; description?: string };
  rsvpCustomFields?: Record<
    string,
    {
      label?: string;
      options?: Record<string, { label?: string }>;
    }
  >;
  customTexts?: CustomTexts;
}
```

## Domain Boundaries

Create a focused invitation-translation domain module responsible for:

- Normalizing locale settings.
- Computing effective locales.
- Normalizing IDs on repeated translatable content.
- Sanitizing sparse translation JSON.
- Reading and writing translation paths for the admin editor.
- Merging an overlay onto the Portuguese invitation.

The public merger has the conceptual interface:

```ts
function localizeInvitation(
  source: InvitationData,
  locale: AppLocale,
): InvitationData;
```

It returns a new object and never mutates the source invitation. It merges only
known translatable strings. Shared structure and non-text values always come
from the Portuguese source object.

The custom-text resolution order for a non-Portuguese locale is:

1. Locale-specific `customTexts` override.
2. Portuguese per-invitation `customTexts` override.
3. Built-in `messages/{locale}.json` value.
4. The existing loud missing-key behavior from `next-intl`.

This preserves the agreed Portuguese fallback without preventing built-in
system copy from using English or Spanish when the admin has not customized
the Portuguese text.

## Public Request Flow

For a public standard invitation request:

1. Load the canonical invitation and theme.
2. Normalize its locale settings and compute effective locales.
3. If the requested locale is not effective, redirect to the Portuguese path
   while preserving all search parameters.
4. Localize the canonical invitation with the requested locale.
5. Resolve the guest token against the canonical invitation as today.
6. Render the localized invitation and existing locale-aware system messages.

Metadata and structured data use the same localized invitation. Canonical and
alternate links list only effective invitation locales, with Portuguese as
`x-default`.

The same locale policy and localization step apply to guest-facing routes that
render invitation-owned copy:

- `/{slug}/gifts`
- `/confirmar/{slug}`

This keeps gift names and copy, standalone RSVP labels, and RSVP custom fields
consistent with the language selected on the invitation. Submission and
reservation APIs continue using canonical IDs and structure; localization
never changes validation identity or inventory state.

The locale-policy and localization helpers remain pure and independently
testable. Admin pages continue loading the canonical source invitation plus its
translation settings; they do not use the public localized mapper.

## Admin Experience

Add an `Idiomas` section to the standard invitation form:

- An activation switch.
- Portuguese shown as mandatory and locked.
- Independent English and Spanish selections.
- Inline validation when activation is attempted with no additional language.

When active, a single editing-language selector appears above the form and live
preview:

- Portuguese is selected initially.
- Portuguese mode reads and writes the existing invitation fields.
- English and Spanish modes read and write their sparse overlays.
- Empty translated inputs show the Portuguese source as fallback guidance but
  do not persist a duplicate value.
- Clearing a translation deletes that overlay leaf and restores fallback.

Translation-aware field bindings use a shared editor provider/helper rather
than duplicating a complete localized form object. Child editors for gifts,
places, guest guides, hero text, galleries, dress code, schedules, FAQs, and
RSVP custom fields consume that shared binding contract.

In English or Spanish mode:

- Existing repeated items can have their text translated.
- Adding, deleting, and reordering repeated items is disabled with guidance to
  switch to Portuguese.
- Shared media, style, URL, date, time, phone, and payment controls continue to
  edit the canonical value.
- The preview is wrapped in a locale-specific `NextIntlClientProvider` and
  receives `localizeInvitation(form, activeLocale)`.

Disabling the feature or a locale does not clear translation data. Explicit
activation controls are non-destructive; removing saved translation content
requires clearing the translated fields themselves.

## Guest Switcher

Use one shared `InvitationLanguageSwitcher` component across standard
invitation renderers. Each renderer places it within its hero positioning
context at the top-right corner.

The switcher:

- Renders only when the invitation type is `standard`, the feature is active,
  and at least two locales are effective.
- Shows compact `PT`, `EN`, and `ES` choices only for effective locales.
- Exposes full localized language names and current-state semantics to
  assistive technology.
- Uses a legible translucent surface, safe-area-aware spacing, and a stacking
  order above hero media and decorative layers but below dialogs.
- Preserves the current guest token and other query parameters.
- Adds `section=hero` to the destination so the existing standard-invitation
  section-entry behavior skips the envelope after navigation.
- Does not render on the unopened envelope.

In the admin preview, the same visual component changes the editor's active
language through a callback instead of navigating away from `/admin`.

## Validation and Error Handling

Server-side normalization:

- Deduplicates locale codes and orders them as `pt`, `en`, `es`.
- Always inserts Portuguese.
- Drops unsupported locale codes.
- Accepts translations only under `en` and `es`.
- Accepts only known translation fields with string leaves.
- Trims values to decide whether they are empty, removes empty leaves, and
  preserves the original non-empty value including intentional internal line
  breaks.
- Removes empty objects and empty locale overlays.
- Ensures repeated translatable items have unique stable IDs before saving.

The admin client prevents enabling an invalid configuration. The create and
update APIs also reject `languageSwitcherEnabled: true` unless at least one
additional supported locale is enabled, returning a clear `400` response.

Public localization is defensive. Unknown keys, wrong value types, missing
item IDs, and malformed fragments are ignored so the Portuguese source remains
renderable. A malformed translation must never make the invitation fail.

Redirect construction uses the existing locale-path helpers and explicitly
preserves search parameters to avoid dropping personal guest links.

## Backward Compatibility and Migration

- The database migration adds safe defaults and does not rewrite invitation
  content.
- Existing invitations are effectively Portuguese-only until an admin opts in.
- Legacy repeated items without IDs render as before.
- Create, edit, duplicate, seed, public mapping, and admin hydration flows must
  include the new persistence fields.
- Invitation duplication copies locale settings and translations while the
  existing duplicate flow continues generating a new slug and owner token.
- Turning the feature off restores Portuguese-only routing without deleting
  translations.

## Testing Strategy

### Pure domain tests

- Normalize locale selections, including duplicates and unsupported codes.
- Compute effective locales for enabled, disabled, and incomplete settings.
- Sanitize unknown fields, wrong types, blank strings, and empty overlays.
- Merge scalar and nested translated fields.
- Merge repeated content by stable ID and preserve translations after reorder.
- Fall back per field when translations are missing, blank, or malformed.
- Keep shared values and structure canonical.
- Confirm localization does not mutate its source input.
- Assign unique IDs to missing or duplicate repeated items and preserve those
  IDs after saving.

### Persistence and mapper tests

- Create-data mapping stores all three new fields.
- Update routing accepts, sanitizes, and clears translation data correctly.
- Admin initial-data hydration round-trips locale settings and translations.
- Public invitation mapping exposes the settings needed by locale policy.
- Duplication copies settings and translation overlays.

### Routing, metadata, and switch-link tests

- Requests for effective locales render without redirect.
- Disabled or unsupported invitation locales redirect to Portuguese.
- Redirects preserve `g`, `section`, and arbitrary query parameters.
- Gift and standalone RSVP pages enforce the same effective-locale policy and
  receive the same localized invitation copy.
- Switch links preserve query parameters and set `section=hero`.
- Canonical, alternate, Open Graph, and JSON-LD data use localized content and
  list only effective locales.

### Admin and renderer wiring tests

- The switcher visibility predicate requires a standard invitation, activation,
  and at least two effective locales.
- The switcher is wired inside each supported standard hero and not the
  envelope.
- Admin language changes select the correct overlay and locale messages.
- Translation modes prevent structural mutations of repeated content.
- Clearing a translated field restores the Portuguese fallback.

### Verification

- Run focused Vitest files during each task.
- Run the complete `npm test` suite.
- Run `npm run lint`.
- Regenerate Prisma with `npm run db:generate`.
- Run TypeScript/build verification using repository-approved commands; never
  invoke `next build` directly.

## Acceptance Criteria

- Existing invitations behave as Portuguese-only with no admin action.
- An admin can enable Portuguese plus English and/or Spanish on a standard
  invitation.
- One form-level selector changes every translatable input and the preview to
  the selected editing language.
- The admin can save incomplete translations without losing Portuguese
  content.
- Every agreed guest-visible admin text resolves in the selected locale or
  falls back to Portuguese.
- Gift and standalone RSVP pages retain the selected invitation language.
- The guest switcher appears only in the hero's top-right corner after the
  envelope opens.
- Switching language keeps personal guest links intact and does not replay the
  envelope.
- Direct access to a disabled locale redirects to Portuguese.
- Reordering repeatable content never attaches translations to the wrong item.
- External-link, external-video, and Save the Date experiences remain
  unchanged.
