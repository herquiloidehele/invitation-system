import { describe, expect, it } from "vitest";
import { duplicateForm } from "./fixtures/invitation-duplication";
import {
  buildInvitationLocaleSwitchHref,
  getInvitationLocaleRedirectPath,
} from "@/lib/invitation-language-routing";

const invitation = duplicateForm({
  invitationType: "standard",
  languageSwitcherEnabled: true,
  enabledLocales: ["pt", "en"],
});

describe("invitation locale routing", () => {
  it("preserves query parameters and opens at the hero", () => {
    expect(
      buildInvitationLocaleSwitchHref(
        "/ana-joao",
        { g: "guest token", campaign: "summer" },
        "en",
      ),
    ).toBe("/en/ana-joao?g=guest+token&campaign=summer&section=hero");
  });

  it("redirects a disabled locale to Portuguese with every query value", () => {
    expect(
      getInvitationLocaleRedirectPath(invitation, "es", "/es/ana-joao", {
        g: "abc",
        tag: ["one", "two"],
      }),
    ).toBe("/ana-joao?g=abc&tag=one&tag=two");
  });

  it("does not redirect an effective locale", () => {
    expect(
      getInvitationLocaleRedirectPath(invitation, "en", "/en/ana-joao", {
        g: "abc",
      }),
    ).toBeNull();
  });

});

const externalLink = duplicateForm({
  invitationType: "external_link",
  languageSwitcherEnabled: true,
  enabledLocales: ["pt", "en"],
});

const externalVideo = duplicateForm({
  invitationType: "external_video",
  languageSwitcherEnabled: true,
  enabledLocales: ["pt", "en"],
});

describe("external invitation locale routing", () => {
  it("redirects a disabled locale on an external_link invitation", () => {
    expect(
      getInvitationLocaleRedirectPath(externalLink, "es", "/es/ana-joao", {}),
    ).toBe("/ana-joao");
  });

  it("renders an enabled locale on an external_link invitation", () => {
    expect(
      getInvitationLocaleRedirectPath(externalLink, "en", "/en/ana-joao", {}),
    ).toBeNull();
  });

  it("redirects an external_link invitation that never enabled the switcher", () => {
    expect(
      getInvitationLocaleRedirectPath(
        duplicateForm({
          invitationType: "external_link",
          languageSwitcherEnabled: false,
        }),
        "en",
        "/en/ana-joao",
        {},
      ),
    ).toBe("/ana-joao");
  });

  it("leaves external_video invitations unrouted", () => {
    expect(
      getInvitationLocaleRedirectPath(externalVideo, "es", "/es/ana-joao", {}),
    ).toBeNull();
  });
});
