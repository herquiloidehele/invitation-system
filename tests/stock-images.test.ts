import { describe, expect, it } from "vitest";

import {
  configuredProviders,
  fetchImageBytes,
  imageDimensions,
  interleaveByProvider,
  normalizePexels,
  normalizePixabay,
  normalizeUnsplash,
  providerRequest,
  searchStockImages,
  stockObjectKey,
  type StockImage,
} from "@/lib/stock-images";

const PEXELS_RESPONSE = {
  photos: [
    {
      id: 3184405,
      width: 5184,
      height: 3456,
      url: "https://www.pexels.com/photo/table-setting-3184405/",
      photographer: "Fauxels",
      photographer_url: "https://www.pexels.com/@fauxels",
      alt: "Long table set for a dinner under string lights",
      src: {
        original: "https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg",
        large2x: "https://images.pexels.com/photos/3184405/l2x.jpeg",
        large: "https://images.pexels.com/photos/3184405/large.jpeg",
        medium: "https://images.pexels.com/photos/3184405/medium.jpeg",
        small: "https://images.pexels.com/photos/3184405/small.jpeg",
        tiny: "https://images.pexels.com/photos/3184405/tiny.jpeg",
      },
    },
  ],
};

describe("normalizePexels", () => {
  it("maps a photo onto the shared StockImage shape", () => {
    const [image] = normalizePexels(PEXELS_RESPONSE);

    expect(image.provider).toBe("pexels");
    expect(image.id).toBe("3184405");
    expect(image.width).toBe(5184);
    expect(image.height).toBe(3456);
    expect(image.description).toBe(
      "Long table set for a dinner under string lights",
    );
    expect(image.pageUrl).toBe(
      "https://www.pexels.com/photo/table-setting-3184405/",
    );
  });

  it("uses the large source for mirroring and a small one for the thumbnail", () => {
    const [image] = normalizePexels(PEXELS_RESPONSE);

    expect(image.fullUrl).toBe("https://images.pexels.com/photos/3184405/l2x.jpeg");
    expect(image.thumbUrl).toBe(
      "https://images.pexels.com/photos/3184405/medium.jpeg",
    );
  });

  it("credits the photographer and the provider", () => {
    const [image] = normalizePexels(PEXELS_RESPONSE);

    expect(image.credit).toBe(
      "Photo by Fauxels on Pexels (https://www.pexels.com/photo/table-setting-3184405/)",
    );
  });

  it("falls back to a readable description when alt is empty", () => {
    const [image] = normalizePexels({
      photos: [{ ...PEXELS_RESPONSE.photos[0], alt: "" }],
    });

    expect(image.description).toBe("Photo by Fauxels");
  });

  it("returns an empty list for a response with no photos array", () => {
    expect(normalizePexels({})).toEqual([]);
    expect(normalizePexels(null)).toEqual([]);
  });
});

const UNSPLASH_RESPONSE = {
  results: [
    {
      id: "Pn6iimgM-eo",
      width: 6000,
      height: 4000,
      description: null,
      alt_description: "white and pink roses on a linen cloth",
      urls: {
        raw: "https://images.unsplash.com/photo-1?raw",
        full: "https://images.unsplash.com/photo-1?full",
        regular: "https://images.unsplash.com/photo-1?regular",
        small: "https://images.unsplash.com/photo-1?small",
        thumb: "https://images.unsplash.com/photo-1?thumb",
      },
      links: {
        html: "https://unsplash.com/photos/Pn6iimgM-eo",
        download_location: "https://api.unsplash.com/photos/Pn6iimgM-eo/download",
      },
      user: { name: "Annie Spratt", links: { html: "https://unsplash.com/@anniespratt" } },
    },
  ],
};

describe("normalizeUnsplash", () => {
  it("maps a photo onto the shared StockImage shape", () => {
    const [image] = normalizeUnsplash(UNSPLASH_RESPONSE);

    expect(image.provider).toBe("unsplash");
    expect(image.id).toBe("Pn6iimgM-eo");
    expect(image.width).toBe(6000);
    expect(image.height).toBe(4000);
    expect(image.description).toBe("white and pink roses on a linen cloth");
    expect(image.pageUrl).toBe("https://unsplash.com/photos/Pn6iimgM-eo");
  });

  it("mirrors the regular size and previews the small one", () => {
    const [image] = normalizeUnsplash(UNSPLASH_RESPONSE);

    expect(image.fullUrl).toBe("https://images.unsplash.com/photo-1?regular");
    expect(image.thumbUrl).toBe("https://images.unsplash.com/photo-1?small");
  });

  it("keeps the download_location so the required download can be reported", () => {
    const [image] = normalizeUnsplash(UNSPLASH_RESPONSE);

    expect(image.downloadLocation).toBe(
      "https://api.unsplash.com/photos/Pn6iimgM-eo/download",
    );
  });

  it("prefers the human description over alt_description", () => {
    const [image] = normalizeUnsplash({
      results: [{ ...UNSPLASH_RESPONSE.results[0], description: "Bridal bouquet" }],
    });

    expect(image.description).toBe("Bridal bouquet");
  });

  it("credits the photographer and the provider", () => {
    const [image] = normalizeUnsplash(UNSPLASH_RESPONSE);

    expect(image.credit).toBe(
      "Photo by Annie Spratt on Unsplash (https://unsplash.com/photos/Pn6iimgM-eo)",
    );
  });

  it("returns an empty list when there are no results", () => {
    expect(normalizeUnsplash({})).toEqual([]);
  });
});

