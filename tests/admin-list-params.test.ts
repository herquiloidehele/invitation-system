import { describe, expect, it } from "vitest";

import {
  MAX_PAGE,
  buildListHref,
  firstParam,
  initialListViewState,
  listView,
  pageItems,
  paginate,
  parseListHref,
  parseOption,
  parsePage,
  parseSearch,
  startListNavigation,
  syncListViewState,
} from "@/lib/admin-list/params";

describe("firstParam", () => {
  it("reads a single value, the first of a repeated one, or undefined", () => {
    expect(firstParam({ tab: "demo" }, "tab")).toBe("demo");
    expect(firstParam({ tab: ["demo", "real"] }, "tab")).toBe("demo");
    expect(firstParam({}, "tab")).toBeUndefined();
  });
});

describe("parsePage", () => {
  it("accepts positive integers", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage("007")).toBe(7);
  });

  it("falls back to 1 for anything else", () => {
    for (const value of [undefined, "", "abc", "-2", "1.5", "0", "2e3", " 2"]) {
      expect(parsePage(value)).toBe(1);
    }
  });

  it("caps absurd values instead of overflowing", () => {
    expect(parsePage("999999999999999999999999")).toBe(MAX_PAGE);
  });
});

describe("parseSearch", () => {
  it("trims and tolerates a missing value", () => {
    expect(parseSearch("  ana  ")).toBe("ana");
    expect(parseSearch(undefined)).toBe("");
  });

  it("caps the length at 100 characters", () => {
    expect(parseSearch("a".repeat(250))).toHaveLength(100);
  });

  it("drops control characters, which Postgres rejects in text", () => {
    expect(parseSearch("a\u0000b\u0007c")).toBe("abc");
    expect(parseSearch("\u0000")).toBe("");
    expect(parseSearch("ana\trui\n")).toBe("anarui");
  });
});

describe("parseOption", () => {
  const tabs = ["real", "demo"] as const;

  it("keeps an allowed value and replaces anything else", () => {
    expect(parseOption("demo", tabs, "real")).toBe("demo");
    expect(parseOption("nope", tabs, "real")).toBe("real");
    expect(parseOption(undefined, tabs, "real")).toBe("real");
  });
});

describe("paginate", () => {
  it("describes a page in the middle", () => {
    expect(paginate(312, 2, 25)).toEqual({
      page: 2,
      pageSize: 25,
      pageCount: 13,
      total: 312,
      skip: 25,
      take: 25,
      from: 26,
      to: 50,
    });
  });

  it("ends the last page at the total", () => {
    expect(paginate(312, 13, 25)).toMatchObject({ from: 301, to: 312 });
  });

  it("clamps a page past the end to the last page", () => {
    expect(paginate(30, 9, 25)).toMatchObject({
      page: 2,
      pageCount: 2,
      skip: 25,
      from: 26,
      to: 30,
    });
  });

  it("clamps a page below 1", () => {
    expect(paginate(30, 0, 25)).toMatchObject({ page: 1, skip: 0 });
  });

  it("reports one empty page when there are no rows", () => {
    expect(paginate(0, 4, 25)).toMatchObject({
      page: 1,
      pageCount: 1,
      skip: 0,
      from: 0,
      to: 0,
    });
  });
});

describe("buildListHref", () => {
  const defaults = { tab: "real" };

  it("leaves out defaults, empty values and page 1", () => {
    expect(
      buildListHref(
        "/admin/invitations",
        { tab: "real", q: "", template: "", page: 1 },
        {},
        defaults,
      ),
    ).toBe("/admin/invitations");
  });

  it("keeps the page only when the patch sets it", () => {
    const current = { tab: "demo", q: "ana", template: "", page: 3 };
    expect(
      buildListHref("/admin/invitations", current, { page: 2 }, defaults),
    ).toBe("/admin/invitations?tab=demo&q=ana&page=2");
    expect(
      buildListHref("/admin/invitations", current, { page: 1 }, defaults),
    ).toBe("/admin/invitations?tab=demo&q=ana");
  });

  it("returns to page 1 when a tab, search or filter changes", () => {
    const current = { tab: "demo", q: "ana", template: "", page: 3 };
    expect(
      buildListHref("/admin/invitations", current, { tab: "real" }, defaults),
    ).toBe("/admin/invitations?q=ana");
    expect(
      buildListHref("/admin/invitations", current, { q: "rui" }, defaults),
    ).toBe("/admin/invitations?tab=demo&q=rui");
  });

  it("removes a param patched to null", () => {
    expect(
      buildListHref(
        "/admin/invitations",
        { tab: "real", template: "boho" },
        { template: null },
        defaults,
      ),
    ).toBe("/admin/invitations");
  });

  it("encodes values", () => {
    expect(buildListHref("/admin/formularios", { q: "ana & rui" })).toBe(
      "/admin/formularios?q=ana+%26+rui",
    );
  });
});

