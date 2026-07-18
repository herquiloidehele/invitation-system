export type InvitationFormMode = "create" | "edit" | "duplicate";

export type InvitationFormError = {
  message: string;
  field?: "couple" | "slug";
};

export function isCreateLikeInvitationMode(mode: InvitationFormMode): boolean {
  return mode !== "edit";
}

export function invitationFormRequest(
  mode: InvitationFormMode,
  invitationId?: string,
  sourceInvitationId?: string,
) {
  if (mode === "duplicate") {
    if (!sourceInvitationId) {
      throw new Error("Duplicate mode requires sourceInvitationId");
    }
    return {
      url: `/api/admin/invitations/${sourceInvitationId}/duplicate`,
      method: "POST" as const,
    };
  }

  if (mode === "edit") {
    if (!invitationId) {
      throw new Error("Edit mode requires invitationId");
    }
    return {
      url: `/api/admin/invitations/${invitationId}`,
      method: "PUT" as const,
    };
  }

  return { url: "/api/admin/invitations", method: "POST" as const };
}

export function invitationFormCopy(
  mode: InvitationFormMode,
  external: boolean,
) {
  if (mode === "duplicate") {
    return {
      title: external ? "Duplicar convite externo" : "Duplicar convite",
      submitLabel: "Criar convite duplicado",
      successMessage: "Convite duplicado!",
    };
  }

  if (mode === "create") {
    return {
      title: external ? "Novo Convite Externo" : "Novo Convite",
      submitLabel: "Criar",
      successMessage: external ? "Convite externo criado!" : "Convite criado!",
    };
  }

  return {
    title: external ? "Editar Convite Externo" : "Editar Convite",
    submitLabel: "Guardar Alterações",
    successMessage: "Convite atualizado!",
  };
}

export function readInvitationFormError(
  payload: unknown,
  fallback: string,
): InvitationFormError {
  if (!payload || typeof payload !== "object") {
    return { message: fallback };
  }

  const record = payload as Record<string, unknown>;
  const message = typeof record.error === "string" ? record.error : fallback;
  const field =
    record.field === "couple" || record.field === "slug"
      ? record.field
      : undefined;

  return field ? { message, field } : { message };
}