const PIXABAY_RESPONSE = {
  totalHits: 1,
  hits: [
    {
      id: 1508202,
      pageURL: "https://pixabay.com/photos/wedding-arch-beach-1508202/",
      tags: "wedding arch, beach, ceremony",
      previewURL: "https://cdn.pixabay.com/photo/preview_150.jpg",
      webformatURL: "https://pixabay.com/get/webformat_640.jpg",
      largeImageURL: "https://pixabay.com/get/large_1280.jpg",
      imageWidth: 4288,
      imageHeight: 2848,
      user: "Pexels",
    },
  ],
};

describe("normalizePixabay", () => {
  it("maps a hit onto the shared StockImage shape", () => {
    const [image] = normalizePixabay(PIXABAY_RESPONSE);

    expect(image.provider).toBe("pixabay");
    expect(image.id).toBe("1508202");
    expect(image.width).toBe(4288);
    expect(image.height).toBe(2848);
    expect(image.description).toBe("wedding arch, beach, ceremony");
    expect(image.pageUrl).toBe(
      "https://pixabay.com/photos/wedding-arch-beach-1508202/",
    );
  });

  it("mirrors the large image and previews the webformat", () => {
    const [image] = normalizePixabay(PIXABAY_RESPONSE);

    expect(image.fullUrl).toBe("https://pixabay.com/get/large_1280.jpg");
    expect(image.thumbUrl).toBe("https://pixabay.com/get/webformat_640.jpg");
  });

  it("credits the uploader and the provider", () => {
    const [image] = normalizePixabay(PIXABAY_RESPONSE);

    expect(image.credit).toBe(
      "Photo by Pexels on Pixabay (https://pixabay.com/photos/wedding-arch-beach-1508202/)",
    );
  });

  it("returns an empty list when there are no hits", () => {
    expect(normalizePixabay({})).toEqual([]);
  });
});

describe("interleaveByProvider", () => {
  const image = (provider: StockImage["provider"], id: string): StockImage => ({
    provider,
    id,
    description: id,
    width: 100,
    height: 100,
    thumbUrl: `${id}-thumb`,
    fullUrl: `${id}-full`,
    credit: id,
    pageUrl: id,
  });

  it("takes one from each provider in turn so no provider dominates", () => {
    const merged = interleaveByProvider(
      [
        [image("pexels", "p1"), image("pexels", "p2")],
        [image("unsplash", "u1"), image("unsplash", "u2")],
        [image("pixabay", "x1")],
      ],
      6,
    );

    expect(merged.map((i) => i.id)).toEqual(["p1", "u1", "x1", "p2", "u2"]);
  });

  it("caps the merged list at the limit", () => {
    const merged = interleaveByProvider(
      [
        [image("pexels", "p1"), image("pexels", "p2")],
        [image("unsplash", "u1"), image("unsplash", "u2")],
      ],
      3,
    );

    expect(merged).toHaveLength(3);
  });

  it("keeps going when one provider runs out early", () => {
    const merged = interleaveByProvider(
      [[image("pexels", "p1")], [], [image("pixabay", "x1"), image("pixabay", "x2")]],
      10,
    );

    expect(merged.map((i) => i.id)).toEqual(["p1", "x1", "x2"]);
  });

  it("drops duplicates of the same provider and id", () => {
    const merged = interleaveByProvider(
      [[image("pexels", "p1"), image("pexels", "p1")], []],
      10,
    );

    expect(merged).toHaveLength(1);
  });
});

describe("configuredProviders", () => {
  it("lists only the providers whose key is set", () => {
    expect(
      configuredProviders({ PEXELS_API_KEY: "k", PIXABAY_API_KEY: "  " }),
    ).toEqual(["pexels"]);
  });

  it("is empty when nothing is configured", () => {
    expect(configuredProviders({})).toEqual([]);
  });
});

