import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import TransportInfo from "@/components/minimalism-brown/TransportInfo";
import { toInvitationData } from "@/lib/invitations";
import type { TemplateTheme, TransportInfo as TransportInfoData } from "@/lib/types";
import {
  sourceInvitationRow,
  sourceTheme,
} from "./fixtures/invitation-duplication";

const theme = sourceTheme as unknown as TemplateTheme;

function render(transportInfo: TransportInfoData | null): string {
  return renderToStaticMarkup(
    createElement(TransportInfo, {
      invitation: toInvitationData({ ...sourceInvitationRow, transportInfo }),
      theme,
    }),
  );
}

describe("minimalism-brown TransportInfo", () => {
  const info: TransportInfoData = {
    enabled: true,
    imageUrl: "https://cdn.example.com/bus.png",
    imageSize: "small",
    title: "Transporte",
    description: "Autocarro às 14h\nRegresso às 02h",
  };

  it("puts the image on top, then the title, then the description", () => {
    const html = render(info);

    const image = html.indexOf("https://cdn.example.com/bus.png");
    const title = html.indexOf("Transporte");
    const description = html.indexOf("Autocarro às 14h");
    expect(image).toBeGreaterThan(-1);
    expect(title).toBeGreaterThan(image);
    expect(description).toBeGreaterThan(title);
  });

  it("sizes the image from the admin's choice", () => {
    expect(render(info)).toContain("width:40%");
    expect(render({ ...info, imageSize: "full" })).toContain("width:100%");
  });

  it("keeps the description's line breaks", () => {
    expect(render(info)).toContain("white-space:pre-line");
  });

  it("renders without an image when none was uploaded", () => {
    const html = render({ ...info, imageUrl: undefined });

    expect(html).not.toContain("<img");
    expect(html).toContain("Transporte");
  });

  it("renders nothing when the section is off or unset", () => {
    expect(render({ ...info, enabled: false })).toBe("");
    expect(render(null)).toBe("");
  });
});
