import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProductMediaGallery } from "@/components/landing/details/ProductMediaGallery";

const PREVIEW_HREF = "/sofia-augustos";

function renderGallery(images: string[]): string {
  return renderToStaticMarkup(
    createElement(ProductMediaGallery, {
      title: "La Doce Vita",
      images,
      previewHref: PREVIEW_HREF,
      previewLabel: "Ver Convite",
      selectImageLabel: (position: number) => `Imagem ${position}`,
      openImageLabel: "Ampliar imagem",
      previousImageLabel: "Anterior",
      nextImageLabel: "Seguinte",
      closeImageLabel: "Fechar",
      imageCounterLabel: (current: number, total: number) =>
        `${current} de ${total}`,
    }),
  );
}

function slideLinks(html: string): string[] {
  return html.match(/<a\b[^>]*href="\/sofia-augustos"[^>]*>/g) ?? [];
}

describe("ProductMediaGallery slides", () => {
  it("links every slide to the invitation", () => {
    const html = renderGallery(["/a.jpg", "/b.jpg", "/c.jpg"]);

    expect(slideLinks(html)).toHaveLength(3);
  });

  it("opens the invitation in the same tab", () => {
    const links = slideLinks(renderGallery(["/a.jpg", "/b.jpg"]));

    expect(links).toHaveLength(2);
    for (const link of links) expect(link).not.toContain("target=");
  });

  it("announces the slide as the invitation link before desktop is known", () => {
    const links = slideLinks(renderGallery(["/a.jpg"]));

    expect(links).toHaveLength(1);
    expect(links[0]).toContain('aria-label="Ver Convite"');
  });
});

describe("ProductMediaGallery mobile chip", () => {
  it("labels the image with a mobile-only Ver Convite chip", () => {
    const html = renderGallery(["/a.jpg", "/b.jpg"]);
    const chip = html.match(
      /<span\b[^>]*data-gallery-chip[^>]*>[\s\S]*?<\/span>/,
    )?.[0];

    expect(chip).toBeDefined();
    expect(chip).toContain("Ver Convite");
    expect(chip).toContain("lg:hidden");
    expect(chip).toContain("pointer-events-none");
  });
});
