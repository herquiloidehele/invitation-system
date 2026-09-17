import { artDirection } from "./art-direction";

/** The planning passes when the agent is choosing the design. */
const INVENTION_PASSES = `## Pass one: write the plan

Before you write any \`.tsx\`, write \`PLAN.md\` in the workspace root:

- **Colour** — 4–6 named hex values: a dominant ground, a paper/ink pair, and one
  accent used sparingly. If everything is an accent, nothing is.
- **Type** — the two faces and their roles, with the real Google Fonts family
  names you will pass to \`<Font>\`.
- **Layout** — one paragraph on the concept, then an ASCII wireframe of the phone
  scroll from cover to footer, one line per section.
- **Principles** — three or four sentences on what makes this invitation specific
  to these two people.
- **Self-review** — see pass two. Write what you changed and why.

Keep it short. It is a design decision record, not a document.

## Pass two: review the plan before you build

Read your own plan back and ask honestly: is this what I would have produced for
any wedding? Work through a different couple's brief in your head and see whether
you arrive somewhere similar. Wherever you would, that part is a default rather
than a choice — revise it, and record the change in the self-review.

Only then start writing code, and follow the revised plan.`;

/** The same two passes when the design arrived as a reference to reproduce. */
const REPLICATION_PASSES = `## Pass one: measure the reference into a plan

Open the reference with Read and look at it properly. Before you write any
\`.tsx\`, write \`PLAN.md\` in the workspace root — what you measured, not what you
decided:

- **Colour** — the hex of every colour in it, named by role. Read them off the
  image; do not name them from memory.
- **Type** — the families, the real type scale (the ratios between the cover
  name, the section headings and body text), weight, tracking, case.
- **Spacing and shape** — page margin, the rhythm between sections, corner radii,
  rules, shadow depth.
- **Layout** — an ASCII wireframe of the reference reflowed to a phone column,
  one line per section, in its order.
- **Extension** — the reference will not cover every section this invitation
  needs. Write down how its system covers the sections it does not show: which
  type step the RSVP labels take, how a schedule row is drawn in this vocabulary,
  what a FAQ looks like here.
- **Substitutions** — everywhere you could not match it: a family that is not on
  Google Fonts, a photograph replaced by a placeholder, an effect a phone cannot
  carry. Name the reason for each.

A value you did not measure is a value you invented.

## Pass two: check the plan against the image

Open the reference again with the plan beside it and compare value by value —
colour, type scale, spacing, shape, composition, order. Wherever the plan differs
from the reference, the plan is wrong unless you recorded why. Write what you
corrected, then build from the corrected plan.

Judge yourself on fidelity, not on originality.`;

/**
 * The `design-process` SKILL.md the agent loads on a first build.
 *
 * Adapted from Anthropic's `frontend-design` skill (Apache License 2.0), with
 * three rewrites this platform needs: the hero is the *cover* (the invitation
 * opens — `coverOpened` is a real design moment a landing page has no analogue
 * for), the calibration list is the wedding genre's rather than the SaaS one,
 * and the grounding material is this couple's own data.
 *
 * The rubric is embedded rather than restated, so the builder and
 * `critiqueDesign()` are judged by one standard. See NOTICE for attribution.
 *
 * `replicating` swaps the two passes instead of appending a third section that
 * contradicts them. When the admin uploaded a design, the agent is not choosing
 * a direction — so "is this what I would have produced for any wedding?" is not
 * a question worth asking, and the transcription passes take its place.
 * `provisionWorkspace` decides which variant to write, from the attachments.
 */
export function buildDesignProcessSkill(replicating: boolean = false): string {
  return `---
name: design-process
description: ${
    replicating
      ? "The method for reproducing the design reference this couple supplied — measure it, plan from the measurements, check the plan against the image, then build. Read this before writing any code."
      : "The method for designing this invitation — ground it in the couple's material, plan, review the plan against the genre's defaults, then build. Read this before writing any code on a first build."
  }
---

# Designing this invitation

${
    replicating
      ? `Approach this as the studio that builds what the client signed off. This
couple has chosen a design and handed it to you. Your judgement goes into
matching it and into the parts it does not cover — not into improving it.`
      : `Approach this as the design lead at a studio known for giving every couple a
distinct visual identity. This couple has already seen the templates and turned
them down. They are paying for a point of view.`
  }

## Ground the design in these people

The brief in your task prompt carries the real material: the couple's names, the
date and the season it implies, the venue and its character, whether there is a
hero image, and the languages the guests read. Distinctive choices come from that
material, not from the word "wedding". A February register-office ceremony and an
August party at a quinta are different design problems.

${
    replicating
      ? `The reference decides the look; this material decides the content, and the two
meet in the sections the reference does not cover. Any uploaded font is the
reference's own — use it.`
      : `If the couple uploaded fonts, those are the strongest signal you have.`
  }

## The cover is the hero

This is not a landing page. The invitation *opens*: the guest sees a cover, taps,
and the invitation reveals itself. \`coverOpened\` tells you when.

Design that moment first. What does the guest see in the second before it opens?
What does opening reveal? A full-bleed photo with the names in white serif over a
dark scrim is the default answer — find a better one. Time the entrance sequence
off \`coverOpened\` so opening feels like an event, then let the rest of the page
be calm.

${replicating ? REPLICATION_PASSES : INVENTION_PASSES}

${artDirection({ replicating })}

${
    replicating
      ? `## Restraint

Resist improving the reference. A flourish it does not have is a defect, however
good it is.`
      : `## Restraint

Spend your boldness in one place. Let one element be the memorable thing and keep
everything around it quiet and disciplined. Before you finish, take one thing
away.`
  }

## Words are design content

Section headings, RSVP labels, and the empty and error states carry as much of
the invitation's character as the typography does. Write them as \`{ pt, en }\`
maps read through \`useLocale().t(...)\`, never as English strings a guest sees.
Plain verbs, sentence case, the couple's voice. A button says what happens when
it is tapped.
`;
}