describe("pageItems", () => {
  it("lists every page when there are few", () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("collapses long runs into gaps around the current page", () => {
    expect(pageItems(5, 12)).toEqual([1, "gap", 4, 5, 6, "gap", 12]);
    expect(pageItems(1, 12)).toEqual([1, 2, "gap", 12]);
    expect(pageItems(12, 12)).toEqual([1, "gap", 11, 12]);
  });

  it("shows a single hidden page instead of a gap", () => {
    expect(pageItems(4, 12)).toEqual([1, 2, 3, 4, 5, "gap", 12]);
    expect(pageItems(9, 12)).toEqual([1, "gap", 8, 9, 10, 11, 12]);
  });
});

describe("parseListHref", () => {
  it("reads a list link back into the view it points at", () => {
    expect(
      parseListHref("/admin/invitations?tab=demo&q=ana+%26+rui&page=2", {
        tab: "real",
      }),
    ).toEqual({ tab: "demo", q: "ana & rui", page: "2" });
  });

  it("fills in the defaults a link leaves out", () => {
    expect(parseListHref("/admin/invitations", { tab: "real" })).toEqual({
      tab: "real",
    });
    expect(parseListHref("/admin/rsvps?tab=std")).toEqual({ tab: "std" });
  });
});

describe("links built while a navigation is still loading", () => {
  const path = "/admin/invitations";
  const defaults = { tab: "real" };
  const server = { tab: "real", q: "", template: "", page: 1 };
  const hrefFrom = (
    state: ReturnType<typeof initialListViewState>,
    serverParams: typeof server,
    patch: Record<string, string | number | null>,
  ) => buildListHref(path, listView(state, serverParams), patch, defaults);

  it("keeps a tab change that has not loaded yet when the search changes", () => {
    let state = initialListViewState(server);
    // The admin clicks Demo; the server has not answered yet.
    state = startListNavigation(state, hrefFrom(state, server, { tab: "demo" }), defaults);
    // They type before the Demo list appears.
    expect(hrefFrom(state, server, { q: "ana" })).toBe(
      "/admin/invitations?tab=demo&q=ana",
    );
  });

  it("keeps a template choice that has not loaded yet when the tab changes", () => {
    let state = initialListViewState(server);
    state = startListNavigation(state, hrefFrom(state, server, { template: "boho" }), defaults);
    expect(hrefFrom(state, server, { tab: "demo" })).toBe(
      "/admin/invitations?tab=demo&template=boho",
    );
  });

  it("chains three quick changes", () => {
    let state = initialListViewState(server);
    state = startListNavigation(state, hrefFrom(state, server, { tab: "demo" }), defaults);
    state = startListNavigation(state, hrefFrom(state, server, { q: "ana" }), defaults);
    expect(hrefFrom(state, server, { template: "boho" })).toBe(
      "/admin/invitations?tab=demo&q=ana&template=boho",
    );
  });

  it("returns to the server's view once the navigation has rendered", () => {
    let state = initialListViewState(server);
    state = startListNavigation(state, hrefFrom(state, server, { tab: "demo" }), defaults);
    const landed = { ...server, tab: "demo" };
    state = syncListViewState(state, landed);

    expect(listView(state, landed)).toBe(landed);
  });

  it("does not bring an old navigation back after Back to the earlier view", () => {
    let state = initialListViewState(server);
    state = startListNavigation(state, hrefFrom(state, server, { tab: "demo" }), defaults);
    state = syncListViewState(state, { ...server, tab: "demo" });
    // Browser Back: the server renders the first view again.
    state = syncListViewState(state, server);

    expect(listView(state, server)).toBe(server);
    expect(hrefFrom(state, server, { q: "ana" })).toBe("/admin/invitations?q=ana");
  });

  it("keeps the same state object while the server view is unchanged", () => {
    const state = initialListViewState(server);
    expect(syncListViewState(state, { ...server })).toBe(state);
  });
});
