/**
 * The file the agent writes to declare which reference files it replicated.
 *
 * Its own module because two very different callers need the name: the build
 * prompt (`replication-brief.ts`) tells the agent to write it, and the critique
 * route reads it back off the saved revision to decide whether to grade fidelity
 * or taste. The route has no business importing prompt text for one string.
 *
 * Root-level `.md` is already collected into the revision (see
 * `lib/source-files.ts`), so this needs no persistence plumbing of its own.
 */
export const REPLICATION_MANIFEST = "REPLICATION.md";

/** Media types the Messages API will accept as an image block. */
const SENDABLE = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

/** More than this and the review is mostly reference, and dear. */
const MAX_REFERENCES = 4;

/**
 * The attachments a revision declared it replicated, ready to be sent to the
 * reviewer as the thing to compare against.
 *
 * The manifest is written by the agent, so it is parsed forgivingly: a heading,
 * a bullet, backticks and stray case are all things a model writes when asked
 * for "one name per line". A name that matches nothing, or matches a PDF the
 * API cannot take as an image, is dropped rather than failing the review — a
 * critique that falls back to the taste rubric is a worse review, not a broken
 * one.
 */
export function selectReplicatedReferences<
  T extends { name: string; mimeType: string },
>(
  source: Record<string, string> | null | undefined,
  attachments: T[],
  max: number = MAX_REFERENCES,
): T[] {
  // Found case-insensitively: the file name is the agent's to type, and a
  // `replication.md` would otherwise silently drop the whole review into the
  // wrong rubric.
  const key = Object.keys(source ?? {}).find(
    (k) => k.toLowerCase() === REPLICATION_MANIFEST.toLowerCase(),
  );
  const manifest = key ? source![key] : undefined;
  if (!manifest) return [];

  const byName = new Map(attachments.map((a) => [a.name.toLowerCase(), a]));
  const picked: T[] = [];
  const seen = new Set<string>();

  for (const line of manifest.split("\n")) {
    const name = line
      .trim()
      .replace(/^[-*]\s+/, "")
      .replace(/`/g, "")
      .trim()
      .toLowerCase();
    if (!name || name.startsWith("#")) continue;

    const attachment = byName.get(name);
    if (!attachment || seen.has(name)) continue;
    if (!SENDABLE.has(attachment.mimeType)) continue;

    picked.push(attachment);
    seen.add(name);
    if (picked.length === max) break;
  }

  return picked;
}
