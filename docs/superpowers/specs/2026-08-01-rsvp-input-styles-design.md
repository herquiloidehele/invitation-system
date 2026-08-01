# RSVP Input Styles Design

## Goal

Allow an administrator to choose the visual style of the RSVP form inputs for each invitation. The chosen style must be consistent between the RSVP modal opened from the invitation page and the dedicated confirmation page at `/confirmar/...`.

## Scope

The feature covers the RSVP configuration on invitation records and the invitation admin editors that modify it. It applies to native text inputs, textareas, selects, attendance radio choices, switches, and custom RSVP fields.

The feature does not change the Save the Date RSVP product, the stored RSVP response shape, validation rules, or the theme-level color palette.

## Style contract

Add a narrow string union for the supported styles:

- `default` — the existing rounded input with a visible border and field background. This is the fallback for all existing invitations and any invalid/missing persisted value.
- `minimal` — a low-chrome editorial treatment with a transparent field surface and only a bottom border. Focus uses the RSVP accent color and keeps a visible keyboard indicator.
- `soft` — a new soft elevated treatment with a quiet field surface, no hard border, a slightly larger radius, and a restrained shadow. Focus strengthens the shadow and uses the accent color without becoming visually heavy.

The style resolver will return the class names and inline CSS values required by the renderers. It will accept the existing RSVP input color overrides, so administrators can still customize background, text, placeholder, and border colors. The resolver will normalize missing or unknown values to `default`.

## Data flow

The selected style is persisted as `rsvp.inputStyle` in the existing `Invitation.rsvp` JSON field. No Prisma schema migration is needed because this is an additive JSON property.

The `InvitationData.rsvp` type and shared RSVP config type will expose the property as optional. When an invitation is read, the existing JSON passthrough will preserve it. When a form is created, the default editor state will explicitly use `default` for a discoverable admin value, while older records remain compatible through resolver fallback.

Both public renderers will resolve the style from the invitation configuration before rendering:

1. `components/shared/RSVPForm.tsx` for the invitation modal.
2. `app/[locale]/confirmar/[slug]/RsvpPage.tsx` for the dedicated confirmation page.

`components/shared/RSVPCustomFields.tsx` will continue to receive shared input styling from its parent, so custom fields automatically match the selected style.

## Admin experience

Add a selector to the RSVP settings section in the standard invitation editor and the external invitation editor. The control will use Portuguese labels:

- `Padrão` — borda e fundo
- `Minimalista` — apenas linha inferior
- `Suave` — fundo leve e sombra discreta

A short helper text will explain that the choice affects the RSVP form. The selected value will be included in the existing `rsvp` payload sent to the admin API. The API already stores the RSVP object as sanitized JSON, so no route or database migration change is required beyond preserving the payload.

## Styling details

The existing label typography, validation messages, submit button, and RSVP layout remain unchanged. Style-specific changes are limited to field surfaces, borders, radii, shadows, and focus treatment.

All interactive controls will retain visible focus states and at least the existing hit areas. Transitions will name exact properties rather than using `transition: all`. The new soft style will use layered, low-opacity shadows instead of a solid border. The minimal style will not rely on color alone: its bottom rule remains visible in both idle and focus states.

## Testing

Add unit tests for the pure style resolver covering:

- every supported style;
- fallback to `default` for missing and unknown values;
- preservation of custom input colors;
- style-specific border, background, radius, and shadow decisions.

Run the existing Vitest suite and the project lint/type/build verification appropriate for the changed files. The build must be run through `npm run build` if used, because this project generates Prisma before Next.js compilation.

## Compatibility and rollout

No existing database rows need backfilling. Existing invitations with no `inputStyle` remain visually unchanged. The admin selector defaults to `default`, and the public resolver treats malformed persisted values as `default`.

## Out of scope

- A theme-wide RSVP style setting.
- New RSVP validation or response fields.
- Changing the standalone Save the Date RSVP form.
- Rebuilding the RSVP form into a new component hierarchy.
