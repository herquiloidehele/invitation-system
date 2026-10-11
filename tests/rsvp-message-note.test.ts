import {
  createElement,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import { InlineTextEditProvider } from "@/components/shared/EditableText";
import RSVPForm from "@/components/shared/RSVPForm";
import { toInvitationData } from "@/lib/invitations";
import type { TemplateTheme, TextStyleOverrides } from "@/lib/types";
import messages from "@/messages/pt.json";
import {
  sourceInvitationRow,
  sourceTheme,
} from "./fixtures/invitation-duplication";

const theme = sourceTheme as unknown as TemplateTheme;
const NOTE = "A tua mensagem poderá ser mostrada no livro de honra do convite.";

/** A provider whose children go in as createElement arguments, not props. */
type Wrapper<P> = ComponentType<Omit<P, "children"> & { children?: ReactNode }>;
const IntlProvider = NextIntlClientProvider as Wrapper<
  ComponentProps<typeof NextIntlClientProvider>
>;
const EditorProvider = InlineTextEditProvider as Wrapper<
  ComponentProps<typeof InlineTextEditProvider>
>;

/** The inline RSVP form of an invitation whose guestbook is on, which is when
 *  the note under the message box appears. */
function renderForm(
  textStyles: TextStyleOverrides | null,
  { editor = false, guestbook = true } = {},
): string {
  const invitation = toInvitationData({
    ...sourceInvitationRow,
    guestbook: { enabled: guestbook },
    textStyles,
  });
  const form = createElement(RSVPForm, {
    inline: true,
    hideTitle: true,
    invitation,
    theme,
    customTexts: invitation.customTexts,
  });
  return renderToStaticMarkup(
    createElement(
      IntlProvider,
      { locale: "pt", messages, timeZone: "Europe/Lisbon" },
      editor
        ? createElement(
            EditorProvider,
            {
              updateTextStyleElement: () => undefined,
              textStyles: invitation.textStyles,
            },
            form,
          )
        : form,
    ),
  );
}

describe("RSVP form note about the message being public", () => {
  it("shows the note only when the guestbook is on", () => {
    expect(renderForm(null)).toContain(NOTE);
    expect(renderForm(null, { guestbook: false })).not.toContain(NOTE);
  });

  it("is styled from its own key", () => {
    const html = renderForm({
      elements: { rsvpMessageNote: { fontSize: 96, color: "#123456" } },
    });

    expect(html).toMatch(
      new RegExp(
        `<p[^>]*style="[^"]*color:#123456[^"]*font-size:96px[^"]*"[^>]*>${NOTE}</p>`,
      ),
    );
    expect(html.split("font-size:96px").length - 1).toBe(1);
  });

  it("is left alone by the field labels' style", () => {
    const html = renderForm({
      elements: { rsvpFieldLabel: { fontSize: 97 } },
    });

    expect(html).not.toMatch(
      new RegExp(`<p[^>]*font-size:97px[^>]*>${NOTE}</p>`),
    );
  });

  it("is selectable in the editor", () => {
    expect(renderForm(null, { editor: true })).toMatch(
      new RegExp(`data-text-element="rsvpMessageNote"[^>]*>${NOTE}<`),
    );
  });
});
