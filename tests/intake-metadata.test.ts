import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SUPPORTED_LOCALES } from "@/i18n/locales";
import {
  buildIntakeMetadata,
  INTAKE_OG_IMAGE_PATH,
} from "@/lib/intake/metadata";
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/lib/social-preview";

const SITE_ORIGIN = "https://example.com";

/** Pixel size read from a JPEG's start-of-frame segment. */
function readJpegSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path);
  let offset = 2;
  while (offset < buf.length) {
    const marker = buf[offset + 1];
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isStartOfFrame) {
      return {
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + buf.readUInt16BE(offset + 2);
  }
  throw new Error(`No start-of-frame segment in ${path}`);
}

describe("intake link preview", () => {
  const title = "Preencher os detalhes do evento";
  const description = "Conte-nos os detalhes do seu evento.";
  const meta = buildIntakeMetadata(
    { title, description, locale: "pt" },
    SITE_ORIGIN,
  );
  const imageUrl = `${SITE_ORIGIN}${INTAKE_OG_IMAGE_PATH}`;

  it("shares the intake card with its title and description", () => {
    expect(meta.title).toBe(title);
    expect(meta.description).toBe(description);
    expect(meta.openGraph).toEqual({
      title,
      description,
      images: [
        { url: imageUrl, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT },
      ],
      type: "website",
      locale: "pt",
    });
  });

  it("asks for the large image card", () => {
    expect(meta.twitter).toEqual({
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    });
  });

  it("keeps the intake pages out of search indexes", () => {
    expect(meta.robots).toMatchObject({ index: false, follow: false });
  });

  it("ships an image at the size the metadata declares", () => {
    expect(readJpegSize(`public${INTAKE_OG_IMAGE_PATH}`)).toEqual({
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
    });
  });

  it.each(SUPPORTED_LOCALES)("has preview copy in %s", (locale) => {
    const messages = JSON.parse(
      readFileSync(`messages/${locale}.json`, "utf8"),
    ) as { Intake: Record<string, string> };
    expect(messages.Intake.metaTitle).toBeTruthy();
    expect(messages.Intake.metaDescription).toBeTruthy();
  });
});
