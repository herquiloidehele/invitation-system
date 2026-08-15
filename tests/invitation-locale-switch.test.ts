import { readFileSync } from "node:fs";
import { createElement, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import {
  InvitationLanguageSwitcher,
  InvitationLocaleChangeProvider,
} from "@/components/shared/InvitationLanguageSwitcher";
import { duplicateForm } from "./fixtures/invitation-duplication";
import type { InvitationData } from "@/lib/types";
import pt from "../messages/pt.json";

const invitation = duplicateForm({
  invitationType: "external_link",
  languageSwitcherEnabled: true,
  enabledLocales: ["pt", "en"],
});

type IntlProps = {
  locale: string;
  messages: typeof pt;
  timeZone: string;
  children?: ReactNode;
};
const Intl = NextIntlClientProvider as ComponentType<IntlProps>;

function render(node: ReactNode): string {
  return renderToStaticMarkup(
    createElement(
      Intl,
      { locale: "pt", messages: pt, timeZone: "Europe/Lisbon" },
      node,
    ),
  );
}

function switcher(data: InvitationData = invitation) {
  return createElement(InvitationLanguageSwitcher, { invitation: data });
}

describe("switcher render modes", () => {
  it("navigates with a plain anchor when no provider is present", () => {
    const html = render(switcher());
    expect(html).toContain("<a");
    expect(html).toContain("href=");
    expect(html).not.toContain("<button");
  });

  it("renders buttons in preview mode so the admin never navigates", () => {
    const html = render(
      createElement(
        InvitationLocaleChangeProvider,
        { mode: "preview" as const, onLocaleChange: () => {} },
        switcher(),
      ),
    );
    expect(html).toContain("<button");
    expect(html).not.toContain("<a ");
  });

  // The anchor must survive in inline mode: it keeps the alternate link
  // crawlable, supports open-in-new-tab, and still works without JavaScript.
  it("keeps a real anchor in inline mode", () => {
    const html = render(
      createElement(
        InvitationLocaleChangeProvider,
        { mode: "inline" as const, onLocaleChange: () => {} },
        switcher(),
      ),
    );
    expect(html).toContain("<a");
    expect(html).toContain("href=");
    expect(html).not.toContain("<button");
  });
});

describe("inline mode wiring", () => {
  const source = readFileSync(
    "components/shared/InvitationLanguageSwitcher.tsx",
    "utf8",
  );

  it("delegates the modifier-key decision to the tested helper", () => {
    expect(source).toContain("shouldInterceptLocaleClick");
  });

  it("only prevents default for intercepted clicks", () => {
    expect(source).toContain("event.preventDefault()");
  });
});

describe("controller wiring", () => {
  const controller = readFileSync(
    "app/[locale]/[slug]/InvitationLocaleController.tsx",
    "utf8",
  );
  const page = readFileSync("app/[locale]/[slug]/page.tsx", "utf8");

  it("re-derives the invitation with the pure localizer", () => {
    expect(controller).toContain("localizeInvitation");
    expect(controller).toContain("supportsInvitationTranslations");
  });

  it("swaps the message bundle without navigating", () => {
    expect(controller).toContain("NextIntlClientProvider");
    expect(controller).toContain("getClientMessages");
    expect(controller).toContain("history.replaceState");
    expect(controller).toContain("buildInvitationLocaleReplaceUrl");
    expect(controller).not.toContain("useRouter");
  });

  it("marks the document language for assistive tech", () => {
    expect(controller).toContain("documentElement.lang");
  });

  it("hands the page's raw record to the controller", () => {
    expect(page).toContain("<InvitationLocaleController");
    expect(page).toContain("sourceInvitation={{ ...sourceInvitation, guest }}");
    // The page still localizes for its own server-side consumers — the JSON-LD
    // emits location.name/address, both of which are translated.
    expect(page).toContain("localizeInvitation");
  });
});

describe("canva embed link swap", () => {
  const source = readFileSync(
    "components/curtain-canva/CanvaEmbed.tsx",
    "utf8",
  );

  // Derived, not synced: setting state from an effect trips
  // react-hooks/set-state-in-effect and can cascade renders.
  it("derives the swapping flag from the loaded document", () => {
    expect(source).toContain("loadedExternalLink !== externalLink");
    expect(source).not.toContain("setSwapping(");
  });

  it("records the loaded link from the iframe load event", () => {
    expect(source).toContain("setLoadedExternalLink(externalLink)");
  });

  // Resetting contentHeight would collapse the section to the aspect-ratio
  // placeholder and reproduce the scroll jump overflowAnchor:none exists to
  // prevent. The stale height is the floor we want.
  it("does not reset the measured height on a link swap", () => {
    const start = source.indexOf("const swapping =");
    expect(start).toBeGreaterThan(-1);
    expect(source.slice(start, start + 320)).not.toContain(
      "setContentHeight(null)",
    );
  });
});
