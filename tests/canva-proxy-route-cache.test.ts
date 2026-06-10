import { brotliDecompressSync } from "node:zlib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/canva-proxy/[...path]/route";

/* ------------------------------------------------------------------ */
/*  Canva proxy HTML caching (route-level integration)                  */
/*                                                                      */
/*  Proves the end-to-end cache behaviour with a mocked upstream:       */
/*  a 200 HTML shell is rewritten + compressed once, then a second      */
/*  identical request is served from memory (no upstream fetch) with    */
/*  byte-identical content. Non-200 upstreams are never cached.         */
/* ------------------------------------------------------------------ */

const HTML = "<html><head></head><body>hello from canva</body></html>";

function mockUpstream(status: number, body = HTML): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async () =>
    new Response(body, {
      status,
      headers: { "content-type": "text/html" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function request(host: string): NextRequest {
  return new NextRequest(`http://localhost:3000/canva-proxy/${host}`, {
    headers: { "accept-encoding": "br" },
  });
}

function ctx(host: string) {
  return { params: Promise.resolve({ path: [host] }) };
}

async function decoded(res: Response): Promise<string> {
  const buf = Buffer.from(await res.arrayBuffer());
  return brotliDecompressSync(buf).toString("utf8");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("canva-proxy HTML caching", () => {
  it("serves the second identical request from cache without re-fetching", async () => {
    // Unique host per test so prior runs' cache entries can't interfere.
    const host = "cache-hit-demo.canva.site";
    const fetchMock = mockUpstream(200);

    const first = await GET(request(host), ctx(host));
    expect(first.status).toBe(200);
    expect(first.headers.get("x-proxy-cache")).toBeNull();
    expect(first.headers.get("content-encoding")).toBe("br");

    const second = await GET(request(host), ctx(host));
    expect(second.status).toBe(200);
    expect(second.headers.get("x-proxy-cache")).toBe("HIT");

    // Upstream was contacted exactly once across both requests.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Cached body is byte-identical and still decodes to the rewritten HTML.
    const a = await decoded(first);
    const b = await decoded(second);
    expect(b).toBe(a);
    expect(b).toContain("hello from canva");
  });

  it("does not cache a non-200 upstream", async () => {
    const host = "not-found-demo.canva.site";
    const fetchMock = mockUpstream(404);

    const first = await GET(request(host), ctx(host));
    expect(first.status).toBe(404);

    const second = await GET(request(host), ctx(host));
    expect(second.headers.get("x-proxy-cache")).toBeNull();
    // Each request hit the upstream — nothing was cached.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
