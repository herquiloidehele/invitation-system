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

## The @platform contract (authoritative types)

\`\`\`ts
${dtsContent}
\`\`\`

## Rules

- Behaviour is platform-owned: use \`useRsvp()\`, \`useGifts()\`, etc. — never re-implement RSVP/gift/audio logic or fetch APIs yourself.
- Locale-reactive text: author \`{ pt, en, ... }\` maps and read them via \`useLocale().t(...)\`. Do not read localized strings off \`invitation\`.
- Images: use \`<Media>\`. QR: \`<QrCode>\`. Fonts: \`<Font family=... />\`. Video: a plain \`<video>\` element is fine.
- The design must be distinctive and never generic. Avoid Inter/Roboto/system fonts, purple-on-white gradients, and cookie-cutter card layouts.

## Content comes from props, never from the prompt

- The couple names, date, venue, schedule, gifts, FAQs and every other **content** value come from \`props.invitation\` (e.g. \`props.invitation.couple.bride\`, \`props.invitation.date\`, \`props.invitation.location\`). **Never hardcode** names, dates, or venues — the prompt describes the **design** (mood, layout, typography), not the content. The same bundle must render correctly for this invitation's real data.
- Personalized guest: \`useGuest()\`. Localized UI strings you author: \`useLocale().t({ pt, en })\`. Live data: the hooks (\`useRsvp\`, \`useGifts\`, \`useCountdown\`, ...).
- Only render features that exist for this invitation (see the brief in the task prompt) — e.g. don't build a gifts section if gifts are disabled.

## Build loop

After writing \`index.tsx\`, run \`npm run build\` in the workspace. It runs \`tsc --noEmit\` then \`esbuild\`. Fix any type or build errors and re-run until it succeeds and writes \`dist/bundle.js\`.
`;
}
