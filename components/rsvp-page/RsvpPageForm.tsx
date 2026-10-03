"use client";

import { useState, type CSSProperties } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import type {
  CustomTexts,
  RsvpCustomAnswerInput,
  RsvpCustomField,
} from "@/lib/types";
import {
  resolveRsvpInputStyle,
  resolveRsvpSubmitStyle,
} from "@/lib/rsvp-input-styles";
import type { RsvpPageTokens } from "@/lib/rsvp-page-style";
import { validateRsvpCustomAnswers } from "@/lib/rsvp-custom-fields";
import {
  RSVPCustomFields,
  type RsvpCustomErrors,
  type RsvpCustomValues,
} from "@/components/shared/RSVPCustomFields";

type ResolveText = (
  key: keyof CustomTexts,
  values?: Record<string, string>,
) => string;

function createRsvpSchema(t: ResolveText) {
  return z.object({
    name: z.string().min(1, t("rsvp_nameRequired")),
    email: z.string().email(t("rsvp_invalidEmail")).or(z.literal("")),
    attending: z.enum(["yes", "no"], { error: t("rsvp_selectOption") }),
    dietaryRestrictions: z.string(),
    companion: z.string(),
    numAdults: z.coerce.number().int().min(1),
    numChildren: z.coerce.number().int().min(0),
    message: z.string(),
  });
}

export type RsvpPageFormData = z.output<ReturnType<typeof createRsvpSchema>>;

export interface RsvpPageFormSubmission {
  data: RsvpPageFormData;
  customAnswers: RsvpCustomAnswerInput[];
}

interface RsvpPageFormProps {
  tokens: RsvpPageTokens;
  resolveText: ResolveText;
  deadline?: string;
  prefillName?: string;
  showEmail: boolean;
  showDietaryRestrictions: boolean;
  showCompanion: boolean;
  showNumAdults: boolean;
  showNumChildren: boolean;
  customFields: RsvpCustomField[];
  submitting: boolean;
  onSubmit: (submission: RsvpPageFormSubmission) => void | Promise<void>;
}

