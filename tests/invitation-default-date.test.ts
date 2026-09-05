import { describe, expect, it } from "vitest";

import { defaultInvitationDate } from "@/lib/invitation-default-date";

describe("defaultInvitationDate", () => {
  it("defaults to 30 days from today at UTC midnight", () => {
    const d = defaultInvitationDate();
    expect(d.iso).toMatch(/T00:00:00\.000Z$/);
    const days = Math.round(
      (new Date(d.iso).getTime() - Date.now()) / 86_400_000,
    );
    expect(days).toBeGreaterThanOrEqual(29);
    expect(days).toBeLessThanOrEqual(31);
  });

  it("honours a custom horizon", () => {
    const d = defaultInvitationDate(60);
    const days = Math.round(
      (new Date(d.iso).getTime() - Date.now()) / 86_400_000,
    );
    expect(days).toBeGreaterThanOrEqual(59);
    expect(days).toBeLessThanOrEqual(61);
  });

  it("pre-formats the PT display fields consistently with the ISO date", () => {
    const d = defaultInvitationDate();
    const u = new Date(d.iso);
    const months = [
      "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
      "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
    ];
    expect(d.year).toBe(String(u.getUTCFullYear()));
    expect(d.month).toBe(months[u.getUTCMonth()]);
    expect(d.day).toBe(String(u.getUTCDate()).padStart(2, "0"));
    expect(d.display).toBe(
      `${u.getUTCDate()} de ${months[u.getUTCMonth()]} de ${u.getUTCFullYear()}`,
    );
    expect(d.time).toBe("");
  });
});
