# Custom Invitation Landing Section

## Objective

Add a concise call-to-action section immediately after the landing-page Gallery. It should reassure visitors who did not find a suitable model that Brindeal can create a completely original invitation for them.

The section must communicate three facts without requiring another interaction:

- The invitation is designed from scratch for the client's event.
- The project costs the converted equivalent of EUR 250.
- The minimum production time is one month.

The primary action starts a WhatsApp conversation about a custom invitation.

## Position in the Page

Render the new section between `GallerySection` and `ProcessSection` in `BrindealHomepage`.

This placement makes the section a direct answer to a visitor who has just finished browsing the available models. It also leads naturally into the existing explanation of Brindeal's working process.

Do not add a navigation item for this section. It is a contextual alternative to the Gallery, not a new top-level destination.

## Approved Content

Portuguese content:

- Eyebrow: `Uma alternativa só sua`
- Heading: `Ainda não encontrou o convite certo?`
- Body: `Criamos consigo um convite totalmente original, pensado de raiz para refletir o estilo do seu evento.`
- Price label: `preço do projeto`
- Timeline value: `1 mês`
- Timeline label: `prazo mínimo`
- CTA: `Criar o meu convite`
- CTA note: `Abre no WhatsApp`
- WhatsApp message: `Olá! Gostaria de criar um convite 100% personalizado.`

English and Spanish versions must carry the same meaning and use natural wording rather than literal word-for-word translation.

The displayed price is a fixed project price, not a “starting from” price. Therefore, the section must not add the existing `Desde` price prefix.

## Visual Design

Use the approved “minimal strip” direction.

The section is a quiet horizontal band that visually pauses the page after the denser model Gallery. It uses the current Brindeal landing tokens and typography:

- A restrained `primary-soft` or equivalent pale brand surface.
- Existing foreground and muted-foreground colours.
- Outfit, matching the landing page.
- The existing pill-style primary button.
- No photography, card collage, icon grid, or new decorative typeface.

On desktop, use three aligned areas inside the existing `max-w-7xl` content width:

1. Eyebrow, heading, and supporting copy.
2. Price and minimum timeline.
3. WhatsApp CTA and its short note.

The information areas may use subtle vertical separators. The heading remains the dominant element; price and duration are secondary factual anchors.

On mobile, stack the three areas in the same order. Place price and duration side by side, separated from the copy with quiet horizontal rules. Make the CTA full-width.

Use the same reveal behaviour as other landing sections through `AnimatedSection`. All motion must respect the existing reduced-motion handling. Hover treatment should be limited to the CTA.

## Component and Data Design

Create a focused `CustomInvitationSection` landing component. `BrindealHomepage` passes its existing `currentCurrency` value to it.

Keep the EUR base price in a small client-safe landing helper as `25_000` cents. The helper converts that amount through the existing `deriveCents` currency configuration. Format the converted amount with the existing `formatCurrencyAmount` utility and the appropriate entry from `CURRENCY_LOCALE`.

This reuses the same manually configured rates, clean rounding, symbols, and grouping as the model prices:

- EUR
- MZN
- AOA
- BRL
- USD

The section does not accept per-currency overrides. Its displayed value is always derived from the EUR 250 base price.

Pass the localized custom-invitation message directly to the existing `buildWhatsappUrl` function. Do not add a second URL builder and do not reuse `buildPurchaseMessage`, because this request is not tied to a model title.

Add a `LandingCustomInvitation` namespace to all three message files:

- `messages/pt.json`
- `messages/en.json`
- `messages/es.json`

No database, Prisma schema, API route, or admin configuration is required.

## Interaction and Accessibility

The CTA is a normal anchor that opens the existing Brindeal WhatsApp number in a new tab with the localized message URL-encoded.

Use the existing WhatsApp icon and include a descriptive accessible label. Preserve visible keyboard focus and adequate contrast. The price and timeline are text, not badges or interactive controls.

There is no loading, empty, or failure state because the section has no asynchronous data dependency. `currentCurrency` is already constrained to the supported currencies by the landing-page currency resolver.

## Testing and Verification

Add node-environment unit coverage for the pure custom-invitation pricing and WhatsApp behaviour:

- EUR returns and formats the EUR 250 base price.
- At least one non-EUR currency uses the shared conversion and clean rounding rules.
- The formatted custom price has no `Desde` prefix.
- The WhatsApp URL contains the correctly encoded localized custom-invitation message.

Run:

- The relevant Vitest files.
- `npm test`.
- `npm run lint`.
- `npm run build`, which must be used instead of invoking `next build` directly.

Visually verify desktop and mobile layouts, keyboard focus, the WhatsApp target, and reduced-motion behaviour.

## Out of Scope

- A custom-invitation enquiry form or modal.
- Saving enquiries in the database.
- Admin editing of this section or its price.
- Per-currency price overrides.
- Analytics events.
- Changes to the existing Gallery, Process, navigation, or model purchase flow.