describe("providerRequest", () => {
  it("authenticates Pexels with a bare Authorization header", () => {
    const req = providerRequest("pexels", { query: "olive grove", limit: 4, key: "k" });

    expect(req.url).toContain("https://api.pexels.com/v1/search");
    expect(req.url).toContain("query=olive+grove");
    expect(req.url).toContain("per_page=4");
    expect(req.headers.Authorization).toBe("k");
  });

  it("authenticates Unsplash with a Client-ID header", () => {
    const req = providerRequest("unsplash", { query: "olive grove", limit: 4, key: "k" });

    expect(req.url).toContain("https://api.unsplash.com/search/photos");
    expect(req.headers.Authorization).toBe("Client-ID k");
  });

  it("passes the Pixabay key in the query string and asks for photos only", () => {
    const req = providerRequest("pixabay", { query: "olive grove", limit: 4, key: "k" });

    expect(req.url).toContain("https://pixabay.com/api/");
    expect(req.url).toContain("key=k");
    expect(req.url).toContain("image_type=photo");
    expect(req.headers.Authorization).toBeUndefined();
  });

  it("translates a square orientation into each provider's own vocabulary", () => {
    const o = "square" as const;
    expect(providerRequest("pexels", { query: "q", limit: 4, key: "k", orientation: o }).url)
      .toContain("orientation=square");
    expect(providerRequest("unsplash", { query: "q", limit: 4, key: "k", orientation: o }).url)
      .toContain("orientation=squarish");
    // Pixabay has no square option, so it must not send a bogus one.
    expect(providerRequest("pixabay", { query: "q", limit: 4, key: "k", orientation: o }).url)
      .not.toContain("orientation=");
  });

  it("translates landscape and portrait for Pixabay", () => {
    expect(
      providerRequest("pixabay", { query: "q", limit: 4, key: "k", orientation: "landscape" }).url,
    ).toContain("orientation=horizontal");
    expect(
      providerRequest("pixabay", { query: "q", limit: 4, key: "k", orientation: "portrait" }).url,
    ).toContain("orientation=vertical");
  });

  it("raises the Pixabay page size to its minimum of 3", () => {
    expect(providerRequest("pixabay", { query: "q", limit: 1, key: "k" }).url).toContain(
      "per_page=3",
    );
  });
});

describe("searchStockImages", () => {
  const env = {
    PEXELS_API_KEY: "p",
    UNSPLASH_ACCESS_KEY: "u",
    PIXABAY_API_KEY: "x",
  };

  const okFetch = (async (input: string | URL | Request) => {
    const url = String(input);
    const body = url.includes("pexels")
      ? PEXELS_RESPONSE
      : url.includes("unsplash")
        ? UNSPLASH_RESPONSE
        : PIXABAY_RESPONSE;
    return new Response(JSON.stringify(body), { status: 200 });
  }) as typeof fetch;

  it("merges results from every configured provider", async () => {
    const result = await searchStockImages({
      query: "olive grove",
      env,
      fetchImpl: okFetch,
    });

    expect(result.images.map((i) => i.provider)).toEqual([
      "pexels",
      "unsplash",
      "pixabay",
    ]);
    expect(result.providers.every((p) => p.status === "ok")).toBe(true);
  });

  it("skips a provider with no key instead of failing the search", async () => {
    const result = await searchStockImages({
      query: "olive grove",
      env: { PEXELS_API_KEY: "p" },
      fetchImpl: okFetch,
    });

    expect(result.images.map((i) => i.provider)).toEqual(["pexels"]);
    expect(result.providers.map((p) => p.provider)).toEqual(["pexels"]);
  });

  it("keeps the other providers when one fails", async () => {
    const failingUnsplash = (async (input: string | URL | Request) => {
      if (String(input).includes("unsplash")) throw new Error("network down");
      return okFetch(input);
    }) as typeof fetch;

    const result = await searchStockImages({
      query: "olive grove",
      env,
      fetchImpl: failingUnsplash,
    });

    expect(result.images.map((i) => i.provider)).toEqual(["pexels", "pixabay"]);
    const unsplash = result.providers.find((p) => p.provider === "unsplash");
    expect(unsplash?.status).toBe("error");
    expect(unsplash?.note).toContain("network down");
  });

  it("reports a non-2xx response as an error rather than throwing", async () => {
    const rateLimited = (async () =>
      new Response("rate limited", { status: 429 })) as typeof fetch;

    const result = await searchStockImages({
      query: "olive grove",
      env: { PEXELS_API_KEY: "p" },
      fetchImpl: rateLimited,
    });

    expect(result.images).toEqual([]);
    expect(result.providers[0].status).toBe("error");
    expect(result.providers[0].note).toContain("429");
  });

  it("returns nothing when no provider is configured", async () => {
    const result = await searchStockImages({
      query: "olive grove",
      env: {},
      fetchImpl: okFetch,
    });

    expect(result.images).toEqual([]);
    expect(result.providers).toEqual([]);
  });
});

