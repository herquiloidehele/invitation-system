# Standard Invitation Gift Selection Design

## Goal

Bring the complete gift experience currently available in the elegant-floral invitation to the default standard invitation while preserving the standard template's own visual language. Hosts must have the same gift configuration controls regardless of which of these two invitation templates they use.

## Scope

The standard invitation will support:

- an editable gift-section title and introductory message;
- a gift-list accordion backed by either the internal gift list or the legacy external list URL;
- the existing theme-colored confetti transition before opening the internal gift list;
- immediate navigation for visitors who prefer reduced motion;
- preservation of locale and personalized guest token when navigating to the gift list;
- the existing gift reservation and exclusive-selection behavior on the gift-list page;
- a bank-transfer accordion with optional introductory text;
- flexible bank-detail rows and optional copy buttons with success feedback;
- responsive layout, keyboard operation, and visible focus states.

This work does not change the gift database schema, reservation APIs, or gift-list page behavior. It does not add new host configuration fields.

## Architecture

Gift behavior that is independent of a template will move into shared components or helpers under `components/gifts/` and `lib/`. This includes confetti-assisted internal navigation and copyable bank values. The standard and elegant-floral templates will compose these primitives inside their own presentation components.

The standard invitation will receive a dedicated gift-section component rather than importing the elegant-floral section. The component will accept the invitation gift registry, theme and text/card style data, slug, locale, and optional guest token. The standard page remains responsible for placing it in the existing dress-code/gifts region and for edit-mode wrappers.

The elegant-floral section will retain its current appearance and behavior while using shared primitives where practical. The extraction must not change its public output.

## Standard Template Presentation

The current compact standard gift card will become a complete themed panel. It will use the invitation's configured section card background, border, radius, accent, typography, and text overrides so it adapts to every standard theme.

The panel contains:

1. The existing editable gift title and introductory message.
2. A “Lista de Presentes” accordion when internal gift items exist or a legacy external link exists.
3. A “Transferência Bancária” accordion when at least one non-empty bank detail exists.

The two accordion rows use the standard template's visual tokens and quiet motion. Only the confetti interaction is celebratory; surrounding animation remains consistent with the standard invitation. Empty controls are omitted instead of showing disabled rows.

For an internal list, the expanded registry accordion presents the existing localized gift-list call to action. Activating it fires confetti using the invitation primary, secondary, accent, and white colors for the same duration as elegant-floral, then navigates to the localized gift-list path with the guest token. With reduced motion enabled, navigation occurs immediately and no confetti runs. When no internal items exist but a legacy external link does, the call to action opens that URL in a new tab without confetti.

The bank accordion shows its optional introduction followed by configured non-empty rows. Copyable rows expose a labeled copy control. Successful copying temporarily changes the control to its success state. Clipboard failure leaves the control unchanged and must not break the page.

## Admin Experience

The existing invitation form is the source of truth for both templates. It already includes:

- section enablement;
- exclusive gift selection;
- introductory message;
- legacy external gift-list link;
- gift item name, image, price, link, ordering, addition, and removal;
- bank-transfer introduction;
- bank row label, value, copyability, ordering, addition, and removal.

Implementation will verify that these controls are not gated by the elegant-floral template and that new and existing standard invitations receive safe defaults for optional arrays and flags. Any necessary correction will reuse the same form state and API payload rather than create template-specific fields.

## Data Flow

The admin form saves the existing `GiftRegistry` JSON through the existing invitation API. Public invitation loading continues to deserialize that object unchanged. The standard gift section uses `hasGiftItems` and `hasBankTransfer` to determine which accordions to render. The internal list CTA uses `giftsPagePath` plus the active locale convention and guest token. The existing gift-list route and reservation APIs handle availability, ownership, selection, replacement, and release.

## Error and Accessibility Behavior

- Missing or empty gift content does not render an empty accordion.
- A failed clipboard call does not show false success or throw into the UI.
- Repeated gift-list activation while confetti is running is ignored to avoid duplicate navigation.
- Accordion buttons use native button semantics, expose expanded state, and remain keyboard accessible.
- Focus indicators use theme-aware contrast.
- Motion honors `prefers-reduced-motion`.
- External links use `noopener noreferrer`.

## Testing and Verification

Development follows test-first coverage for shared behavior and render decisions. Tests will establish:

- internal gift items select the internal localized/token-preserving path;
- a legacy external link remains the fallback when there are no internal items;
- bank-transfer visibility requires meaningful configured content;
- reduced motion bypasses confetti delay;
- shared helpers preserve existing elegant-floral behavior;
- standard invitation defaults and admin serialization retain all gift fields.

After focused tests pass, run the full Vitest suite, ESLint, and `npm run build`. Verify the standard invitation in a browser at mobile and desktop widths, including accordion keyboard behavior, theme blending, confetti, bank-value copying, and navigation back from the gift-list page.

## Non-goals

- Redesigning the standalone gift-list/reservation page.
- Adding payment processing or bank-transfer submission.
- Changing reservation ownership rules.
- Adding template-specific gift data fields.
- Changing the elegant-floral visual design.
