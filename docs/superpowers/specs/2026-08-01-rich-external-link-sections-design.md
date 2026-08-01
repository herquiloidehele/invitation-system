# Rich External Link Sections Design

**Date:** 2026-08-01

**Status:** Approved design

## Goal

Allow `external_link` invitations using `RichExternalLinkPage` to display the existing Couple Gallery, Gifts, and FAQs sections after the Canva embed, with the same persisted configuration and admin preview controls available to standard invitations.

## Context

The application already stores `coupleGallery`, `giftRegistry`, `faqs`, `cardStyles`, and `spacingStyles` on `InvitationData`. The standard invitation editor and renderer already support these fields. `RichExternalLinkPage` currently renders the hero, scratch reveal, countdown, personal guest card, Canva embed, Places, and inline RSVP, while `ExternalInvitationForm` only exposes external-specific sections and countdown card editing.

The existing gallery and gifts implementations are shared components. FAQ rendering is currently embedded in `InvitationPage`, so it needs a focused extraction before both page types can reuse it.

## Approved approach

Extend the rich external page and external invitation editor directly. Do not refactor the entire standard invitation composition and do not render a nested `InvitationPage`. This keeps the scope limited to the requested sections, preserves the existing external-link lifecycle, and reuses the current data contract and editor components.

## Rendering and order

After `CanvaEmbed`, render the following sections in order:

1. `CoupleGallery`, when `shouldRenderCoupleGallery(invitation)` is true.
2. The existing shared `GiftsSection`, wrapped with the same `EditableCard` configuration used by `InvitationPage`, when `invitation.giftRegistry.enabled` is true.
3. The extracted shared FAQ section, when `invitation.faqs` contains items.
4. The existing `PlacesSection`.
5. The existing inline RSVP section, subject to its current rule that it appears only while the Canva iframe is on its initial page.

The rich page keeps its existing hero, scratch reveal, countdown, personal guest card, and Canva placement. Decorative breaks should follow the current rich-page ornament style so the new sections fit the external layout without importing the standard page's unrelated date, schedule, or footer composition.

## Reusable component boundaries

### Couple Gallery

Reuse `components/shared/gallery/CoupleGallery.tsx` unchanged. Pass the existing invitation, theme, and preview flag. Its current helper remains responsible for enabled state, valid-image filtering, style selection, autoplay defaults, captions, and lightbox behavior.

### Gifts

Reuse `components/shared/GiftsSection.tsx` unchanged. Supply the resolved text styles, the `giftRegistry` card style, slug, guest token, and custom-text translator exactly as the standard page does. This preserves the existing gift registry link, product-list navigation, bank-transfer accordion, guest-token propagation, and reservation behavior.

### FAQs

Extract the current FAQ accordion item and section markup from `components/shared/InvitationPage.tsx` into a focused shared component, for example `components/shared/FaqSection.tsx`. The component should accept the invitation, theme, preview flag, resolved text styles, and FAQ data through the existing invitation object; it should own its open-item state and preserve:

- localized FAQ section title and custom text behavior;
- `EditableText` hooks for section title, question, and answer elements;
- the current animated accordion interaction;
- `EditableCard sectionKey="faqs"` and card-style overrides;
- standard-page and rich-page preview behavior.

`InvitationPage` will consume the extracted component so the standard and rich pages do not drift.

## Rich-layout gate

Expand `hasRichExternalSections()` in `lib/external-invitation-form.ts` to include the requested content and the already-rendered Places section. The helper remains restricted to `external_link` invitations and returns true when any of these are active:

- hero media;
- countdown;
- scratch reveal;
- Couple Gallery with renderable images;
- enabled Gifts section;
- one or more FAQ items;
- renderable Places content;
- RSVP enabled and configured for the external page.

The helper should use the existing `shouldRenderCoupleGallery()` and `shouldRenderPlaces()` predicates where applicable. Empty gallery/image and Places configurations must not switch a bare external link into the rich layout.

## Admin configuration parity

Extend `app/admin/invitations/ExternalInvitationForm.tsx` with the same configuration controls already used in `app/admin/invitations/InvitationForm.tsx`:

- Couple Gallery: enablement, gallery style, autoplay where applicable, title, ordered image upload/list, captions, image focal position, zoom, and structure-lock behavior.
- Gifts: enablement, exclusive gift selection, introductory text, legacy registry link, gift item CRUD with image/name/price/link, bank-transfer text, and bank-transfer row CRUD with structure-lock behavior.
- FAQs: question/answer CRUD, stable ids, placeholders for duplicated/source data, and structure-lock behavior.

The existing default external-invitation state should include safe empty values for these fields so create-mode previews and updates remain controlled. Existing persisted `initialData` must continue to pass through unchanged.

The external preview should use the complete `form.cardStyles` and `form.spacingStyles` with `InlineCardEditProvider`, plus the existing text-style provider. The general `updateCardStyle` and section-spacing updater should replace the countdown-only adapter. Gift and FAQ cards therefore expose the same background, border, radius, accent, and section-spacing controls as standard invitations. Gallery retains its gallery-specific controls; it is not converted into a card section because the standard renderer does not treat it as one.

No Prisma migration or admin API contract change is required: the existing invitation update route already sanitizes and persists these JSON fields.

## Data flow

```text
ExternalInvitationForm state
        │
        ├── existing invitation admin API update
        │       └── InvitationData JSON fields
        │
        └── live preview
                ├── InlineTextEditProvider
                ├── InlineCardEditProvider
                └── RichExternalLinkPage
                        ├── CanvaEmbed
                        ├── CoupleGallery
                        ├── GiftsSection
                        ├── FaqSection
                        ├── PlacesSection
                        └── inline RSVP
```

The public route continues to choose between bare and rich external-link rendering through `hasRichExternalSections()`. Once the rich page is selected, the Canva iframe remains mounted for preloading and the new sections render from the same request-level `InvitationData` object.

## Testing and verification

Add or extend tests to verify:

- `hasRichExternalSections()` returns true for each new section independently when its render predicate is satisfied.
- Empty gallery images, empty Places sections, disabled gifts, and empty FAQ arrays do not activate the rich layout by themselves.
- The rich page source uses the shared gallery, gifts, and FAQ components and preserves existing Places/RSVP placement.
- The external editor source includes the three configuration editors and full preview-provider wiring.
- Existing FAQ behavior remains covered through the extracted component's source/render contract.

Run the focused Vitest files first, then `npm test`, `npm run lint`, and the repository-required `npm run build` command. The build must be invoked through the npm script so Prisma generation and migration deployment happen as configured by the repository.

## Acceptance criteria

- An external-link invitation configured with any one of Couple Gallery, Gifts, FAQs, or Places displays the scrollable rich layout after the envelope.
- The public order is Canva embed → Couple Gallery → Gifts → FAQs → Places → RSVP.
- Existing standard invitations retain their current section behavior and visual output.
- External-invitation admins can configure every field already available for these sections in the standard editor.
- Inline preview changes to supported text, card, and spacing styles are reflected immediately and persist through the existing save flow.
- No new database schema or parallel section data model is introduced.
