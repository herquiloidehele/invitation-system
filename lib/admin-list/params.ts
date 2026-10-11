/**
 * URL state for the paginated admin lists: query-param parsing, page maths
 * and link building. Pure and free of server imports, so both the server
 * loaders and the client components use it.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

export type ListParamValue = string | number | null | undefined;

export const SEARCH_MAX_LENGTH = 100;

/** Upper bound so a hand-typed page can never overflow the query's OFFSET. */
export const MAX_PAGE = 100_000;

/** First value of a query param that may be repeated in the URL. */
export function firstParam(
  raw: RawSearchParams,
  key: string,
): string | undefined {
  const value = raw[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parsePage(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) return 1;
  return Math.min(Math.max(Number(value), 1), MAX_PAGE);
}

/** Removes control characters: Postgres rejects a NUL byte in a text value. */
export function stripControlChars(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, "");
}

export function parseSearch(value: string | undefined): string {
  return stripControlChars(value ?? "").trim().slice(0, SEARCH_MAX_LENGTH);
}

export function parseOption<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export interface Pagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  skip: number;
  take: number;
  /** 1-based position of the first row on the page; 0 when there are no rows. */
  from: number;
  /** 1-based position of the last row on the page; 0 when there are no rows. */
  to: number;
}

/** Page maths for `total` rows, with `page` clamped to the valid range. */
export function paginate(
  total: number,
  page: number,
  pageSize: number,
): Pagination {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const skip = (current - 1) * pageSize;
  return {
    page: current,
    pageSize,
    pageCount,
    total,
    skip,
    take: pageSize,
    from: total === 0 ? 0 : skip + 1,
    to: Math.min(skip + pageSize, total),
  };
}

/**
 * Link to a list view. `patch` is merged over `current`; empty values, page 1
 * and values equal to `defaults` are left out. Unless `patch` sets `page`, the
 * page is dropped, so changing a tab, search or filter returns to page 1.
 */
export function buildListHref(
  pathname: string,
  current: Record<string, ListParamValue>,
  patch: Record<string, ListParamValue> = {},
  defaults: Record<string, string> = {},
): string {
  const merged: Record<string, ListParamValue> = { ...current, ...patch };
  if (!("page" in patch)) delete merged.page;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value === null || value === undefined) continue;
    const text = String(value);
    if (text === "") continue;
    if (text === (key === "page" ? "1" : defaults[key])) continue;
    search.set(key, text);
  }
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** Reads a list link back into the view it points at (the inverse of `buildListHref`). */
export function parseListHref(
  href: string,
  defaults: Record<string, string> = {},
): Record<string, string> {
  const queryStart = href.indexOf("?");
  const query = queryStart === -1 ? "" : href.slice(queryStart + 1);
  return { ...defaults, ...Object.fromEntries(new URLSearchParams(query)) };
}

/**
 * Tracks a navigation that has started but not rendered yet, so the next link
 * is built from where the list is heading, not from what the server last
 * rendered. Without it, typing a search right after clicking a tab would send
 * the admin back to the old tab.
 */
export interface ListViewState {
  /** Identity of the server view this state was last synced with. */
  serverKey: string;
  /** The view being navigated to from that server view, if still loading. */
  pending: Record<string, ListParamValue> | null;
}

const listViewKey = (server: Record<string, ListParamValue>) =>
  JSON.stringify(server);

export function initialListViewState(
  server: Record<string, ListParamValue>,
): ListViewState {
  return { serverKey: listViewKey(server), pending: null };
}

/**
 * Call on every render. A changed server view means the pending navigation is
 * over: it rendered, or the admin went somewhere else (Back / Forward).
 * Returns the same object when nothing changed.
 */
export function syncListViewState(
  state: ListViewState,
  server: Record<string, ListParamValue>,
): ListViewState {
  const serverKey = listViewKey(server);
  return state.serverKey === serverKey ? state : { serverKey, pending: null };
}

export function startListNavigation(
  state: ListViewState,
  href: string,
  defaults: Record<string, string> = {},
): ListViewState {
  return { ...state, pending: parseListHref(href, defaults) };
}

/** The view to build the next link from. */
export function listView<Server extends Record<string, ListParamValue>>(
  state: ListViewState,
  server: Server,
): Server | Record<string, ListParamValue> {
  return state.pending ?? server;
}

export type PageItem = number | "gap";

/** Page numbers to show: first, last and the neighbours of the current page. */
export function pageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const shown = [1, page - 1, page, page + 1, pageCount]
    .filter((value) => value >= 1 && value <= pageCount)
    .filter((value, index, all) => all.indexOf(value) === index)
    .sort((a, b) => a - b);

  const items: PageItem[] = [];
  let previous = 0;
  for (const value of shown) {
    // A single hidden page is shown as itself; a longer run becomes a gap.
    if (value - previous === 2) items.push(previous + 1);
    else if (value - previous > 2) items.push("gap");
    items.push(value);
    previous = value;
  }
  return items;
}
