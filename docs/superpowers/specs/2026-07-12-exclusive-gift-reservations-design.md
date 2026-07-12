# Exclusive Gift Reservations Design

## Summary

Invitations may optionally turn the existing product gift list into an exclusive reservation list. When enabled, each gift can be selected by only one guest, and each identified guest can control only one gift at a time. Personalized guest links identify known guests automatically; visitors using a public invitation link enter their name and receive an opaque browser-held management token.

The host sees reservation names in the existing owner-token dashboard and can release a reservation. Guests never see who reserved another gift.

Existing invitations and gift lists remain unchanged because the feature defaults to disabled.

## Goals

- Make exclusive gift selection configurable per invitation.
- Allow both personalized-link guests and public-link visitors to reserve a gift.
- Guarantee at the database level that a gift cannot have two active reservations.
- Limit an identified guest to one active gift and let them replace or release it.
- Keep reserved gifts visible but unavailable to other guests.
- Let the host see reservation details and release gifts.
- Preserve the current direct-link behavior when the feature is disabled.

## Non-goals

- Payment processing, proof of purchase, delivery tracking, or contribution amounts.
- Reservations for bank-transfer details or the legacy external registry link.
- Email, SMS, or push notifications.
- Moving existing gift definitions out of the `Invitation.giftRegistry` JSON field.
- Allowing guests to see the identity of another gift's reserver.
- Perfectly identifying a human who uses multiple browsers on a public invitation. Without authentication, the enforceable identity is the opaque token held by one browser. Personalized guest links do not have this limitation.

## Configuration

Add optional `exclusiveSelectionEnabled?: boolean` to `GiftRegistry`. Missing and `false` both mean disabled, preserving all existing invitation behavior.

In the admin invitation editor, show a switch labeled **Limit each gift to one guest** under the existing gift-list enablement control. The switch is relevant only to product items in `giftRegistry.items`; it does not restrict `bankTransfer`, `bankTransferText`, or the legacy `link`.

New invitation defaults set `exclusiveSelectionEnabled` to `false`. The setting remains inside the existing JSON payload, so the create/update APIs and the separate public/admin invitation mappers continue using the established gift-registry flow.

Disabling the setting stops all guest reservation mutations and restores the current direct-link gift cards. Existing `GiftReservation` rows are retained. Re-enabling the setting restores their effect and history.

## Data Model

Add a relational `GiftReservation` model while retaining gift definitions in JSON:

- `id`: generated primary key.
- `invitationSlug`: relation to `Invitation.slug`, cascading on invitation deletion.
- `giftItemId`: stable ID from `giftRegistry.items`.
- `giftName`: name snapshot captured at reservation time.
- `guestName`: display name shown only to the host and the reserving guest.
- `guestId`: nullable relation to a personalized `Guest`; set null if that guest is deleted.
- `managementToken`: nullable, cryptographically opaque token for public-link control.
- `reservedAt`: creation timestamp.
- `updatedAt`: update timestamp.

Constraints:

- Unique `(invitationSlug, giftItemId)` guarantees one active reservation per gift under concurrent requests.
- Unique nullable `guestId` guarantees one active reservation per personalized guest. A `Guest` belongs to one invitation, so invitation scope is implicit.
- Unique nullable `managementToken` identifies and limits a public browser identity to one active reservation.
- Index `invitationSlug` supports availability and owner-list queries.

The reservation keeps a gift-name snapshot because gift definitions are editable JSON. If an item is removed, its reservation remains intelligible in the owner view and can still be released. Editing a gift name does not rewrite historical reservation data.

Add `giftReservations` relations to `Invitation` and `Guest`.

## Guest Identity and Control

### Personalized invitation

When a valid `?g=<guest token>` belongs to the invitation, the server resolves the existing `Guest`. Reservation mutations use that database identity and ignore any client-supplied display name. The guest's stored name becomes `guestName`.

The personalized guest token authorizes reading their own current selection, replacing it, and releasing it. It never exposes another guest's name.

### Public invitation

A visitor without a valid personalized guest enters a non-empty name when choosing their first gift. The server trims and length-limits the name, generates a cryptographically opaque management token, stores it on the reservation, and returns it once to the client. The browser stores it under an invitation-specific local-storage key.

Subsequent availability, replace, and release requests send that management token in a request header, not a URL. Matching a typed name is never sufficient authorization. If local storage is lost, the visitor cannot recover control; the host can release the reservation.

One public management token controls one gift. A visitor can bypass this practical limit by clearing storage or using another browser; preventing that requires authenticated guest management and is outside this feature's scope.

## Public API and Data Exposure

Create a focused public reservation route under the invitation slug. Its operations share server-side parsing and authorization helpers.

### Read availability

The read operation returns, for each current gift item:

- gift item ID;
- whether it is reserved;
- whether it belongs to the supplied personalized guest or public management token.

It may return the current guest's own reservation details, but it never returns another reservation's guest name, guest ID, management token, or timestamp.

The gifts page server-render provides an initial availability snapshot. After hydration, public-link visitors with a stored management token revalidate so their own gift is labeled correctly. Mutation responses also return the fresh safe projection.

### Choose or replace

The mutation accepts a gift item ID plus either a valid personalized guest token or a public identity. A new public identity additionally supplies its guest name.

The server must:

1. Load the invitation and confirm the gift list and `exclusiveSelectionEnabled` are enabled.
2. Resolve the requested item from the current `giftRegistry.items`; never trust a client-supplied gift name.
3. Resolve and validate the guest identity.
4. In a transaction, remove that identity's former reservation and create the requested reservation with the current gift-name snapshot.
5. Rely on the unique invitation/gift constraint to settle races.

