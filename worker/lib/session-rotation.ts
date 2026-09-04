/**
 * A resumed session replays its whole history every turn — the baseline
 * measured ~400k input tokens per tweak, growing each turn. The design lives
 * in the source files (rehydrated into the workspace anyway), so a session
 * need not live forever: past a limit, start fresh with a short recap.
 */

/**
 * Resume while the session is affordable; start fresh once it is not.
 *
 * Measured 2026-09-04: rotating on a monolithic legacy source is a net loss —
 * the fresh agent spent 8 tool calls re-orienting in a 34 KB index.tsx (235s
 * vs 15s on resume). It only pays once the source is split into sections,
 * where a targeted read is ~3k tokens. So a large context rotates only when
 * `sections/` exist; past the hard ceiling it always rotates (context guard).
 */
export function shouldRotateSession(args: {
  /** The LAST request's context (per request — never the cumulative total). */
  contextTokens: number | null;
  limit: number;
  hardLimit: number;
  hasSections: boolean;
}): boolean {
  if (args.contextTokens === null) return false;
  if (args.contextTokens > args.hardLimit) return true;
  return args.hasSections && args.contextTokens > args.limit;
}

/**
 * A compact memory for a fresh session: the last few turns, each cut to a
 * sentence or two. The code is the source of truth; this only keeps the
 * *intent* of recent requests from being lost.
 */
export function buildRecap(
  messages: Array<{ role: string; content: string }>,
  max: number,
): string {
  const recent = messages.slice(-max);
  if (recent.length === 0) return "";
  const line = (m: { role: string; content: string }) =>
    `- ${m.role === "user" ? "Admin" : "You"}: ${m.content
      .replace(/\s+/g, " ")
      .slice(0, 300)}`;
  return [
    "Recent conversation (for context; the code is the source of truth):",
    ...recent.map(line),
  ].join("\n");
}
