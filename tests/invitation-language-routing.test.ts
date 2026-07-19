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

  it("does not change existing external invitation locale behavior", () => {
    expect(
      getInvitationLocaleRedirectPath(
        { ...invitation, invitationType: "external_link" },
        "es",
        "/es/ana-joao",
        { g: "abc" },
      ),
    ).toBeNull();
  });
});
