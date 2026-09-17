import { REPLICATION_MANIFEST } from "./replication-manifest";

/**
 * The replication contract: what to do with a design reference the admin
 * uploaded.
 *
 * The platform's default posture is the opposite of this — `art-direction.ts`
 * exists to push the agent away from anything that looks copied, and
 * `attachment-brief.ts` used to describe a reference as cues to take. That
 * posture is right when nobody supplied a design and wrong the moment somebody
 * did: an admin who uploads a design has already decided what it should look
 * like, and "inspired by" is then just a slower way of ignoring them.
 *
 * So this block inverts the default whenever there is an attachment. Nothing
 * restates the inversion elsewhere: `artDirection`, `buildStockBrief` and
 * `buildDesignProcessSkill` each take a `replicating` flag and simply do not
 * emit the advice this contradicts, so the model never reads a rule and its
 * negation in one context. It is per-turn, never in the system prompt: the
 * system prompt must stay byte-identical across turns or a resumed session
 * re-uploads its whole prefix.
 *
 * It is deliberately file-agnostic — `buildAttachmentBrief` is the one place
 * files are named, so a second listing here would be tokens per turn and a
 * second copy to drift.
 */
export function buildReplicationBrief(hasAttachments: boolean): string {
  if (!hasAttachments) return "";

  return [
    "Design references:",
    "A file the conversation offers as a design reference is a SPEC, not a mood",
    "board and not inspiration. Reproduce it. Something merely in its spirit is",
    "a failure, however good it is on its own terms.",
    "",
    "Reproduce, to the value:",
    "- Composition and section order, starting with what the first screen holds.",
    "- Colour: read the actual hex off the image. Do not approximate by name.",
    "- Type: family, type scale (the real size ratios), weight, tracking, case,",
    "  line height, and which face does which job.",
    "- Spacing: the page margin, and the rhythm between and inside sections.",
    "- Shape: corner radii, rules, borders, shadow depth and colour.",
    "- Imagery: crop, aspect ratio, scrim or overlay, colour grade.",
    "- Ornament, motif, and any motion the reference implies.",
    "",
    "Measure before you write any code. Open the file with Read, look at it",
    "properly, and put the values in PLAN.md first. A value you did not measure",
    "is a value you invented.",
    "",
    "What may differ — and nothing else may:",
    "- Content. Every name, date, place and label comes from props.invitation and",
    "  the conversation. Never carry over the reference's dummy names or",
    "  placeholder text, however well they fit.",
    "- Width. A desktop or print reference must reflow to a phone column:",
    "  proportion, hierarchy and reading order survive, a multi-column grid",
    "  cannot. Reflow it; do not shrink it.",
    "- Platform-owned pieces — RSVP, audio, the cover's open mechanics. Style them",
    "  to the reference; do not rebuild what @platform owns.",
    "- Language: guest-facing words stay localised through useLocale().t(...).",
    "",
    "Sections the reference does not show — RSVP, schedule, FAQs, gifts — are",
    "built FROM it: same palette, same type scale, same spacing rhythm, same",
    "shapes. Extend the reference's system. Do not invent a second one beside it.",
    "",
    "Watch your own instincts here. A centred layout, a widely used family, a",
    "photograph under a scrim: all correct answers when the reference does them.",
    "Match it rather than improving it — a flourish it does not have is a defect.",
    "What matching never excuses: the phone-craft floor, content bound to",
    "real data, and localised strings.",
    "",
    "Fonts: identify the real families. Where one is not on Google Fonts, use the",
    "closest match you can load, record the substitution in PLAN.md, and name it",
    "at the end of the turn — the admin can upload the real file and you swap it",
    "next turn.",
    "",
    "Photographs: fill every image slot the reference has. Where this invitation",
    "supplies no photograph of its own, search for one with the stock tools and",
    "match the reference's subject, crop and tone. Those are placeholders the",
    "admin is expected to replace, so choose for composition first.",
    "",
    "A reference that arrives after this invitation already has a design",
    "supersedes it. The standing rule to stay inside PLAN.md and theme.ts does not",
    "hold against a design the admin has now chosen: rewrite theme.ts to the",
    "reference's values and update PLAN.md to match, rather than bending the",
    "reference to fit the old palette.",
    "",
    `Write ${REPLICATION_MANIFEST} in the workspace root listing the name of each`,
    "reference file you replicated, one per line — and nothing else. Do not list a",
    "file you rendered as content, or one you merely looked at. The review that",
    "follows compares the built page against exactly those files.",
    "",
    "End the turn with a short list: fonts substituted, placeholder photographs",
    "used and what each stands in for, and anything in the reference you",
    "could not reproduce and why.",
  ].join("\n");
}
