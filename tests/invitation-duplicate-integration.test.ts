import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("duplicate invitation wiring", () => {
  it("wires duplicate mode into the standard form", () => {
    const source = readFileSync(
      "app/admin/invitations/InvitationForm.tsx",
      "utf8",
    );

    expect(source).toContain("InvitationFormMode");
    expect(source).toContain("isCreateLikeInvitationMode(mode)");
    expect(source).toContain("invitationFormRequest(");
    expect(source).toContain("readInvitationFormError(");
    expect(source).toContain("<InvitationDuplicateNotice");
    expect(source).toContain("sourceInvitationId");
    expect(source).toContain("Cancelar");
  });

  it("wires duplicate mode into the external form", () => {
    const source = readFileSync(
      "app/admin/invitations/ExternalInvitationForm.tsx",
      "utf8",
    );

    expect(source).toContain("InvitationFormMode");
    expect(source).toContain("isCreateLikeInvitationMode(mode)");
    expect(source).toContain("invitationFormRequest(");
    expect(source).toContain("readInvitationFormError(");
    expect(source).toContain("<InvitationDuplicateNotice");
    expect(source).toContain("sourceInvitationId");
    expect(source).toContain("Cancelar");
  });

  it("loads a read-only draft page and selects the existing form family", () => {
    const source = readFileSync(
      "app/admin/invitations/[id]/duplicate/page.tsx",
      "utf8",
    );

    expect(source).toContain("buildDuplicateInvitationInitialData");
    expect(source).toContain('mode="duplicate"');
    expect(source).toContain("<InvitationForm");
    expect(source).toContain("<ExternalInvitationForm");
    expect(source).not.toContain("prisma.invitation.create");
    expect(source).not.toContain("prisma.theme.create");
  });

  it("keeps duplicate UI and API paths under existing admin protection", () => {
    const proxy = readFileSync("proxy.ts", "utf8");

    expect(proxy).toContain('pathname.startsWith("/admin")');
    expect(proxy).toContain('pathname.startsWith("/api/admin")');
  });

  it("exposes duplicate entry points in the list and both edit forms", () => {
    for (const path of [
      "app/admin/invitations/InvitationsClient.tsx",
      "app/admin/invitations/InvitationForm.tsx",
      "app/admin/invitations/ExternalInvitationForm.tsx",
    ]) {
      const source = readFileSync(path, "utf8");
      expect(source).toContain("getInvitationDuplicatePath");
      expect(source).toContain("Duplicar convite");
    }
  });
});
