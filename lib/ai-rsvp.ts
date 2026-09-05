import {
  getRsvpCustomFields,
  shouldShowRsvpCompanion,
  shouldShowRsvpDietaryRestrictions,
  shouldShowRsvpEmail,
  shouldShowRsvpNumAdults,
  shouldShowRsvpNumChildren,
} from "./rsvp-config";
import { validateRsvpCustomAnswers } from "./rsvp-custom-fields";
import type { InvitationData } from "./types";
import type {
  RsvpErrors,
  RsvpFieldsDescriptor,
  RsvpValues,
} from "./ai-rsvp-types";

type RsvpConfig = InvitationData["rsvp"];

/** Empty initial form values. */
export function emptyRsvpValues(): RsvpValues {
  return {
    name: "",
    email: "",
    attending: null,
    companion: "",
    dietaryRestrictions: "",
    numAdults: 1,
    numChildren: 0,
    message: "",
    custom: {},
  };
}

/** Derive which fields to render from the rsvp config. */
export function buildRsvpFields(
  rsvp: RsvpConfig,
  customFields = getRsvpCustomFields(rsvp),
): RsvpFieldsDescriptor {
  return {
    email: shouldShowRsvpEmail(rsvp),
    companion: shouldShowRsvpCompanion(rsvp),
    numAdults: shouldShowRsvpNumAdults(rsvp),
    numChildren: shouldShowRsvpNumChildren(rsvp),
    dietaryRestrictions: shouldShowRsvpDietaryRestrictions(rsvp),
    custom: customFields,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validate the standard fields + custom answers. Pure. */
export function validateRsvpValues(
  values: RsvpValues,
  fields: RsvpFieldsDescriptor,
): { ok: boolean; errors: RsvpErrors } {
  const errors: RsvpErrors = {};

  if (!values.name.trim()) errors.name = "Nome é obrigatório";
  if (values.attending === null) {
    errors.attending = "Confirmação de presença é obrigatória";
  }
  if (fields.email && values.email.trim() && !EMAIL_RE.test(values.email)) {
    errors.email = "Email inválido";
  }

  const customResult = validateRsvpCustomAnswers({
    fields: fields.custom,
    submittedAnswers: fields.custom.map((field) => ({
      fieldId: field.id,
      value:
        field.type === "switch"
          ? values.custom[field.id] === true
          : values.custom[field.id],
    })),
    attending: values.attending === true,
  });
  if (!customResult.success) {
    for (const err of customResult.errors) {
      errors[err.field.replace("customAnswers.", "custom.")] = err.message;
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

/** Shape the POST /api/rsvp body. Hidden fields and empty optionals are omitted. */
export function buildRsvpPayload(args: {
  slug: string;
  values: RsvpValues;
  fields: RsvpFieldsDescriptor;
  guestToken: string | undefined;
}): Record<string, unknown> {
  const { slug, values, fields, guestToken } = args;
  const attending = values.attending === true;

  const payload: Record<string, unknown> = {
    invitationSlug: slug,
    guestName: values.name,
    attending,
  };

  if (fields.email && values.email.trim()) payload.email = values.email;
  if (fields.companion && values.companion.trim()) {
    payload.companion = values.companion;
  }
  if (fields.dietaryRestrictions && values.dietaryRestrictions.trim()) {
    payload.dietaryRestrictions = values.dietaryRestrictions;
  }
  if (fields.numAdults) payload.numAdults = values.numAdults;
  if (fields.numChildren) payload.numChildren = values.numChildren;
  if (values.message.trim()) payload.message = values.message;
  if (guestToken) payload.guestToken = guestToken;

  if (fields.custom.length > 0) {
    payload.customAnswers = fields.custom.map((field) => ({
      fieldId: field.id,
      value:
        field.type === "switch"
          ? values.custom[field.id] === true
          : values.custom[field.id],
    }));
  }

  return payload;
}
