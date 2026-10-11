import {
  createElement,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import { RsvpInputColorFields } from "@/components/admin/RsvpInputColorFields";
import RsvpPageForm from "@/components/rsvp-page/RsvpPageForm";
import { RSVPCustomFields } from "@/components/shared/RSVPCustomFields";
import RSVPForm from "@/components/shared/RSVPForm";
import { toInvitationData } from "@/lib/invitations";
import { resolveRsvpPageStyle } from "@/lib/rsvp-page-style";
import type {
  InvitationData,
  RsvpCustomField,
  TemplateTheme,
} from "@/lib/types";
import messages from "@/messages/pt.json";
import {
  sourceInvitationRow,
  sourceTheme,
} from "./fixtures/invitation-duplication";

const theme = sourceTheme as unknown as TemplateTheme;

const switchField: RsvpCustomField = {
  id: "transfer",
  label: "Vai precisar do serviço de transfer?",
  type: "switch",
  required: false,
  visibility: "always",
};

type RsvpColors = Pick<
  InvitationData["rsvp"],
  "inputBackgroundColor" | "inputTextColor" | "inputSwitchLabelColor"
>;

/** A provider whose children go in as createElement arguments, not props. */
type Wrapper<P> = ComponentType<Omit<P, "children"> & { children?: ReactNode }>;
const IntlProvider = NextIntlClientProvider as Wrapper<
  ComponentProps<typeof NextIntlClientProvider>
>;

function switchLabel(color: string, text = "Não"): string {
  return `<span style="color:${color}">${text}</span>`;
}

function renderSwitch(
  overrides: Partial<ComponentProps<typeof RSVPCustomFields>> = {},
) {
  return renderToStaticMarkup(
    createElement(RSVPCustomFields, {
      fields: [switchField],
      attending: true,
      values: {},
      errors: {},
      onChange: () => {},
      labelStyle: {},
      inputClassName: "",
      inputStyle: {},
      choiceClassName: "",
      choiceStyle: () => ({}),
      switchClassName: "switch-box",
      // The box carries the field text colour, as the real forms pass it.
      switchStyle: { color: "#ffffff" },
      switchLabelColor: "#222222",
      ...overrides,
    }),
  );
}

/** The inline RSVP form of an invitation, as the invitation page draws it. */
function renderInvitationForm(colors: RsvpColors): string {
  const invitation = toInvitationData({
    ...sourceInvitationRow,
    rsvp: { enabled: true, customFields: [switchField], ...colors },
  });
  return renderToStaticMarkup(
    createElement(
      IntlProvider,
      { locale: "pt", messages, timeZone: "Europe/Lisbon" },
      createElement(RSVPForm, {
        inline: true,
        hideTitle: true,
        invitation,
        theme,
        customTexts: invitation.customTexts,
      }),
    ),
  );
}

/** The form of the standalone /confirmar page. */
function renderPageForm(colors: RsvpColors): string {
  return renderToStaticMarkup(
    createElement(RsvpPageForm, {
      tokens: resolveRsvpPageStyle({ config: null, theme: null, rsvp: colors }),
      resolveText: (key) => key,
      showEmail: false,
      showDietaryRestrictions: false,
      showCompanion: false,
      showNumAdults: false,
      showNumChildren: false,
      customFields: [switchField],
      submitting: false,
      onSubmit: () => {},
    }),
  );
}

describe("RSVP switch label colour", () => {
  it("paints the Sim/Não label with its own colour, not the box's", () => {
    expect(renderSwitch()).toContain(switchLabel("#222222"));
  });

  it("keeps the colour when the switch is on", () => {
    expect(renderSwitch({ values: { transfer: true } })).toContain(
      switchLabel("#222222", "Sim"),
    );
  });
});

describe("RSVP switch label colour on the invitation form", () => {
  it("uses the invitation's own switch label colour", () => {
    const html = renderInvitationForm({
      inputBackgroundColor: "#ffffff",
      inputSwitchLabelColor: "#222222",
    });
    expect(html).toContain(switchLabel("#222222"));
  });

  it("follows the field text colour when none is set", () => {
    const html = renderInvitationForm({ inputTextColor: "#f7f7f7" });
    expect(html).toContain(switchLabel("#f7f7f7"));
  });
});

describe("RSVP switch label colour on the standalone page", () => {
  it("uses the invitation's own switch label colour", () => {
    const html = renderPageForm({
      inputBackgroundColor: "#ffffff",
      inputSwitchLabelColor: "#222222",
    });
    expect(html).toContain(switchLabel("#222222"));
  });

  it("follows the field text colour when none is set", () => {
    const html = renderPageForm({ inputTextColor: "#f7f7f7" });
    expect(html).toContain(switchLabel("#f7f7f7"));
  });
});

describe("admin RSVP colour panel", () => {
  function renderPanel(colors: RsvpColors): string {
    return renderToStaticMarkup(
      createElement(RsvpInputColorFields, {
        rsvp: { enabled: true, ...colors },
        onChange: () => {},
      }),
    );
  }

  it("offers the switch label colour", () => {
    expect(renderPanel({})).toContain("Texto do campo Sim/Não");
  });

  it("shows the stored value with a way to clear it", () => {
    const html = renderPanel({ inputSwitchLabelColor: "#222222" });
    expect(html).toContain('value="#222222"');
    expect(html).toContain('aria-label="Limpar texto do campo sim/não"');
  });
});
