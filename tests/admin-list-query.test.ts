import { describe, expect, it, vi } from "vitest";

import {
  coupleSearchWhere,
  escapeLike,
  fetchPage,
} from "@/lib/admin-list/query";

describe("escapeLike", () => {
  it("escapes the LIKE wildcards and the escape character itself", () => {
    expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\");
    expect(escapeLike("ana")).toBe("ana");
  });
});

describe("coupleSearchWhere", () => {
  it("adds nothing when there is no search text", () => {
    expect(coupleSearchWhere("")).toEqual({});
  });

  it("matches slug, bride or groom, ignoring case", () => {
    expect(coupleSearchWhere("Ana")).toEqual({
      OR: [
        { slug: { contains: "Ana", mode: "insensitive" } },
        {
          couple: {
            path: ["bride"],
            string_contains: "Ana",
            mode: "insensitive",
          },
        },
        {
          couple: {
            path: ["groom"],
            string_contains: "Ana",
            mode: "insensitive",
          },
        },
      ],
    });
  });

  it("treats % and _ as literal characters, not wildcards", () => {
    expect(coupleSearchWhere("a_b%")).toMatchObject({
      OR: [
        { slug: { contains: "a\\_b\\%" } },
        { couple: { string_contains: "a\\_b\\%" } },
        { couple: { string_contains: "a\\_b\\%" } },
      ],
    });
  });
});

describe("fetchPage", () => {
  it("queries the requested page once when it exists", async () => {
    const findRows = vi.fn(async () => ["row"]);
    const result = await fetchPage(2, 25, async () => 60, findRows);

    expect(findRows).toHaveBeenCalledTimes(1);
    expect(findRows).toHaveBeenCalledWith(25, 25);
    expect(result.rows).toEqual(["row"]);
    expect(result.pagination).toMatchObject({ page: 2, pageCount: 3, total: 60 });
  });

  it("re-queries the last page when the requested page is past the end", async () => {
    const findRows = vi
      .fn<(skip: number, take: number) => Promise<string[]>>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(["last"]);
    const result = await fetchPage(9, 25, async () => 30, findRows);

    expect(findRows).toHaveBeenNthCalledWith(1, 200, 25);
    expect(findRows).toHaveBeenNthCalledWith(2, 25, 25);
    expect(result.rows).toEqual(["last"]);
    expect(result.pagination.page).toBe(2);
  });

  it("returns an empty first page for an empty table", async () => {
    const findRows = vi.fn(async () => []);
    const result = await fetchPage(1, 25, async () => 0, findRows);

    expect(findRows).toHaveBeenCalledTimes(1);
    expect(result.pagination).toMatchObject({ page: 1, total: 0, from: 0, to: 0 });
  });
});
