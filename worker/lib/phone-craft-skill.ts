/**
 * The `phone-craft` SKILL.md — the craft floor for an invitation opened on a
 * phone.
 *
 * Trimmed from Vercel Labs' Web Interface Guidelines (MIT), dropping everything
 * dashboard-shaped: list virtualization, hydration, dark-mode theming systems.
 * Two additions the public guidelines have no way to know: RSVP validation is
 * platform-owned (`useRsvp()` owns it, so the rules govern rendering rather than
 * building it), and the Instagram webview is a real memory-crash surface this
 * platform has already shipped into. See NOTICE for attribution.
 */
export function buildPhoneCraftSkill(): string {
  return `---
name: phone-craft
description: The craft floor for an invitation opened on a phone — touch targets, viewport, motion, layout shift, RSVP form ergonomics, and surviving the Instagram webview. Read before building the cover or the RSVP section.
---

# Craft floor: this is opened on a phone

Guests open the invitation on a phone, one-handed, usually from a link in
WhatsApp or Instagram. The phone layout is the design; a desktop that also works
is a bonus.

## Instagram's webview is the hostile case

Many guests arrive inside Instagram's in-app browser, which is memory-starved and
will white-screen a heavy page rather than degrade. This has already happened on
this platform.

- Keep the DOM small. Do not emit hundreds of decorative elements.
- Do not stack \`backdrop-filter\` layers. A handful is a crash, not a slowdown.
- Do not mount many heavy media elements eagerly. Video and large imagery below
  the fold must not all be live at once.

## Touch

- Anything tappable is at least 44×44 px, with space between adjacent targets.
- If the visible element must be smaller, expand the hit area with padding.
- Keyboard focus stays visible. Never \`outline: none\` without a replacement.

## Layout

- The cover uses \`100dvh\`, never \`100vh\`. Mobile browser chrome makes \`100vh\`
  taller than the visible screen, so \`100vh\` cuts the cover off.
- Anything fixed to the bottom respects \`env(safe-area-inset-bottom)\`.
- Pass explicit \`width\` and \`height\` to \`<Media>\` so images reserve their space
  before they load. An image that arrives and shoves the page down is the
  cheapest quality tell there is.

## Motion

- Honour \`prefers-reduced-motion\`: no entrance choreography, no parallax.
- Animate \`transform\` and \`opacity\` only. Never animate \`width\`, \`height\`,
  \`top\` or \`left\` — they force layout on every frame and stutter on a phone.
- Motion that answers a tap must be interruptible.

## The RSVP form

Validation, submission and error state are platform-owned. \`useRsvp()\` gives you
\`fields\`, \`values\`, \`errors\`, \`status\` and \`submit()\`. Never re-implement them.
Your job is rendering them well:

- Every input has an associated \`<label>\`. A placeholder is not a label.
- \`inputmode="email"\` and \`autocomplete="email"\` on the email field;
  \`autocomplete="name"\` on the name; \`inputmode="numeric"\` on the adult and
  child counts.
- Show each error from \`errors\` next to its own field, and move focus to the
  first errored field on submit.
- Never block paste.
- While \`status\` is \`"submitting"\`, show a busy state — do not silently disable
  the button.
- \`"success"\`, \`"closed"\` and \`"already_submitted"\` each need a designed state.
  An unhandled one renders as nothing at all.

## Text

- Use the ellipsis character \`…\`, not three periods.
- Never signal state by colour alone. Attending and not-attending need more than
  green and red.
- Keep body text under about 70 characters per line at phone width.
`;
}
