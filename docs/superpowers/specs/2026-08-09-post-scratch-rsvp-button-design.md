# Post-Scratch RSVP Button Design

## Goal

Allow an administrator to replace the inline RSVP form with a button inside the scratch-date section after all three date coins have been revealed. Clicking the button opens the existing RSVP modal.

## Configuration

Extend `ScratchRevealConfig` with an optional `showRsvpButtonAfterReveal` boolean.

- Missing or `false`: preserve the current scratch section behavior.
- `true`: make the post-scratch RSVP CTA available when RSVP is also enabled and hide the inline RSVP form immediately.

Add a switch under the scratch-reveal controls in both relevant external-invitation admin panels. The control should explain that the button appears only after the full date is revealed and opens the RSVP modal.

### Button Appearance

The post-scratch CTA must use the same visual contract as the existing RSVP form submit button. Both consume `rsvp.inputStyle`, the theme's primary CTA colors and radius, `theme.uiFont`, and `textStyles.elements.ctaLabel`. Changing the existing RSVP button style therefore changes both presentations.

Extract the shared button presentation into a reusable component. `RSVPForm` renders it as `type="submit"` with loading state, while `ScratchDateReveal` renders it as `type="button"` with its reveal animation and click callback. Do not add scratch-specific appearance fields, element keys, or admin controls.

## Component Design

`ScratchDateReveal` remains responsible for scratch progress and presentation. It will accept an optional RSVP action callback. After its existing all-three-coins completion condition is met, it will render an animated CTA only when that callback exists.

The CTA will:

- use the existing `cta_confirmButton` custom text;
- use the shared RSVP button component and its resolved input-style variant, theme colors/radius, and `ctaLabel` typography;
- honor reduced-motion preferences;
- appear after the same completion event that triggers confetti;
- call the supplied callback when clicked.

The component will not import or own `RSVPModal`, keeping scratch behavior independent from RSVP submission details.

## Page Integration

`RichExternalLinkPage` and `RevealableExternalSections`, the two external invitation compositions that render `ScratchDateReveal`, will each own the RSVP modal's open state. They will pass the open callback only when both conditions are true:

1. `scratchReveal.showRsvpButtonAfterReveal === true`;
2. `rsvp.enabled === true`.

Clicking the revealed CTA opens the existing shared `RSVPModal` through its integration props: the current invitation, theme, custom text, and guest. The modal continues to derive the standard endpoint and invitation slug through its existing defaults. Closing or submitting continues through the modal's existing behavior.

The two RSVP presentations are mutually exclusive:

- when the post-scratch option is disabled, the existing inline RSVP section follows its current render rules;
- when the post-scratch option is enabled and RSVP is enabled, the inline RSVP section is hidden from initial page render and RSVP is available only through the revealed scratch CTA and modal;
- disabling the post-scratch option restores the previous inline behavior because the underlying inline RSVP configuration is preserved.

## Compatibility and Edge Cases

- Existing invitations do not show the button because the new setting is opt-in.
- Existing invitations that enable the button inherit the existing RSVP submit-button appearance automatically.
- If RSVP is disabled after the scratch option was enabled, no button or modal is rendered.
- Enabling the post-scratch option never renders both the modal CTA and inline RSVP form on the same page.
- Repeated completion notifications do not duplicate the CTA or celebration; the existing completion guards remain authoritative.
- The CTA stays visible after reveal for the remainder of the mounted page session.
- Admin and landing previews use the same configuration and component behavior as their corresponding invitation layout.

## Testing

Use focused tests to establish the behavior before implementation:

- configuration/type-oriented gating shows the CTA action only when scratch and RSVP settings permit it;
- `ScratchDateReveal` exposes the CTA after all three unique completion signals and not before;
- the admin source includes the new switch in both scratch-reveal panels;
- the scratch CTA and RSVP submit action both render the shared RSVP button presentation;
- the scratch CTA consumes `rsvp.inputStyle`, theme CTA values, and the existing `ctaLabel` text override;
- no scratch-specific appearance data or admin editor remains;
- both external invitation compositions wire the scratch callback to the shared RSVP modal;
- both external invitation compositions hide inline RSVP while the post-scratch modal flow is enabled;
- disabling the post-scratch modal flow preserves the existing inline RSVP render rules.

Run the focused Vitest tests, then the full test suite, lint, and the repository build command.
