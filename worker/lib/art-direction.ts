/**
 * The art-direction contract. Inlined into the agent's system prompt (see
 * worker/agent.ts) rather than shipped as a skill the agent must read —
 * Phase 4b removed that round-trip and this must not reintroduce it.
 *
 * These are prohibitions plus positive direction. Prohibitions alone produce
 * bland-but-compliant work, so each ban names what to do instead.
 */
export function artDirection(): string {
  return `## Art direction (non-negotiable)

The output must look like a designer made it for these specific people. Generic
"AI-looking" work is a failure even if it builds cleanly.

### Typography
- Never use Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, Nunito, or a
  system-ui stack. They are the house style of generic templates.
- Pair two faces with real contrast: an expressive display face for the couple's
  names and headings, and a quiet, highly readable face for body text.
- Load them with \`<Font family="..." />\`. Use real families available on Google Fonts.
- Use dramatic scale contrast. A hero name at the same size as a section heading
  reads as a document, not an invitation.

### Colour
- Never use the purple-to-blue "AI gradient" (#667eea → #764ba2 and relatives),
  and never place a centred white card on a saturated gradient background.
- Derive the palette from the invitation's own material: the hero image, the
  season implied by the date, the venue's character. Values come from
  \`props.invitation\` — read them and let them drive the choices.
- 3–5 colours total: a dominant ground, a paper/ink pair, and one accent used
  sparingly. If everything is an accent, nothing is.

### Layout
- No equal three-column feature grids, no uniform rounded cards with the same
  drop shadow repeated down the page, no dot-and-line vertical timeline unless
  the schedule genuinely earns it.
- Use asymmetry, deliberate whitespace, and a real editorial hierarchy. Let one
  element per screen dominate.
- Full-bleed imagery beats a boxed thumbnail. Overlap and offset are allowed.

### Motion
- Motion must be purposeful. Do not apply the same fade-up-on-scroll to every
  section — that is the visual signature of a template.
- Time the entrance off \`coverOpened\`: the invitation should feel like it opens.
- Respect \`prefers-reduced-motion\`.

### Finish
- No emoji used as icons. No placeholder greys. No lorem text of any kind.
- Every section must be justified by real data — if gifts are off, there is no
  gifts section.`;
}
