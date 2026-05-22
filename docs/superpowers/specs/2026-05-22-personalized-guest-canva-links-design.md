# Personalized Guest Canva Links Design

## Goal

Support optional personalized Canva invitation links for registered guests on external-link invitations, while keeping the invitation-level Canva link as the default fallback.

## Context

The system already supports guest management for standard invitations. Each guest receives a personal invitation URL with `?g=<token>`, and the public invitation route resolves that token to a public-safe guest object. External-link invitations currently render the invitation-level `externalLink` through the existing Canva proxy/embed flow.

External invitations are edited through `app/admin/invitations/ExternalInvitationForm.tsx`, which currently does not include the `Gestão de Convidados` accordion available in `app/admin/invitations/InvitationForm.tsx`.

## Scope

This feature covers invitation guest records only. It does not apply to Save the Date guests, RSVP records, or standard invitation content.

Included behavior:

- Admins can enable guest management from the external invitation form.
- Admins can edit the guest message template from the external invitation form.
- Admins can manage guests from the external invitation form after the invitation is saved.
- Admins can optionally set a personalized Canva/external link on each guest.
- Guests without a personalized link continue to see the default invitation external link.
- Invalid, missing, or mismatched guest tokens continue to fall back silently to the default invitation behavior.

Excluded behavior:

- Owners using `/confirmacoes/[token]` cannot set or edit personalized Canva links.
- Guests who self-register cannot set personalized Canva links.
- The guest row does not need inline editing or a personalized-link status badge.
- External-video invitations ignore personalized guest links.
- Standard invitations ignore personalized guest links.

## Data Model

Add an optional field to `Guest`:

```prisma
customExternalLink String?
```

The field stores a guest-specific Canva/external URL. A null or empty value means the guest uses the invitation-level `Invitation.externalLink`.

This requires a Prisma migration and generated client refresh through the existing project scripts.

## Admin Form Behavior

`ExternalInvitationForm` should include a `Gestão de Convidados` accordion matching the standard invitation form.

The accordion contains:

- A switch bound to `form.guestManagementEnabled`.
- A textarea bound to `form.guestMessageTemplate`, defaulting to `DEFAULT_GUEST_MESSAGE_TEMPLATE`.
- The existing `GuestListEditor` when editing an already-saved invitation.
- A save-first message when creating a new external invitation.

The guest list should use the admin guest API path:

```ts
`/api/admin/invitations/${initialData.id}/guests`
```

This keeps personalized-link editing admin-only.

## Guest Form Behavior

`GuestForm` should support an explicit prop such as:

```ts
showCustomExternalLink?: boolean;
```

When the prop is true, the form shows an optional text input labeled `Link Canva personalizado`. The field maps to `customExternalLink` in `GuestUpsertInput`.

When the prop is false or omitted, the field is not rendered and is not submitted. Owner-token guest management continues using the existing form behavior without the admin-only field.

`GuestListEditor` should pass the prop through only when it is used by the admin invitation editor for external invitations. Standard invitation guest management can also use the same component without showing the field.

## API Behavior

Admin guest APIs accept and persist `customExternalLink`:

- `POST /api/admin/invitations/[id]/guests`
- `PATCH /api/admin/invitations/[id]/guests/[guestId]`

Owner guest APIs do not accept the field:

- `POST /api/owner/[token]/guests`
- `PATCH /api/owner/[token]/guests/[guestId]`

The shared guest library should support the field in full admin guest data. Public guest data returned for a valid token should include only the data required for rendering the public page, including the optional `customExternalLink` needed to choose the iframe source. Phone data remains private.

Validation should trim the value. Empty strings should be stored as null. The first implementation only needs basic URL-string validation if an existing project helper already exists; otherwise it can rely on the iframe/embed logic to handle unsupported URLs consistently with invitation-level `externalLink`.

## Public Rendering Behavior

When a public invitation page receives `?g=<token>`:

1. Resolve the guest using the existing `getPublicGuestByToken` flow.
2. Confirm the guest belongs to the requested invitation slug.
3. Pass the guest to `InvitationView` as today.

For external-link invitations, compute the effective external link as:

```ts
const effectiveExternalLink = invitation.guest?.customExternalLink || invitation.externalLink;
```

Use `effectiveExternalLink` anywhere the bare external-link iframe source is selected. Rich external-link and curtain-Canva flows should use the same effective link if they render the external Canva iframe from `invitation.externalLink`.

Fallback rules:

- No guest token: use `invitation.externalLink`.
- Invalid guest token: use `invitation.externalLink`.
- Guest belongs to another invitation: use `invitation.externalLink`.
- Guest has no personalized link: use `invitation.externalLink`.
- Invitation type is not `external_link`: ignore `customExternalLink`.

## Security And Privacy

The public token route already exposes guest-specific information to anyone holding the personal guest URL. Adding the personalized link to that public guest object is acceptable because it is required to render the guest-specific invitation and contains no phone data.

The custom link must not be editable through owner-token routes or guest self-registration routes. Only admin-authenticated routes under `/api/admin/invitations/.../guests` should write it.

## Testing

Add or update tests for pure behavior where practical:

- Guest data mapping includes `customExternalLink` for admin guest data.
- Public guest data includes `customExternalLink` but not phone data.
- Empty custom link input is normalized to null/undefined in returned data.
- Effective external link selection prefers guest custom link and falls back to invitation external link.

Run the existing checks after implementation:

```bash
npm test
npm run lint
```

If the change includes a Prisma migration, also run:

```bash
npm run db:generate
```

## Acceptance Criteria

- External invitation edit pages show a `Gestão de Convidados` accordion equivalent to the standard invitation form.
- Admins can create and edit guests from external invitation edit pages.
- Admin guest forms on external invitations include an optional `Link Canva personalizado` field.
- Owner/guest-facing guest management forms do not show or submit the personalized Canva link field.
- Opening an external-link invitation with a guest token and guest custom link loads the guest custom Canva link.
- Opening the same invitation without a guest custom link loads the invitation default external link.
- Existing standard invitation guest management behavior remains unchanged.
