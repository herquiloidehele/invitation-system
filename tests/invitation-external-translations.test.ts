import { createElement, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import { InvitationLanguageSwitcher } from "@/components/shared/InvitationLanguageSwitcher";
import type { InvitationData } from "@/lib/types";
import pt from "../messages/pt.json";

import { duplicateForm } from "./fixtures/invitation-duplication";
import {
  applyInvitationTranslationDraft,
  buildInvitationTranslationDraft,
  localizeInvitation,
  shouldShowInvitationLanguageSwitcher,
  supportsInvitationTranslations,
} from "@/lib/invitation-translations";

const base = duplicateForm({
  invitationType: "external_link",
  languageSwitcherEnabled: true,
  enabledLocales: ["pt", "en"],
  externalLink: "https://example.my.canva.site/pt",
  countdown: {
    enabled: true,
    layout: "cards",
    title: "Contagem",
    subtitle: "Até ao grande dia",
    daysLabel: "dias",
    hoursLabel: "horas",
    minutesLabel: "min",
    secondsLabel: "seg",
    cardBg: "#ffffff",
    backgroundScrimOpacity: 0.4,
  },
});

describe("countdown translations", () => {
  it("writes only the six countdown strings into the locale overlay", () => {
    const draft = buildInvitationTranslationDraft(base, "en");
    const next = applyInvitationTranslationDraft(base, "en", {
      ...draft,
      countdown: {
        ...draft.countdown!,
        title: "Countdown",
        subtitle: "Until the big day",
        daysLabel: "days",
        hoursLabel: "hours",
        minutesLabel: "min",
        secondsLabel: "sec",
      },
    });

    expect(next.translations?.en?.countdown).toEqual({
      title: "Countdown",
      subtitle: "Until the big day",
      daysLabel: "days",
      hoursLabel: "hours",
      minutesLabel: "min",
      secondsLabel: "sec",
    });
    // Portuguese stays canonical.
    expect(next.countdown?.title).toBe("Contagem");
  });

  it("localizes the strings while preserving every non-text setting", () => {
    const withOverlay = {
      ...base,
      translations: {
        en: { countdown: { title: "Countdown", daysLabel: "days" } },
      },
    };

    const en = localizeInvitation(withOverlay, "en");

    expect(en.countdown?.title).toBe("Countdown");
    expect(en.countdown?.daysLabel).toBe("days");
    // Untranslated strings fall back to Portuguese.
    expect(en.countdown?.subtitle).toBe("Até ao grande dia");
    // Non-text configuration is never overlaid.
    expect(en.countdown?.enabled).toBe(true);
    expect(en.countdown?.layout).toBe("cards");
    expect(en.countdown?.cardBg).toBe("#ffffff");
    expect(en.countdown?.backgroundScrimOpacity).toBe(0.4);
  });

  it("drops non-string countdown values from a stored overlay", () => {
    const dirty = {
      ...base,
      translations: {
        en: { countdown: { title: "Countdown", enabled: false, cardBg: 12 } },
      },
    } as unknown as typeof base;

    const en = localizeInvitation(dirty, "en");

    expect(en.countdown?.title).toBe("Countdown");
    expect(en.countdown?.enabled).toBe(true);
    expect(en.countdown?.cardBg).toBe("#ffffff");
  });

  it("leaves an invitation without a countdown untouched", () => {
    const noCountdown = { ...base, countdown: undefined };
    expect(localizeInvitation(noCountdown, "en").countdown).toBeUndefined();
  });
});

describe("per-locale external link", () => {
  it("uses the locale link when one is set", () => {
    const withOverlay = {
      ...base,
      translations: {
        en: { externalLink: "https://example.my.canva.site/en" },
      },
    };
    expect(localizeInvitation(withOverlay, "en").externalLink).toBe(
      "https://example.my.canva.site/en",
    );
  });

  it("falls back to the Portuguese link when the locale has none", () => {
    expect(localizeInvitation(base, "en").externalLink).toBe(
      "https://example.my.canva.site/pt",
    );
  });

  it("treats an empty locale link as inherit-Portuguese", () => {
    const withOverlay = {
      ...base,
      translations: { en: { externalLink: "" } },
    };
    expect(localizeInvitation(withOverlay, "en").externalLink).toBe(
      "https://example.my.canva.site/pt",
    );
  });

  it("blanks the link in the admin draft so the input shows inherit", () => {
    expect(buildInvitationTranslationDraft(base, "en").externalLink).toBe("");
  });

  it("round-trips an edited link without touching the Portuguese record", () => {
    const draft = buildInvitationTranslationDraft(base, "en");
    const next = applyInvitationTranslationDraft(base, "en", {
      ...draft,
      externalLink: "https://example.my.canva.site/en",
    });

    expect(next.translations?.en?.externalLink).toBe(
      "https://example.my.canva.site/en",
    );
    expect(next.externalLink).toBe("https://example.my.canva.site/pt");
  });

  it("clears the overlay link when the admin empties the field", () => {
    const withOverlay = {
      ...base,
      translations: {
        en: { externalLink: "https://example.my.canva.site/en" },
      },
    };
    const draft = buildInvitationTranslationDraft(withOverlay, "en");
    const next = applyInvitationTranslationDraft(withOverlay, "en", {
      ...draft,
      externalLink: "",
    });

    expect(next.translations?.en?.externalLink).toBeUndefined();
    expect(localizeInvitation(next, "en").externalLink).toBe(
      "https://example.my.canva.site/pt",
    );
  });

  it("ignores a non-string link in a stored overlay", () => {
    const dirty = {
      ...base,
      translations: { en: { externalLink: 42 } },
    } as unknown as typeof base;
    expect(localizeInvitation(dirty, "en").externalLink).toBe(
      "https://example.my.canva.site/pt",
    );
  });
});

describe("supportsInvitationTranslations", () => {
  it("accepts standard invitations", () => {
    expect(supportsInvitationTranslations({ invitationType: "standard" })).toBe(
      true,
    );
  });

  it("accepts external_link invitations", () => {
    expect(
      supportsInvitationTranslations({ invitationType: "external_link" }),
    ).toBe(true);
  });

  it("rejects external_video invitations", () => {
    expect(
      supportsInvitationTranslations({ invitationType: "external_video" }),
    ).toBe(false);
  });

  it("treats a missing type as standard", () => {
    expect(supportsInvitationTranslations({ invitationType: undefined })).toBe(
      true,
    );
  });
});

describe("language switcher visibility", () => {
  it("shows on an external_link invitation with two locales", () => {
    expect(shouldShowInvitationLanguageSwitcher(base)).toBe(true);
  });

  it("hides when the switcher is disabled", () => {
    expect(
      shouldShowInvitationLanguageSwitcher({
        ...base,
        languageSwitcherEnabled: false,
      }),
    ).toBe(false);
  });

  it("hides on an external_video invitation", () => {
    expect(
      shouldShowInvitationLanguageSwitcher({
        ...base,
        invitationType: "external_video",
      }),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SSR rendering: the switcher must actually reach the DOM on external pages.
// Vitest runs in node, so this uses renderToStaticMarkup (see
// tests/hero-video-audio.test.ts for the same pattern).
// ---------------------------------------------------------------------------

describe("switcher rendering on external invitations", () => {
  function render(invitation: InvitationData): string {
    return renderToStaticMarkup(
      createElement(
        NextIntlClientProvider as ComponentType<{
          locale: string;
          messages: typeof pt;
          timeZone: string;
          children?: ReactNode;
        }>,
        { locale: "pt", messages: pt, timeZone: "Europe/Lisbon" },
        createElement(InvitationLanguageSwitcher, { invitation }),
      ),
    );
  }

  it("renders one link per effective locale for external_link", () => {
    const html = render(base);
    expect(html).toContain('aria-label="Language"');
    expect(html).toContain('aria-label="Português"');
    expect(html).toContain('aria-label="English"');
    expect(html).not.toContain('aria-label="Español"');
  });

  it("renders nothing for external_video", () => {
    expect(render({ ...base, invitationType: "external_video" })).toBe("");
  });

  it("renders nothing when the switcher is disabled", () => {
    expect(render({ ...base, languageSwitcherEnabled: false })).toBe("");
  });
});
