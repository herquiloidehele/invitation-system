import { paginate, type Pagination } from "./params";

/**
 * Escapes LIKE wildcards. Prisma passes `%` and `_` through to Postgres as
 * wildcards, so an unescaped "%" would match every row.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

/**
 * Case-insensitive match on `slug`, `couple.bride` or `couple.groom`, for the
 * models that have a `slug` column and a `couple` JSON column (Invitation and
 * SaveTheDate). Returns an empty object when there is nothing to search for.
 */
export function coupleSearchWhere(q: string) {
  if (!q) return {};
  const term = escapeLike(q);
  return {
    OR: [
      { slug: { contains: term, mode: "insensitive" as const } },
      {
        couple: {
          path: ["bride"],
          string_contains: term,
          mode: "insensitive" as const,
        },
      },
      {
        couple: {
          path: ["groom"],
          string_contains: term,
          mode: "insensitive" as const,
        },
      },
    ],
  };
}

/**
 * Runs the count and the rows query for `requestedPage` in parallel. When that
 * page is past the end (the last row of the last page was deleted, or the URL
 * was edited by hand) the rows are fetched again for the last valid page.
 */
export async function fetchPage<Row>(
  requestedPage: number,
  pageSize: number,
  count: () => Promise<number>,
  findRows: (skip: number, take: number) => Promise<Row[]>,
): Promise<{ rows: Row[]; pagination: Pagination }> {
  const page = Math.max(1, requestedPage);
  const [total, rows] = await Promise.all([
    count(),
    findRows((page - 1) * pageSize, pageSize),
  ]);
  const pagination = paginate(total, page, pageSize);
  if (pagination.page === page) return { rows, pagination };
  return {
    rows: await findRows(pagination.skip, pagination.take),
    pagination,
  };
}
