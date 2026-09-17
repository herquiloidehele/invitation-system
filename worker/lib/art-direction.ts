/**
 * The art-direction contract.
 *
 * Consumed two ways: `critiqueDesign()` imports it as the rubric for grading
 * rendered screenshots, and `buildDesignProcessSkill()` embeds it into the
 * design-process SKILL.md. It is deliberately NOT system-prompt text — a ban
 * list as ambient framing produces bland-but-compliant work, and duplicating it
 * in two places is how the two copies drift.
 *
 * These are prohibitions plus positive direction. Prohibitions alone produce
 * bland-but-compliant work, so each ban names what to do instead.
 *
 * `replicating` returns a much shorter rubric rather than the full one plus an
 * exemption. When the admin uploaded a design to reproduce, the ban lists and
 * genre defaults are not merely outranked — they are the wrong question, and
 * emitting them only to override them puts a rule and its negation in the same
 * context window. What survives is what a chosen design cannot excuse.
 */
export function artDirection(opts?: { replicating?: boolean }): string {
  if (opts?.replicating) return replicationFloor();

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

### Genre defaults (the wedding-invitation tells)

These are what a template produces. Each is legitimate if the couple actually
asked for it — the brief's own words always win — but where the brief leaves the
choice open, do not spend it on one of these:

- Eucalyptus or sage green with cream and a script display face.
- Everything centred, every section, top to bottom.
- A hairline gold rule with a leaf or laurel motif as a section divider.
- Tracked-out ALL-CAPS labels: "SAVE THE DATE", "OUR STORY", "GETTING THERE".
- A full-bleed photo under a dark scrim with the names centred over it in white
  serif — the single commonest cover in the genre.
- A dot-and-line vertical timeline for the schedule.
- Identical rounded cards with the same soft shadow for FAQs or details.
- Warm cream near #F4F1EA with a terracotta accent near #D97757. This one is
  especially dangerous here: in this genre it reads as tasteful rather than as
  the generated-page default it is.

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

/**
 * What holds when the design was chosen rather than invented. Everything here is
 * a craft or truthfulness rule — none of it is taste, so none of it yields to a
 * reference.
 */
function replicationFloor(): string {
  return `## What still holds (non-negotiable)

The design itself is settled — it is the reference, matched as closely as the
phone allows. These are not design choices and do not yield to it:

- No emoji used as icons. No placeholder greys. No lorem text of any kind. Where
  the reference shows dummy copy, the real content goes in its place.
- Every section must be justified by real data — if gifts are off, there is no
  gifts section, whatever the reference shows.
- Guest-facing words are localised through \`useLocale().t(...)\`, never English
  strings a guest sees.
- Respect \`prefers-reduced-motion\`, and keep the DOM small enough to survive
  Instagram's webview.`;
}
