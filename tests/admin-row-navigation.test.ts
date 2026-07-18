import { describe, expect, it } from "vitest";
import { getInvitationDuplicatePath } from "@/lib/admin-row-navigation";

describe("invitation admin navigation", () => {
  it("builds the duplicate draft path", () => {
    expect(getInvitationDuplicatePath("inv_123")).toBe(
      "/admin/invitations/inv_123/duplicate",
    );
  });
});
