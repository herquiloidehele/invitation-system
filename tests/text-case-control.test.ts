import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TextCaseControl } from "@/components/admin/TextStyleToolbar";

describe("TextCaseControl", () => {
  it("renders normal, uppercase, and lowercase actions with accessible labels", () => {
    const html = renderToStaticMarkup(
      createElement(TextCaseControl, {
        value: undefined,
        onChange: () => undefined,
      }),
    );

    expect(html).toContain('aria-label="Capitalização normal"');
    expect(html).toContain('aria-label="Converter para maiúsculas"');
    expect(html).toContain('aria-label="Converter para minúsculas"');
    expect(html.match(/<button/g)).toHaveLength(3);
  });

  it("marks only the explicit transform as active", () => {
    const html = renderToStaticMarkup(
      createElement(TextCaseControl, {
        value: "uppercase",
        onChange: () => undefined,
      }),
    );

    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html).toMatch(
      /aria-label="Converter para maiúsculas"[^>]*aria-pressed="true"/,
    );
  });
});
