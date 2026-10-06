import { describe, expect, it } from "vitest";

import {
  buildAdminInviteMessage,
  buildIntakePath,
  buildIntakeUrl,
  buildSelfStartPath,
  buildWhatsappShareUrl,
  intakeRef,
} from "@/lib/intake/links";
import {
  generateIntakeToken,
  hashIp,
  isIntakeTokenShape,
} from "@/lib/intake/tokens";
import { createRateLimiter } from "@/lib/intake/rate-limit";

describe("intake links", () => {
  it("builds localized personal and self-start paths", () => {
    expect(buildIntakePath("tok", "pt")).toBe("/personalizar/tok");
    expect(buildIntakePath("tok", "en")).toBe("/en/personalizar/tok");
    expect(buildSelfStartPath("convite", "aurora demo", "pt")).toBe(
      "/personalizar/novo/convite/aurora%20demo",
    );
    expect(buildSelfStartPath("save-the-date", "std", "es")).toBe(
      "/es/personalizar/novo/save-the-date/std",
    );
    expect(buildIntakeUrl("https://x.test/", "tok", "pt")).toBe(
      "https://x.test/personalizar/tok",
    );
  });

  it("derives a short reference from the intake id", () => {
    expect(intakeRef("cmabc123xyz9k2")).toBe("XYZ9K2");
  });

  it("builds WhatsApp links and the admin invite message", () => {
    expect(buildWhatsappShareUrl("Olá & bem-vinda")).toBe(
      "https://wa.me/?text=Ol%C3%A1%20%26%20bem-vinda",
    );
    expect(
      buildAdminInviteMessage({
        name: "Ana",
        demoName: "Aurora",
        url: "https://x.test/personalizar/tok",
      }),
    ).toBe(
      "Olá Ana! Para criarmos o seu convite com o modelo Aurora, preencha por favor este formulário: https://x.test/personalizar/tok",
    );
    expect(
      buildAdminInviteMessage({ name: "", demoName: "Aurora", url: "u" }),
    ).toMatch(/^Olá! Para criarmos/);
  });
});

describe("intake tokens", () => {
  it("generates unguessable base64url tokens with a checkable shape", () => {
    const a = generateIntakeToken();
    const b = generateIntakeToken();
    expect(a).not.toBe(b);
    expect(isIntakeTokenShape(a)).toBe(true);
    expect(isIntakeTokenShape("short")).toBe(false);
    expect(isIntakeTokenShape(`${a.slice(0, -1)}/`)).toBe(false);
  });

  it("hashes IPs deterministically without exposing them", () => {
    expect(hashIp("1.2.3.4", "s")).toBe(hashIp("1.2.3.4", "s"));
    expect(hashIp("1.2.3.4", "s")).not.toContain("1.2.3.4");
    expect(hashIp("1.2.3.4", "s")).not.toBe(hashIp("1.2.3.4", "t"));
    expect(hashIp(null, "s")).toBeNull();
  });
});

describe("intake rate limiter", () => {
  it("allows up to the limit inside the window, then blocks", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.check("ip", 0)).toBe(true);
    expect(limiter.check("ip", 10)).toBe(true);
    expect(limiter.check("ip", 20)).toBe(false);
    expect(limiter.check("other", 20)).toBe(true);
  });

  it("frees capacity as old hits leave the window", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.check("ip", 0)).toBe(true);
    expect(limiter.check("ip", 999)).toBe(false);
    expect(limiter.check("ip", 1001)).toBe(true);
  });

  it("forgets idle keys so memory stays bounded", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 100, maxKeys: 2 });
    limiter.check("a", 0);
    limiter.check("b", 0);
    limiter.check("c", 500);
    expect(limiter.size()).toBeLessThanOrEqual(2);
  });
});
