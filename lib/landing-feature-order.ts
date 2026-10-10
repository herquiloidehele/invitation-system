// Landing features are listed by `position`, which is not unique: rows in
// different lists share one number space and older data holds duplicates.
// Without a tiebreaker Postgres returns tied rows in whatever order the plan
// produces, so the admin list and the public landing page can disagree. Every
// query and client-side sort has to use the order defined here.

export const LANDING_FEATURE_ORDER_BY: Array<
  Partial<Record<"position" | "createdAt" | "id", "asc">>
> = [{ position: "asc" }, { createdAt: "asc" }, { id: "asc" }];

type OrderableFeature = {
  id: string;
  position: number;
  createdAt: Date | string;
};

export function compareLandingFeatureOrder(
  a: OrderableFeature,
  b: OrderableFeature,
): number {
  if (a.position !== b.position) return a.position - b.position;

  const createdDelta =
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (createdDelta !== 0) return createdDelta;

  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}

/**
 * Returns the list with `id` swapped with its neighbour, or null when the move
 * is not possible (unknown id, or already at that end).
 */
export function moveLandingFeatureId(
  orderedIds: readonly string[],
  id: string,
  delta: -1 | 1,
): string[] | null {
  const from = orderedIds.indexOf(id);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= orderedIds.length) return null;

  const next = [...orderedIds];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function parseReorderIds(body: unknown): string[] | null {
  if (!body || typeof body !== "object") return null;

  const ids = (body as { ids?: unknown }).ids;
  if (!Array.isArray(ids) || ids.length === 0) return null;
  if (!ids.every((id) => typeof id === "string" && id.length > 0)) return null;
  if (new Set(ids).size !== ids.length) return null;

  return ids as string[];
}

/** A reorder may only touch rows the admin shows together in one list. */
export function isSingleReorderGroup(
  rows: ReadonlyArray<{ section: string; galleryCategory: string | null }>,
): boolean {
  if (rows.length === 0) return false;

  const [first] = rows;
  return rows.every(
    (row) =>
      row.section === first.section &&
      row.galleryCategory === first.galleryCategory,
  );
}