export default function RsvpPageForm({
  tokens,
  resolveText,
  deadline,
  prefillName,
  showEmail,
  showDietaryRestrictions,
  showCompanion,
  showNumAdults,
  showNumChildren,
  customFields,
  submitting,
  onSubmit,
}: RsvpPageFormProps) {
  const [customValues, setCustomValues] = useState<RsvpCustomValues>({});
  const [customErrors, setCustomErrors] = useState<RsvpCustomErrors>({});
  const rsvpSchema = createRsvpSchema(resolveText);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RsvpPageFormData>({
    resolver: zodResolver(rsvpSchema) as unknown as Resolver<RsvpPageFormData>,
    defaultValues: {
      name: prefillName ?? "",
      email: "",
      attending: undefined,
      dietaryRestrictions: "",
      companion: "",
      numAdults: 1,
      numChildren: 0,
      message: "",
    },
  });
  const attending = watch("attending");
  const { colors, fonts } = tokens;

  const submit = async (data: RsvpPageFormData) => {
    const customValidation = validateRsvpCustomAnswers({
      fields: customFields,
      submittedAnswers: customFields.map((field) => ({
        fieldId: field.id,
        value:
          field.type === "switch"
            ? customValues[field.id] === true
            : customValues[field.id],
      })),
      attending: data.attending === "yes",
    });
    if (!customValidation.success) {
      setCustomErrors(
        Object.fromEntries(
          customValidation.errors.map((error) => [
            error.field.replace("customAnswers.", ""),
            error.message,
          ]),
        ),
      );
      return;
    }
    setCustomErrors({});
    await onSubmit({
      data,
      customAnswers: customValidation.answers.map((answer) => ({
        fieldId: answer.fieldId,
        value: answer.value,
      })),
    });
  };

  // Field look: shared field style + colours, with an optional radius preset.
  const rsvpInputStyle = resolveRsvpInputStyle(
    tokens.fieldStyle,
    {
      backgroundColor: colors.fieldBg,
      textColor: colors.fieldText,
      placeholderColor: colors.fieldPlaceholder,
      borderColor: colors.fieldBorder,
    },
    colors.accent,
    tokens.hasCustomFieldBackground,
    "page",
  );
  const fieldRadius =
    tokens.radius.field !== undefined && tokens.fieldStyle !== "minimal"
      ? { borderRadius: tokens.radius.field }
      : undefined;
  const inputBase = rsvpInputStyle.inputClassName;
  const inputStyle: CSSProperties = {
    fontFamily: fonts.body,
    ...rsvpInputStyle.inputStyle,
    ...rsvpInputStyle.focusStyle,
    ...fieldRadius,
  };
  const choiceStyle = (selected: boolean): CSSProperties => ({
    ...rsvpInputStyle.choiceStyle(selected),
    ...fieldRadius,
  });
  const switchStyle: CSSProperties = {
    ...rsvpInputStyle.switchStyle,
    ...fieldRadius,
  };
  const rsvpSubmitStyle = resolveRsvpSubmitStyle(
    tokens.fieldStyle,
    {
      backgroundColor: colors.buttonBg,
      textColor: colors.buttonText,
      radius: tokens.radius.button,
      accentColor: colors.accent,
    },
    "page",
  );
  const labelStyle: CSSProperties = {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: colors.text,
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="rsvp-input-color-scope flex flex-col gap-5 px-6 py-8"
      style={
        {
          "--rsvp-placeholder-color": colors.fieldPlaceholder,
        } as CSSProperties
      }
    >
      {/* Card title */}
      <div className="mb-1">
        <h2 className="text-base font-semibold" style={{ color: colors.title }}>
          {resolveText("rsvp_modalTitle")}
        </h2>
        {deadline && (
          <p className="mt-1 text-xs" style={{ color: colors.muted }}>
            {deadline}
          </p>
        )}
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label style={labelStyle}>{resolveText("rsvp_nameLabel")}</label>
        <input
          {...register("name")}
          placeholder={resolveText("rsvp_namePlaceholder")}
          className={inputBase}
          style={inputStyle}
        />
        {errors.name && (
          <span className="text-xs text-red-500">{errors.name.message}</span>
        )}
      </div>

      {showCompanion && (
        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>{resolveText("rsvp_companionLabel")}</label>
          <input
            {...register("companion")}
            placeholder={resolveText("rsvp_companionPlaceholder")}
            className={inputBase}
            style={inputStyle}
          />
        </div>
      )}

      {showEmail && (
        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>{resolveText("rsvp_emailLabel")}</label>
          <input
            {...register("email")}
            type="email"
            placeholder={resolveText("rsvp_emailPlaceholder")}
            className={inputBase}
            style={inputStyle}
          />
          {errors.email && (
            <span className="text-xs text-red-500">{errors.email.message}</span>
          )}
        </div>
      )}

      {/* Attending */}
      <div className="flex flex-col gap-2">
        <label style={labelStyle}>{resolveText("rsvp_attendingLabel")}</label>
        <div className="flex gap-3">
          {(["yes", "no"] as const).map((val) => {
            const label =
              val === "yes"
                ? resolveText("rsvp_attendingYes")
                : resolveText("rsvp_attendingNo");
            const selected = attending === val;
            return (
              <label
                key={val}
                className={rsvpInputStyle.choiceClassName}
                style={{
                  ...choiceStyle(selected),
                  color: colors.fieldText,
                  fontFamily: fonts.body,
                }}
              >
                <input
                  {...register("attending")}
                  type="radio"
                  value={val}
                  className="sr-only"
                />
                {label}
              </label>
            );
          })}
        </div>
        {errors.attending && (
          <span className="text-xs text-red-500">{errors.attending.message}</span>
        )}
      </div>

      {showDietaryRestrictions && (
        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>{resolveText("rsvp_dietaryLabel")}</label>
          <input
            {...register("dietaryRestrictions")}
            placeholder={resolveText("rsvp_dietaryPlaceholder")}
            className={inputBase}
            style={inputStyle}
          />
        </div>
      )}

      {attending === "yes" && showNumAdults && (
        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>{resolveText("rsvp_adultsLabel")}</label>
          <input
            {...register("numAdults")}
            type="number"
            min={1}
            inputMode="numeric"
            className={inputBase}
            style={inputStyle}
          />
          {errors.numAdults && (
            <span className="text-xs text-red-500">{errors.numAdults.message}</span>
          )}
        </div>
      )}

      {attending === "yes" && showNumChildren && (
        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>{resolveText("rsvp_childrenLabel")}</label>
          <input
            {...register("numChildren")}
            type="number"
            min={0}
            inputMode="numeric"
            className={inputBase}
            style={inputStyle}
          />
          {errors.numChildren && (
            <span className="text-xs text-red-500">{errors.numChildren.message}</span>
          )}
        </div>
      )}

      <RSVPCustomFields
        fields={customFields}
        attending={attending === "yes"}
        values={customValues}
        errors={customErrors}
        onChange={(fieldId, value) =>
          setCustomValues((prev) => ({ ...prev, [fieldId]: value }))
        }
        labelStyle={labelStyle}
        inputClassName={inputBase}
        inputStyle={inputStyle}
        choiceClassName={rsvpInputStyle.choiceClassName}
        choiceStyle={choiceStyle}
        switchClassName={rsvpInputStyle.switchClassName}
        switchStyle={switchStyle}
      />

      {/* Message */}
      <div className="flex flex-col gap-1.5">
        <label style={labelStyle}>{resolveText("rsvp_messageLabel")}</label>
        <textarea
          {...register("message")}
          rows={3}
          placeholder={resolveText("rsvp_messagePlaceholder")}
          className={`${inputBase} resize-none`}
          style={inputStyle}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className={rsvpSubmitStyle.className}
        style={{
          ...rsvpSubmitStyle.style,
          ...(tokens.radius.field !== undefined && {
            borderRadius: tokens.radius.button,
          }),
          fontFamily: fonts.body,
        }}
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {resolveText("rsvp_submitting")}
          </>
        ) : (
          resolveText("rsvp_submitButton")
        )}
      </button>
    </form>
  );
}
