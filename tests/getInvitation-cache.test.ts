import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock React's `cache` so we can verify the production code wraps its
// fetchers with it. React's runtime dedup only kicks in inside a server-
// component request context (AsyncLocalStorage / equivalent), which the
// plain node test env does not provide — so a behavioral dedup test
// would always fail even when the code is correct. Instead we assert
// that the export is the *result of* a `cache(...)` call by tagging the
// returned function via the mock.
const cacheSpy = vi.fn((fn: unknown) => {
  const wrapped = ((...args: unknown[]) =>
    (fn as (...a: unknown[]) => unknown)(...args)) as unknown as {
    __wrappedByReactCache: true;
  };
  wrapped.__wrappedByReactCache = true;
  return wrapped;
});

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    cache: cacheSpy,
  };
});

const findUniqueInvitation = vi.fn();
const findUniqueTheme = vi.fn();

vi.mock("../lib/db", () => ({
  prisma: {
    invitation: { findUnique: findUniqueInvitation },
    theme: { findUnique: findUniqueTheme },
  },
}));

beforeEach(() => {
  cacheSpy.mockClear();
  findUniqueInvitation.mockReset();
  findUniqueTheme.mockReset();
});

describe("getInvitation request-scoped caching", () => {
  it("wraps getInvitation with React.cache", async () => {
    const mod = await import("../lib/invitations");
    expect(
      (mod.getInvitation as unknown as { __wrappedByReactCache?: boolean })
        .__wrappedByReactCache,
    ).toBe(true);
  });

  it("forwards the slug to prisma.invitation.findUnique", async () => {
    findUniqueInvitation.mockResolvedValue(null);
    const { getInvitation } = await import("../lib/invitations");
    await getInvitation("slug-a");
    expect(findUniqueInvitation).toHaveBeenCalledWith({
      where: { slug: "slug-a" },
      include: { theme: { select: { name: true } } },
    });
  });
});

describe("getTheme request-scoped caching", () => {
  it("wraps getTheme with React.cache", async () => {
    const mod = await import("../lib/themes");
    expect(
      (mod.getTheme as unknown as { __wrappedByReactCache?: boolean })
        .__wrappedByReactCache,
    ).toBe(true);
  });

  it("forwards the name to prisma.theme.findUnique", async () => {
    findUniqueTheme.mockResolvedValue(null);
    const { getTheme } = await import("../lib/themes");
    await getTheme("theme-a");
    expect(findUniqueTheme).toHaveBeenCalledWith({ where: { name: "theme-a" } });
  });
});
