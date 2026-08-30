import type { RsvpCustomField } from "./types";

/** Which fields a generated bundle should render, derived from invitation.rsvp. */
export interface RsvpFieldsDescriptor {
  email: boolean;
  companion: boolean;
  numAdults: boolean;
  numChildren: boolean;
  dietaryRestrictions: boolean;
  custom: RsvpCustomField[];
}

/** The editable RSVP form values. `attending` is null until chosen. */
export interface RsvpValues {
  name: string;
  email: string;
  attending: boolean | null;
  companion: string;
  dietaryRestrictions: string;
  numAdults: number;
  numChildren: number;
  message: string;
  custom: Record<string, unknown>;
}

/** Field-keyed validation errors (standard keys + `custom.<id>`). */
export type RsvpErrors = Record<string, string>;

export interface RsvpSubmitResult {
  ok: boolean;
  checkInToken: string | null;
}

/** What `useRsvp()` returns to a generated bundle. */
export interface RsvpApi {
  fields: RsvpFieldsDescriptor;
  values: RsvpValues;
  setValue: <K extends keyof RsvpValues>(key: K, value: RsvpValues[K]) => void;
  setCustom: (fieldId: string, value: unknown) => void;
  errors: RsvpErrors;
  status:
    | "idle"
    | "submitting"
    | "success"
    | "error"
    | "closed"
    | "already_submitted";
  submit: () => Promise<RsvpSubmitResult>;
}
