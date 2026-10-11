"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  buildListHref,
  initialListViewState,
  listView,
  startListNavigation,
  syncListViewState,
  type ListParamValue,
} from "@/lib/admin-list/params";

const SEARCH_DEBOUNCE_MS = 300;

interface UseListUrlStateOptions {
  pathname: string;
  /** The view the server rendered. Search text, when the list has it, is `q`. */
  params: Record<string, ListParamValue>;
  /** Values that are left out of the URL. */
  defaults?: Record<string, string>;
}

/**
 * Keeps an admin list's tab / search / filter / page in the query string. The
 * server page re-renders the list from those params; this hook only edits the
 * URL and reports when a navigation is in flight.
 */
export function useListUrlState({
  pathname,
  params,
  defaults,
}: UseListUrlStateOptions) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Links are built from where the list is heading, so a second change made
  // while the first is still loading does not undo it.
  const [viewState, setViewState] = useState(() =>
    initialListViewState(params),
  );
  const syncedViewState = syncListViewState(viewState, params);
  if (syncedViewState !== viewState) setViewState(syncedViewState);
  const view = listView(syncedViewState, params);

  const urlSearch = typeof params.q === "string" ? params.q : "";
  const [searchText, setSearchTextState] = useState(urlSearch);
  const [seenUrlSearch, setSeenUrlSearch] = useState(urlSearch);
  const [writtenSearch, setWrittenSearch] = useState(urlSearch);

  // The URL's search changed. Adopt it when it came from outside (Back /
  // Forward); skip it when it is our own write arriving, so a slow response
  // never overwrites what is being typed.
  if (urlSearch !== seenUrlSearch) {
    setSeenUrlSearch(urlSearch);
    if (urlSearch !== writtenSearch) {
      setSearchTextState(urlSearch);
      setWrittenSearch(urlSearch);
    }
  }

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelPendingSearch = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  /** Link to this list with `patch` applied, carrying the typed search text. */
  const hrefFor = (patch: Record<string, ListParamValue> = {}) =>
    buildListHref(pathname, { ...view, q: searchText.trim() }, patch, defaults);

  const go = (href: string, mode: "push" | "replace") => {
    setViewState((state) => startListNavigation(state, href, defaults));
    startTransition(() => {
      if (mode === "push") router.push(href);
      else router.replace(href, { scroll: false });
    });
  };

  /** Tab, filter, picker and page changes: a history entry each. */
  const navigate = (href: string) => {
    cancelPendingSearch();
    setWrittenSearch(searchText.trim());
    go(href, "push");
  };

  const setParam = (key: string, value: ListParamValue) =>
    navigate(hrefFor({ [key]: value }));

  /** Typing: instant in the box, written to the URL after a short pause. */
  const setSearchText = (text: string) => {
    setSearchTextState(text);
    cancelPendingSearch();
    timer.current = setTimeout(() => {
      timer.current = null;
      const q = text.trim();
      setWrittenSearch(q);
      go(buildListHref(pathname, { ...view, q }, {}, defaults), "replace");
    }, SEARCH_DEBOUNCE_MS);
  };

  /** Re-reads the list after a change (delete, block), dimming it meanwhile. */
  const refresh = useCallback(
    () => startTransition(() => router.refresh()),
    [router],
  );

  return {
    searchText,
    setSearchText,
    hrefFor,
    navigate,
    setParam,
    refresh,
    isPending,
  };
}
