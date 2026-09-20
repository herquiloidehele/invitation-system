import { beforeEach, describe, expect, it, vi } from "vitest";

// React.cache only dedupes inside a server request context; make it a
// pass-through so the wrapped lookup can be exercised in node.
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, cache: (fn: unknown) => fn };
});

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock("@/lib/db", () => ({
  prisma: { invitation: { findUnique } },
}));

import {
  INVITATION_BLOCKED_MESSAGE,
  getInvitationBlock,
  getInvitationBlockState,
  invitationBlockSelect,
  invitationBlockedResponse,
  isInvitationBlocked,
} from "@/lib/invitation-block";

const BLOCKED_AT = new Date("2026-09-20T10:00:00Z");

beforeEach(() => findUnique.mockReset());

describe("isInvitationBlocked", () => {
  it("is false for missing rows and live rows", () => {
    expect(isInvitationBlocked(null)).toBe(false);
    expect(isInvitationBlocked(undefined)).toBe(false);
    expect(isInvitationBlocked({ blockedAt: null })).toBe(false);
  });

  it("is true once blockedAt is set", () => {
    expect(isInvitationBlocked({ blockedAt: BLOCKED_AT })).toBe(true);
  });
});

describe("getInvitationBlockState", () => {
  it("returns null for missing or live rows, even with a stale reason", () => {
    expect(getInvitationBlockState(null)).toBeNull();
    expect(
      getInvitationBlockState({ blockedAt: null, blockedReason: "ignored" }),
    ).toBeNull();
  });

  it("returns the trimmed reason when blocked", () => {
    expect(
      getInvitationBlockState({
        blockedAt: BLOCKED_AT,
        blockedReason: "  Pagamento em falta  ",
      }),
    ).toEqual({ reason: "Pagamento em falta" });
  });

  it("returns a null reason when the reason is blank or absent", () => {
    expect(
      getInvitationBlockState({ blockedAt: BLOCKED_AT, blockedReason: "   " }),
    ).toEqual({ reason: null });
    expect(getInvitationBlockState({ blockedAt: BLOCKED_AT })).toEqual({
      reason: null,
    });
  });
});

describe("getInvitationBlock", () => {
  it("selects only the block columns by slug and maps the state", async () => {
    findUnique.mockResolvedValue({
      blockedAt: BLOCKED_AT,
      blockedReason: "Motivo",
    });

    await expect(getInvitationBlock("ana-e-rui")).resolves.toEqual({
      reason: "Motivo",
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { slug: "ana-e-rui" },
      select: invitationBlockSelect,
    });
  });

  it("resolves null when the invitation is missing or live", async () => {
    findUnique.mockResolvedValueOnce(null);
    await expect(getInvitationBlock("missing")).resolves.toBeNull();

    findUnique.mockResolvedValueOnce({ blockedAt: null, blockedReason: null });
    await expect(getInvitationBlock("live")).resolves.toBeNull();
  });
});

describe("invitationBlockedResponse", () => {
  it("is a 403 carrying both the error and the message conventions", async () => {
    const res = invitationBlockedResponse();

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: "invitation_blocked",
      success: false,
      message: INVITATION_BLOCKED_MESSAGE,
    });
    expect(INVITATION_BLOCKED_MESSAGE).toBe("Este convite foi bloqueado.");
  });
});
