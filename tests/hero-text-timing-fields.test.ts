import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import HeroTextTimingFields from "@/components/admin/HeroTextTimingFields";
import { DEFAULT_HERO_TEXT_BLOCK } from "@/lib/hero-text";
import type { HeroTextBlock } from "@/lib/types";

function block(timing: Partial<HeroTextBlock> = {}): HeroTextBlock {
  return { ...DEFAULT_HERO_TEXT_BLOCK, id: "block", ...timing };
}

describe("HeroTextTimingFields", () => {
  it("renders separate minute and second controls for start and end", () => {
    const html = renderToStaticMarkup(
      createElement(HeroTextTimingFields, {
        block: block({ startSeconds: 65, endSeconds: 90 }),
        onChange: () => {},
      }),
    );

    expect(html).toContain("Aparecer");
    expect(html).toContain("Desaparecer (opcional)");
    expect(html).toContain('aria-label="Minutos para aparecer"');
    expect(html).toContain('aria-label="Segundos para aparecer"');
    expect(html).toContain('aria-label="Minutos para desaparecer"');
    expect(html).toContain('aria-label="Segundos para desaparecer"');
    expect(html).toMatch(
      /<input[^>]*aria-label="Minutos para aparecer"[^>]*min="0"[^>]*value="1"/,
    );
    expect(html).toMatch(
      /<input[^>]*aria-label="Segundos para aparecer"[^>]*min="0"[^>]*max="59"[^>]*value="5"/,
    );
    expect(html).toMatch(
      /<input[^>]*aria-label="Segundos para desaparecer"[^>]*min="0"[^>]*max="59"[^>]*value="30"/,
    );
  });

  it("renders blank controls for an untimed block", () => {
    const html = renderToStaticMarkup(
      createElement(HeroTextTimingFields, {
        block: block(),
        onChange: () => {},
      }),
    );

    expect(html).toMatch(
      /<input[^>]*aria-label="Minutos para aparecer"[^>]*min="0"[^>]*value=""/,
    );
    expect(html).toMatch(
      /<input[^>]*aria-label="Segundos para desaparecer"[^>]*min="0"[^>]*max="59"[^>]*value=""/,
    );
  });
});
