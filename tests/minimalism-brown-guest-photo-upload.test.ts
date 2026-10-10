import {
  createElement,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import GuestPhotoUpload from "@/components/minimalism-brown/GuestPhotoUpload";
import { toInvitationData } from "@/lib/invitations";
import type {
  CustomTexts,
  GuestPhotoUpload as GuestPhotoUploadData,
  TemplateTheme,
} from "@/lib/types";
import {
  sourceInvitationRow,
  sourceTheme,
} from "./fixtures/invitation-duplication";
import en from "../messages/en.json";
import pt from "../messages/pt.json";

const theme = sourceTheme as unknown as TemplateTheme;

type TestIntlProviderProps = Omit<
  ComponentProps<typeof NextIntlClientProvider>,
  "children"
> & { children?: ReactNode };
const TestIntlProvider =
  NextIntlClientProvider as ComponentType<TestIntlProviderProps>;

function render(
  guestPhotoUpload: GuestPhotoUploadData | null,
  options: { customTexts?: CustomTexts; locale?: "pt" | "en" } = {},
): string {
  const locale = options.locale ?? "pt";
  return renderToStaticMarkup(
    createElement(
      TestIntlProvider,
      {
        locale,
        messages: locale === "en" ? en : pt,
        timeZone: "Europe/Lisbon",
      },
      createElement(GuestPhotoUpload, {
        invitation: toInvitationData({
          ...sourceInvitationRow,
          guestPhotoUpload,
          customTexts: options.customTexts ?? null,
        }),
        theme,
      }),
    ),
  );
}

describe("minimalism-brown GuestPhotoUpload", () => {
  const upload: GuestPhotoUploadData = {
    enabled: true,
    url: "photos.app.goo.gl/abc123",
    text: "Partilhem connosco as vossas fotos!",
  };

  it("shows the text above a button that opens the platform in a new tab", () => {
    const html = render(upload);

    const text = html.indexOf("Partilhem connosco as vossas fotos!");
    const link = html.indexOf('href="https://photos.app.goo.gl/abc123"');
    expect(text).toBeGreaterThan(-1);
    expect(link).toBeGreaterThan(text);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("labels the button with the default for the guest's language", () => {
    expect(render(upload)).toContain("Enviar fotos");
    expect(render(upload, { locale: "en" })).toContain("Send photos");
  });

  it("uses the host's own button label when one is set", () => {
    const html = render(upload, {
      customTexts: { mb_sendPhotos: "Partilhar memórias" },
    });

    expect(html).toContain("Partilhar memórias");
    expect(html).not.toContain("Enviar fotos");
  });

  it("shows the button alone when there is no text", () => {
    const html = render({ ...upload, text: "" });

    expect(html).not.toContain("<p");
    expect(html).toContain("Enviar fotos");
  });

  it("renders nothing when it is off, unset or has no usable link", () => {
    expect(render({ ...upload, enabled: false })).toBe("");
    expect(render(null)).toBe("");
    expect(render({ ...upload, url: "javascript:alert(1)" })).toBe("");
  });
});
