import { describe, expect, it } from "vitest";

import { getInvitationEditPath } from "@/lib/admin-row-navigation";

describe("getInvitationEditPath", () => {
  it("sends standard invitations to the classic edit form", () => {
    expect(getInvitationEditPath("abc")).toBe("/admin/invitations/abc/edit");
    expect(getInvitationEditPath("abc", "standard")).toBe(
      "/admin/invitations/abc/edit",
    );
  });

  it("sends AI invitations straight to the AI builder", () => {
    expect(getInvitationEditPath("abc", "ai")).toBe("/admin/invitations/abc/ai");
  });
});
