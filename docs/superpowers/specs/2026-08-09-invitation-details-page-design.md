# Invitation Details Page Design

## Goal

Add a dedicated, localized product-details page between the public home-page catalogue and each live invitation. The page should help a visitor understand a design, preview it in context, and request it through WhatsApp without losing the polished visual character of Brindeal Studio.

The first version supports both full invitations and Save the Date designs.

## Chosen Direction

Use an editorial gallery layout inspired by a refined product page, adapted to invitations rather than retail goods.

The defining visual is an asymmetric media gallery paired with a quiet, sticky information column. The page should feel modern, minimal, fresh, and romantic. Imagery carries most of the emotional weight; type, spacing, and restrained controls keep the page easy to scan.

### Desktop

- A compact Brindeal navigation bar sits above the product area.
- The primary area is split into an asymmetric gallery on the left and a sticky details panel on the right.
- The details panel contains the product type, model name, localized price, short description, capability tags, primary WhatsApp action, secondary live-preview action, and expandable information.
- Two concise editorial statements below the primary area reinforce customization and mobile sharing without turning the page into a long marketing landing page.

### Mobile

- The gallery becomes a large primary image with swipeable or tappable thumbnails.
- Product information follows in one readable column.
- The WhatsApp request action remains available in a compact sticky bottom area.
- The live-preview action stays within the content, above the expandable details.

### Motion and Interaction

- Gallery changes use short, interruptible opacity and transform transitions.
- Buttons use subtle tactile press feedback.
- The preview modal opens and closes with restrained opacity and scale transitions.
- Reduced-motion preferences disable nonessential movement.
- Every interactive control has a visible focus state and a minimum 40-by-40-pixel hit area.

## User Flow

1. A visitor selects a model card on the home page.
2. The card navigates to that model's localized details page instead of opening the invitation or desktop quick-preview modal.
3. The visitor reviews imagery, price, included capabilities, customization details, and ordering guidance.
4. Selecting **View live invitation** opens the existing phone-style iframe preview in a modal.
5. The modal also offers **Open full screen**, which opens the real invitation experience in a new tab.
6. Selecting **Request this invitation** opens WhatsApp using the existing localized purchase-message flow.

The same flow applies to full invitations and Save the Date products.

## Routing and Visibility

Use an explicit localized details route under the public design namespace so it cannot collide with the existing public invitation slug routes. The route includes the product kind and slug, for example:

- `/pt/modelos/convite/amalfi`
- `/pt/modelos/save-the-date/golden-heart`

Only a product referenced by an enabled public landing feature may resolve to a details page. A missing, invalid, or unpublished product returns the standard not-found page.

Home-page model cards link to the new details URL. The current desktop quick-preview behavior is removed from those cards because previewing moves into the details page. Modifier-click and standard browser navigation continue to work naturally.

## Content Model

Reuse existing product fields wherever possible:

- model name;
- landing subtitle and description;
- customization level;
- localized price and discount price;
- viewer currency;
- invitation or Save the Date preview URL;
- landing image and existing invitation media.

Add one optional detail-page marketing gallery field to both `Invitation` and `SaveTheDate`. It stores an ordered list of curated image URLs. Images do not require localized variants.

### Hybrid Gallery Resolution

The gallery resolver builds one ordered, de-duplicated list:

1. dedicated marketing-gallery images;
2. the existing landing image;
3. suitable product media already attached to the invitation.

For a full invitation, fallback media may include the hero image and existing couple-gallery imagery. For a Save the Date, fallback media may include its landing image and image-based bottom-hero media. Empty, invalid, and repeated URLs are ignored.

The page must still look intentional with one image. It must never render empty gallery slots.

## Page Content

The main information panel contains:

- localized product-type eyebrow;
- model name;
- localized price, including an existing discount presentation when applicable;
- landing description;
- short capability tags derived from the product type and customization level;
- primary WhatsApp request action;
- secondary live-preview action;
- three expandable sections: **What’s included**, **Customization**, and **How ordering works**.

Accordion content is centralized, localized copy selected by product type and customization level. The first version does not add per-product accordion overrides. This keeps administration simple and avoids duplicating product copy across records.

If a price is absent, the price block is omitted. The page does not invent a value or show a misleading placeholder.

## Component Boundaries

### Server Route

The route validates locale, product kind, slug, and public landing visibility. It resolves the viewer currency, localized landing metadata, price, gallery media, preview URL, WhatsApp message inputs, and SEO metadata before rendering.

### Shared Details Page

A shared page component renders both product types from a normalized view model. It does not query the database directly.

### Focused Client Components

- `ProductMediaGallery`: active image, thumbnails, keyboard navigation, and mobile media selection.
- `ProductDetailsPanel`: product copy, pricing, capability tags, and actions.
- `ProductDetailsAccordions`: localized informational sections with accessible disclosure behavior.
- `ProductPreviewDialog`: existing phone iframe preview plus the full-screen link.
- `MobileRequestBar`: compact mobile-only sticky WhatsApp action.

The existing phone preview, currency formatting, landing localization, and WhatsApp helpers remain the source of truth rather than being reimplemented.

## Data Flow

1. The route receives locale, product kind, and slug.
2. A server-side resolver finds an enabled landing feature for that product.
3. The resolver localizes product metadata, computes viewer-currency pricing, resolves the hybrid gallery, and creates canonical detail and preview URLs.
4. The server passes a serializable normalized view model to the shared page.
5. Client state is limited to gallery selection, accordion state, and preview-dialog visibility.
6. WhatsApp and full-screen preview actions use normal links, preserving browser behavior and accessibility.

## SEO

Each page receives localized metadata using the model name, landing description, primary resolved gallery image, canonical details URL, and language alternates. Product pages remain indexable only when their underlying landing feature is public and enabled.

## Failure and Empty States

- Unknown locale handling follows the existing locale resolver.
- Unknown product kind, missing product, or non-public product returns not-found.
- Missing curated gallery media falls back to existing product media.
- A single resolved image renders as a complete composition without thumbnails.
- Missing price omits the price UI.
- A preview load failure remains contained inside the dialog and offers the full-screen link as a recovery path.
- An unavailable WhatsApp configuration must not produce a broken action; the page omits or disables the action according to the existing WhatsApp helper contract.

## Testing and Verification

### Unit Tests

- details URL generation for both product kinds and locales;
- product-kind parsing and invalid-kind rejection;
- enabled landing-feature visibility rules;
- hybrid gallery ordering, de-duplication, invalid-value filtering, and one-image behavior;
- localized product metadata and informational copy selection;
- regular, discounted, and absent-price presentation inputs;
- WhatsApp purchase-message inputs;
- SEO metadata inputs and canonical paths.

### Browser Verification

- desktop sticky panel and asymmetric gallery;
- mobile gallery, content flow, and sticky request bar;
- preview dialog open, close, focus handling, and full-screen link;
- keyboard operation for gallery, accordions, dialog, and actions;
- Portuguese, English, and Spanish content;
- supported currencies and long translated text;
- reduced-motion behavior;
- one-image, no-price, and preview-failure states.

## Scope Boundaries

This work does not add checkout, a shopping cart, direct payment, product variants, per-product accordion copy, or a new invitation renderer. Ordering continues through WhatsApp, and the live preview continues to use the existing invitation experiences.
