/**
 * Build the `@platform` SKILL.md the agent loads from the workspace's
 * `.claude/skills/platform/`. It carries the exact `.d.ts` contract plus the
 * mount rules and a minimal art-direction nudge (deep design quality is Phase 5).
 */
export function buildPlatformSkill(dtsContent: string): string {
  return `---
name: platform
description: The @platform SDK an AI invitation bundle must build against — data, hooks, and components. Read before writing any code.
---

# Building an invitation bundle with @platform

You are writing a single self-contained invitation component in \`index.tsx\`.

## Mount contract

- \`index.tsx\` must **default export** a React component: \`export default function Invitation(props) { ... }\`.
- It must register itself: \`hostRuntime().bundles.register(__BUNDLE_ID__, Invitation)\` (the harness injects \`__BUNDLE_ID__\`; import \`hostRuntime\` from \`./runtime\`).
- Import **only** from \`react\`, \`framer-motion\`, and \`@platform\`. Never import anything else — no network, no other packages. React and framer-motion are provided by the host; do not add your own.
- Props: \`{ invitation, guest, locale, assets, coverOpened }\`. Time entrance animations off \`coverOpened\`.
- \`assets\` is \`{ hero: string | null; gallery: string[]; sections: Record<string,string>; library: AssetRef[] }\`
  where \`AssetRef = { id: string; name: string; kind: "image" | "pdf"; url: string; width?: number | null; height?: number | null }\`.
  \`library\` holds files the admin uploaded in the chat.

## The @platform contract (authoritative types)

\`\`\`ts
${dtsContent}
\`\`\`

## File layout (required)

- \`index.tsx\` — small (aim for under 120 lines): the default export, the
  \`register\` call, the \`<Font>\` loads, and the section order. No section
  markup lives here.
- \`theme.ts\` — the palette, type scale, spacing and motion tokens as
  exported constants. Every section imports from it; nothing hardcodes a hex.
- \`sections/<Name>.tsx\` — one file per section (Hero, Schedule, Location,
  Rsvp, Gifts, Faqs, Story, Gallery…). A section owns its own markup, styles
  and motion.
- \`ui/\` — only for genuinely shared pieces (a rule, an eyebrow label).
Import with relative paths. esbuild bundles the whole tree from index.tsx.
When asked for a change, edit only the file that owns it.

## Rules

- Behaviour is platform-owned: use \`useRsvp()\`, \`useGifts()\`, etc. — never re-implement RSVP/gift/audio logic or fetch APIs yourself.
- Locale-reactive text: author \`{ pt, en, ... }\` maps and read them via \`useLocale().t(...)\`. Do not read localized strings off \`invitation\`.
- Images: use \`<Media>\`. QR: \`<QrCode>\`. Fonts: \`<Font family=... />\`. Video: a plain \`<video>\` element is fine.
- Uploaded files live in \`props.assets.library\`. To display one, look it up by \`id\` or \`name\` and pass its \`url\` to \`<Media>\`. **Never hardcode an attachment URL** into the source. Entries with \`kind: "pdf"\` are reference material only — never render them.
- The design must be distinctive and never generic. Avoid Inter/Roboto/system fonts, purple-on-white gradients, and cookie-cutter card layouts.

## Content comes from props, never from the prompt

- The couple names, date, venue, schedule, gifts, FAQs and every other **content** value come from \`props.invitation\` (e.g. \`props.invitation.couple.bride\`, \`props.invitation.date\`, \`props.invitation.location\`). **Never hardcode** names, dates, or venues — the prompt describes the **design** (mood, layout, typography), not the content. The same bundle must render correctly for this invitation's real data.
- Personalized guest: \`useGuest()\`. Localized UI strings you author: \`useLocale().t({ pt, en })\`. Live data: the hooks (\`useRsvp\`, \`useGifts\`, \`useCountdown\`, ...).
- Only render features that exist for this invitation (see the brief in the task prompt) — e.g. don't build a gifts section if gifts are disabled.

## Build loop

After writing \`index.tsx\`, run \`npm run build\` in the workspace. It runs \`tsc --noEmit\` then \`esbuild\`. Fix any type or build errors and re-run until it succeeds and writes \`dist/bundle.js\`.
`;
}

/**
 * The same contract, without the SKILL.md frontmatter, for inlining into the
 * agent's system prompt. The file is still written to the workspace for
 * discoverability, but the agent no longer has to spend a turn reading it
 * before it can start — and a system prompt sits in the cacheable prefix.
 */
export function platformContract(dtsContent: string): string {
  return buildPlatformSkill(dtsContent).replace(/^---\n[\s\S]*?\n---\n/, "");
}