If the requested gift is already the identity's current gift, return the current state idempotently. If another guest owns it, return `409 Conflict`; the transaction must roll back so the guest keeps their former gift.

### Guest release

Release requires the same personalized token or public management token that owns the reservation. It is idempotent when the identity no longer has a reservation. A token may never release a different identity's selection.

### Errors

- `400`: malformed gift ID or invalid/missing public guest name.
- `401`: missing, invalid, or mismatched guest control token for a protected operation.
- `404`: invitation or current gift item does not exist.
- `409`: gift was claimed concurrently or is already owned by another identity.
- `422`: gift registry or exclusive selection is disabled.
- `500`: unexpected failure, logged server-side without leaking token data.

Guest-facing copy explains the recovery action: refresh after a conflict, enter a valid name, or ask the host to release a gift when browser control was lost.

## Guest Interface

When exclusive selection is disabled, `GiftsListView` keeps its current behavior: a card with a store link is directly clickable.

When enabled:

- The list waits for a safe availability state before enabling selection actions.
- Available cards show **Choose this gift**.
- Reserved cards stay in their existing grid position, appear muted, are disabled, and show **Already chosen**.
- The current guest's reservation is emphasized with **Your gift** and exposes **View in store** when a link exists plus **Release gift**.
- Selecting an available gift opens a confirmation dialog. Personalized guests see their resolved name; public guests enter their name.
- If the identity already owns another gift, the dialog explicitly says confirming will replace that selection.
- Successful selection updates the grid without a full navigation.
- Release uses a confirmation dialog and immediately returns the gift to the available state.
- A `409` refreshes availability and announces that the gift was just chosen.
- Buttons expose loading states, keyboard focus, and accessible status/error announcements. Reduced-motion preferences continue to apply.

The visuals inherit the invitation theme and current card geometry. Availability is communicated through text and control state, not color alone. Reservation mode separates the store link from the selection action so opening a shop never implicitly reserves a gift.

All new guest copy is localized in Portuguese, English, and Spanish through the existing `Invitation` message namespace.

## Host Interface

When `exclusiveSelectionEnabled` is true, the existing owner-token confirmation dashboard gains a **Gifts** tab alongside RSVPs and, when applicable, Guests.

The tab lists:

- gift-name snapshot;
- guest display name;
- personalized or public-link source;
- reservation date;
- a **Release gift** action.

The host list is ordered newest first. A reservation whose item ID no longer exists in the current gift JSON is labeled **Removed from gift list** while retaining its snapshot.

Releasing requires a confirmation dialog. The owner API validates the invitation's existing `ownerToken`, verifies the reservation belongs to that invitation, deletes it, and returns the updated list. The gift becomes available immediately to guests.

When exclusive selection is disabled, the Gifts tab is hidden. Stored rows remain in the database and reappear if the host re-enables the feature.

Owner-dashboard copy is localized in Portuguese, English, and Spanish consistently with its existing server-rendered labels.

## Concurrency and Consistency

Database uniqueness, rather than a read-then-write check alone, is the final authority for exclusivity. Selection/replacement uses one Prisma transaction. A failed target claim rolls back deletion of the previous selection.

The API maps the relevant Prisma unique-constraint error to `409` and re-reads the safe availability projection. This makes simultaneous clicks deterministic: exactly one reservation succeeds and every other client learns that the gift is unavailable.

Deleting or reordering JSON gift items does not mutate reservation rows. Stable gift item IDs preserve the association across reorder. A removed ID cannot receive new reservations because every mutation verifies the item still exists.

## Security and Privacy

- Reservation names are available only through the owner-token route or to the identity that owns the reservation.
- Management tokens are generated server-side using cryptographically secure randomness and are never logged or returned by list endpoints.
- Public management tokens travel in a header and are stored only in invitation-scoped browser local storage.
- Personalized tokens are validated against both the `Guest` and the requested invitation.
- Client input cannot set `giftName`, `guestId`, `reservedAt`, or ownership state.
- Owner release validates both owner token and reservation/invitation membership.
- API responses and errors never reveal whether a typed name matches an existing reservation.

## Testing and Verification

Development follows test-driven cycles. Tests cover:

- missing configuration defaulting to unrestricted current behavior;
- availability projection hiding other guests' identity;
- personalized and public identity parsing;
- public guest-name normalization and validation;
- successful first selection;
- idempotent re-selection of the current gift;
- atomic replacement while preserving the former gift on conflict;
- database uniqueness conflict mapping to `409`;
- guest release authorization and idempotency;
- disabled registry and disabled exclusive-selection rejection;
- removed gift rejection and owner display behavior;
- owner-token listing and release authorization;
- configuration UI payload/default behavior;
- guest card states and localized labels where they can be tested in the current Node test environment.

The repository has no database integration test harness, so pure domain behavior and route orchestration use focused unit tests with explicit Prisma boundaries. The migration constraints are reviewed from generated SQL, and verification runs the relevant Vitest files, full `npm test`, `npm run lint`, and `npm run build` (never `next build` directly).

## Acceptance Criteria

1. Existing invitations behave exactly as before unless exclusive gift selection is enabled.
2. The host can enable or disable the rule per invitation.
3. Personalized and public-link guests can each choose, replace, and release one gift.
4. Two guests cannot hold the same gift, including under simultaneous requests.
5. Other guests see reserved gifts as unavailable without seeing reserver identity.
6. The reserving guest can identify their gift and open its store link separately.
7. The host can see reservation details and release any reservation from the owner dashboard.
8. Removed gift items do not silently erase reservation history and cannot receive new reservations.
9. Disabling the rule preserves reservations but blocks mutations and restores legacy card links.
10. Portuguese, English, and Spanish interfaces contain the new guest and host copy.
