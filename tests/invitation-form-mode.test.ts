import { describe, expect, it } from "vitest";
import {
  invitationFormCopy,
  invitationFormRequest,
  isCreateLikeInvitationMode,
  readInvitationFormError,
} from "@/lib/invitation-form-mode";

describe("invitation form modes", () => {
  it("routes all three modes correctly", () => {
    expect(invitationFormRequest("create")).toEqual({
      url: "/api/admin/invitations",
      method: "POST",
    });
    expect(invitationFormRequest("edit", "inv_1")).toEqual({
      url: "/api/admin/invitations/inv_1",
      method: "PUT",
    });
    expect(invitationFormRequest("duplicate", undefined, "source_1")).toEqual({
      url: "/api/admin/invitations/source_1/duplicate",
      method: "POST",
    });
  });

  it("treats create and duplicate as create-like for derived identity fields", () => {
    expect(isCreateLikeInvitationMode("create")).toBe(true);
    expect(isCreateLikeInvitationMode("duplicate")).toBe(true);
    expect(isCreateLikeInvitationMode("edit")).toBe(false);
  });

  it("supplies standard and external duplicate copy", () => {
    expect(invitationFormCopy("duplicate", false)).toEqual({
      title: "Duplicar convite",
      submitLabel: "Criar convite duplicado",
      successMessage: "Convite duplicado!",
    });
    expect(invitationFormCopy("duplicate", true).title).toBe(
      "Duplicar convite externo",
    );
  });

  it("reads field-specific API errors without trusting malformed payloads", () => {
    expect(
      readInvitationFormError(
        { error: "Change the customer", field: "couple" },
        "Fallback",
      ),
    ).toEqual({ message: "Change the customer", field: "couple" });
    expect(readInvitationFormError(null, "Fallback")).toEqual({
      message: "Fallback",
    });
  });
});
