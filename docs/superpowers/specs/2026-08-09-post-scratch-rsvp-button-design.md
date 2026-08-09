# Post-Scratch RSVP Button Design

## Goal

Allow an administrator to show an RSVP button inside the scratch-date section after all three date coins have been revealed. Clicking the button opens the existing RSVP modal. The existing inline RSVP form remains unchanged.

## Configuration

Extend `ScratchRevealConfig` with an optional `showRsvpButtonAfterReveal` boolean.

- Missing or `false`: preserve the current scratch section behavior.
- `true`: make the post-scratch RSVP CTA available when RSVP is also enabled.

Add a switch under the scratch-reveal controls in both relevant external-invitation admin panels. The control should explain that the button appears only after the full date is revealed and opens the RSVP modal.

## Component Design

`ScratchDateReveal` remains responsible for scratch progress and presentation. It will accept an optional RSVP action callback. After its existing all-three-coins completion condition is met, it will render an animated CTA only when that callback exists.

The CTA will:

- use the existing `cta_confirmButton` custom text;
- use the invitation theme's primary CTA background, text color, typography, and radius;
- honor reduced-motion preferences;
- appear after the same completion event that triggers confetti;
- call the supplied callback when clicked.

The component will not import or own `RSVPModal`, keeping scratch behavior independent from RSVP submission details.

## Page Integration

`RichExternalLinkPage` and `RevealableExternalSections`, the two external invitation compositions that render `ScratchDateReveal`, will each own the RSVP modal's open state. They will pass the open callback only when both conditions are true:

1. `scratchReveal.showRsvpButtonAfterReveal === true`;
2. `rsvp.enabled === true`.

Clicking the revealed CTA opens the existing shared `RSVPModal` through its integration props: the current invitation, theme, custom text, and guest. The modal continues to derive the standard endpoint and invitation slug through its existing defaults. Closing or submitting continues through the modal's existing behavior.

The existing inline RSVP section remains rendered in its current location and is not changed by this option.

## Compatibility and Edge Cases

- Existing invitations do not show the button because the new setting is opt-in.
- If RSVP is disabled after the scratch option was enabled, no button or modal is rendered.
- Repeated completion notifications do not duplicate the CTA or celebration; the existing completion guards remain authoritative.
- The CTA stays visible after reveal for the remainder of the mounted page session.
- Admin and landing previews use the same configuration and component behavior as their corresponding invitation layout.

## Testing

Use focused tests to establish the behavior before implementation:

- configuration/type-oriented gating shows the CTA action only when scratch and RSVP settings permit it;
- `ScratchDateReveal` exposes the CTA after all three unique completion signals and not before;
- the admin source includes the new switch in both scratch-reveal panels;
- both external invitation compositions wire the scratch callback to the shared RSVP modal;
- existing inline RSVP rendering remains intact.

Run the focused Vitest tests, then the full test suite, lint, and the repository build command.
