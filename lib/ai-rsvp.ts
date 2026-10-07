import {
  getRsvpCustomFields,
  shouldShowRsvpCompanion,
  shouldShowRsvpDietaryRestrictions,
  shouldShowRsvpEmail,
  shouldShowRsvpNumAdults,
  shouldShowRsvpNumChildren,
} from "./rsvp-config";
import {
  getVisibleRsvpCustomFields,
  toRsvpCustomAnswerInputs,
  validateRsvpCustomAnswers,
} from "./rsvp-custom-fields";
import type { InvitationData, RsvpCustomField } from "./types";
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
    // Generated bundles draw their own form and only know the five simple
    // types, so a list field must never reach them.
    custom: customFields.filter((field) => field.type !== "list"),
  };
}

// One bundle-facing descriptor per set of showing conditional fields, per
// source descriptor. A bundle may key an effect on `fields`, so it has to keep
// its identity while the guest types and only change when a field appears or
// disappears.
const bundleFieldsCache = new WeakMap<
  RsvpFieldsDescriptor,
  Map<string, RsvpFieldsDescriptor>
>();

/**
 * The descriptor a generated bundle should draw from right now. Bundles
 * predate conditional visibility: they are handed only the conditional fields
 * that currently apply, relabelled with a visibility they understand.
 * Validation and the payload must keep using the full descriptor.
 */
export function visibleRsvpFieldsForBundle(
  fields: RsvpFieldsDescriptor,
  values: RsvpValues,
): RsvpFieldsDescriptor {
  if (!fields.custom.some((field) => field.visibility === "conditional")) {
    return fields;
  }

  const visibleIds = new Set(
    getVisibleRsvpCustomFields(fields.custom, {
      attending: values.attending === true,
      values: values.custom,
    }).map((field) => field.id),
  );
  const shownFields = fields.custom.filter(
    (field) => field.visibility !== "conditional" || visibleIds.has(field.id),
  );

  const cacheKey = JSON.stringify(
    shownFields
      .filter((field) => field.visibility === "conditional")
      .map((field) => field.id),
  );
  let cache = bundleFieldsCache.get(fields);
  if (!cache) {
    cache = new Map();
    bundleFieldsCache.set(fields, cache);
  }
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const forBundle: RsvpFieldsDescriptor = {
    ...fields,
    custom: shownFields.map((field) => {
      if (field.visibility !== "conditional") return field;
      const shown: RsvpCustomField = { ...field, visibility: "always" };
      delete shown.showWhen;
      return shown;
    }),
  };
  cache.set(cacheKey, forBundle);
  return forBundle;
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
    submittedAnswers: toRsvpCustomAnswerInputs(fields.custom, values.custom),
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
    payload.customAnswers = toRsvpCustomAnswerInputs(
      fields.custom,
      values.custom,
    );
  }

  return payload;
}