describe("stockObjectKey", () => {
  it("namespaces the object by invitation and provider", () => {
    expect(
      stockObjectKey("inv_123", { provider: "pexels", id: "3184405" }, "image/jpeg"),
    ).toBe("ai-stock/inv_123/pexels-3184405.jpg");
  });

  it("maps the content type onto the extension", () => {
    const at = (type: string) =>
      stockObjectKey("i", { provider: "unsplash", id: "a" }, type).split(".").pop();

    expect(at("image/png")).toBe("png");
    expect(at("image/webp")).toBe("webp");
    expect(at("image/jpeg")).toBe("jpg");
    expect(at("application/octet-stream")).toBe("jpg");
  });

  it("strips characters that have no business in an object key", () => {
    expect(
      stockObjectKey("inv/1", { provider: "pixabay", id: "../secret" }, "image/jpeg"),
    ).toBe("ai-stock/inv1/pixabay-secret.jpg");
  });
});

describe("fetchImageBytes", () => {
  const bytes = (n: number) => new Uint8Array(n).fill(7);

  it("returns the body and its content type", async () => {
    const fetchImpl = (async () =>
      new Response(bytes(10), {
        status: 200,
        headers: { "content-type": "image/png" },
      })) as typeof fetch;

    const result = await fetchImageBytes("https://x/y.png", { fetchImpl });

    expect(result.contentType).toBe("image/png");
    expect(result.buffer).toHaveLength(10);
  });

  it("defaults to jpeg when the server sends no content type", async () => {
    const fetchImpl = (async () => new Response(bytes(4), { status: 200 })) as typeof fetch;

    const result = await fetchImageBytes("https://x/y", { fetchImpl });

    expect(result.contentType).toBe("image/jpeg");
  });

  it("refuses a body larger than the cap", async () => {
    const fetchImpl = (async () =>
      new Response(bytes(50), {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      })) as typeof fetch;

    await expect(
      fetchImageBytes("https://x/y.jpg", { fetchImpl, maxBytes: 10 }),
    ).rejects.toThrow(/too large/i);
  });

  it("throws on a non-2xx response", async () => {
    const fetchImpl = (async () => new Response("nope", { status: 404 })) as typeof fetch;

    await expect(fetchImageBytes("https://x/y.jpg", { fetchImpl })).rejects.toThrow(
      /404/,
    );
  });

  it("rejects a response that is not an image", async () => {
    const fetchImpl = (async () =>
      new Response("<html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      })) as typeof fetch;

    await expect(fetchImageBytes("https://x/y", { fetchImpl })).rejects.toThrow(
      /not an image/i,
    );
  });
});

describe("imageDimensions", () => {
  const png = (width: number, height: number) => {
    const buf = Buffer.alloc(24);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0);
    buf.write("IHDR", 12, "ascii");
    buf.writeUInt32BE(width, 16);
    buf.writeUInt32BE(height, 20);
    return buf;
  };

  const jpeg = (width: number, height: number) => {
    // SOI, an APP0 segment to be skipped, then the SOF0 carrying the size.
    const app0 = Buffer.alloc(4 + 14);
    app0.writeUInt16BE(0xffe0, 0);
    app0.writeUInt16BE(16, 2); // segment length, excluding the marker
    const sof = Buffer.alloc(2 + 2 + 5);
    sof.writeUInt16BE(0xffc0, 0);
    sof.writeUInt16BE(11, 2);
    sof.writeUInt8(8, 4); // sample precision
    sof.writeUInt16BE(height, 5);
    sof.writeUInt16BE(width, 7);
    return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof]);
  };

  it("reads a PNG's IHDR dimensions", () => {
    expect(imageDimensions(png(1280, 853))).toEqual({ width: 1280, height: 853 });
  });

  it("reads a JPEG's dimensions past an earlier segment", () => {
    expect(imageDimensions(jpeg(1080, 1620))).toEqual({ width: 1080, height: 1620 });
  });

  it("returns null for a format it cannot read rather than guessing", () => {
    expect(imageDimensions(Buffer.from("RIFF....WEBPVP8X"))).toBeNull();
    expect(imageDimensions(Buffer.alloc(3))).toBeNull();
  });

  it("returns null for a truncated JPEG instead of looping forever", () => {
    expect(imageDimensions(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]))).toBeNull();
  });
});
