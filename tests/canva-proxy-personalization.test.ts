import { brotliDecompressSync } from "node:zlib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/canva-proxy/[...path]/route";
import { encodeCanvaPersonalization } from "../lib/canva-personalization";

const HTML =
  '<html><head></head><body>"A":"Olá {{nome}}" "u":"/confirmar/sara-e-hugo"</body></html>';

function mockUpstream(body = HTML): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(
    async () =>
      new Response(body, { status: 200, headers: { "content-type": "text/html" } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function req(host: string, pz?: string): NextRequest {
  const q = pz ? `?pz=${encodeURIComponent(pz)}` : "";
  return new NextRequest(`http://localhost:3000/canva-proxy/${host}${q}`, {
    headers: { "accept-encoding": "br" },
  });
}
function ctx(host: string) {
  return { params: Promise.resolve({ path: [host] }) };
}
async function decoded(res: Response): Promise<string> {
  return brotliDecompressSync(Buffer.from(await res.arrayBuffer())).toString("utf8");
}

afterEach(() => vi.unstubAllGlobals());

describe("canva-proxy personalization", () => {
  it("replaces tokens + appends confirm params for a guest, and marks it private", async () => {
    const host = "perso-guest.canva.site";
    mockUpstream();
    const pz = encodeCanvaPersonalization({
      name: "Maria",
      companion: "",
      tableLabel: "",
      totalGuests: "",
      token: "tok_1",
      nameSlug: "maria",
    });
    const res = await GET(req(host, pz), ctx(host));
    const html = await decoded(res);
    expect(html).toContain('"A":"Olá Maria"');
    expect(html).toContain("/confirmar/sara-e-hugo?g=tok_1&n=maria");
    expect(res.headers.get("cache-control")).toContain("private");
    expect(res.headers.get("cdn-cache-control")).toBeNull();
  });

  it("applies fallback + leaves confirm link untouched when no guest, and stays publicly cacheable", async () => {
    const host = "perso-none.canva.site";
    mockUpstream();
    const res = await GET(req(host), ctx(host));
    const html = await decoded(res);
    expect(html).toContain('"A":"Olá Convidado(a)"');
    expect(html).toContain('"u":"/confirmar/sara-e-hugo"');
    expect(html).not.toContain("?g=");
    expect(res.headers.get("cache-control")).toContain("s-maxage=300");
  });

  it("reuses the shared template across two different guests (one upstream fetch)", async () => {
    const host = "perso-shared.canva.site";
    const fetchMock = mockUpstream();
    const mk = (name: string, token: string) =>
      encodeCanvaPersonalization({
        name,
        companion: "",
        tableLabel: "",
        totalGuests: "",
        token,
        nameSlug: name.toLowerCase(),
      });
    const a = await decoded(await GET(req(host, mk("Ana", "t1")), ctx(host)));
    const b = await decoded(await GET(req(host, mk("Rui", "t2")), ctx(host)));
    expect(a).toContain("Ana");
    expect(b).toContain("Rui");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
