# RSVP Primary CTA Action Design

## Goal

Allow invitation owners to choose whether the invitation's primary call-to-action opens the RSVP form or opens a pre-filled Google Calendar event. The RSVP form remains the default and the choice affects only the primary invitation CTA.

## Scope

The setting applies to the two existing primary CTA implementations:

- the CTA at the bottom of a standard invitation;
- the fixed CTA shown over an external-video invitation.

The following remain unchanged and continue to render the RSVP form where applicable:

- the dedicated `/confirmar/[slug]` confirmation page;
- inline RSVP sections in rich external invitations;
- RSVP submission APIs, response storage, exports, and admin response views;
- the existing Save the Date calendar button.

## Configuration

Extend the existing invitation `rsvp` JSON object with an optional field:

```ts
ctaAction?: "rsvp" | "calendar";
```

`"rsvp"` is the default. Missing or unrecognized values must resolve to RSVP mode so existing invitations and older persisted JSON retain their current behavior without migration or backfill.

The standard and external invitation admin forms will expose a two-option control under the RSVP settings:

- **Abrir formulário de RSVP** — default;
- **Adicionar ao calendário**.

The RSVP configuration remains available because the form may still be used by the dedicated confirmation page or inline RSVP sections even when the primary CTA is set to calendar mode.

## Public behavior

When `ctaAction` resolves to `"rsvp"`:

- the standard invitation CTA opens the existing RSVP modal;
- the external-video CTA opens the existing RSVP modal;
- current submitted-state labels and local-storage behavior remain unchanged.

When `ctaAction` resolves to `"calendar"`:

- the same CTA styling and placement remain in use;
- clicking the CTA invokes the existing shared `CalendarButton` behavior;
- the button uses the invitation date, couple/event type, venue, address, and localized calendar copy to open a pre-filled Google Calendar event in a new tab;
- the CTA does not open the RSVP modal or use RSVP submitted-state handling.

The existing calendar URL helper will be reused rather than creating a second calendar integration. The current default event duration remains three hours.

## Data flow

1. Admin forms write `rsvp.ctaAction` into the existing JSON payload.
2. Invitation creation/update persistence already stores the RSVP object as JSON, so no Prisma schema or migration change is required.
3. Public invitation mapping already passes the RSVP JSON through to `InvitationData`.
4. Primary CTA components resolve the optional field with a small shared helper that defaults to RSVP mode.
5. The standard and external-video CTA branches pass their existing invitation date, location, couple, and event type to `CalendarButton`.

## Testing

Add focused tests for:

- defaulting missing, null-like, and invalid action values to RSVP mode;
- preserving an explicit calendar action;
- the admin/default invitation data including RSVP mode by default;
- primary CTA integration behavior for RSVP mode versus calendar mode, using the repository's existing testable boundaries.

Run the focused tests first, followed by the full test suite, lint, and the repository-required build command (`npm run build`).

## Non-goals

- changing the dedicated RSVP page;
- changing inline RSVP sections;
- adding Apple/Outlook calendar providers or downloadable `.ics` files;
- changing event duration or calendar copy behavior;
- migrating existing invitation data.
