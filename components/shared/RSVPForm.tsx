"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  CustomTexts,
  InvitationData,
  PublicGuestData,
  RsvpCustomField,
  TemplateTheme,
} from "@/lib/types";
import { RSVP_SUBMITTED_SLUGS_KEY } from "@/lib/constants";
import { useCustomText } from "@/lib/custom-texts";
import { resolveTextElementOverride } from "@/lib/curtain-canva";
import { EditableText } from "@/components/shared/EditableText";
import {
  getRsvpCustomFields,
  isRsvpClosed,
  shouldShowRsvpCompanion,
  shouldShowRsvpDietaryRestrictions,
  shouldShowRsvpEmail,
  shouldShowRsvpNumAdults,
  shouldShowRsvpNumChildren,
} from "@/lib/rsvp-config";
import { resolveRsvpInputColors } from "@/lib/rsvp-input-colors";
import { validateRsvpCustomAnswers } from "@/lib/rsvp-custom-fields";
import {
  RSVPCustomFields,
  type RsvpCustomErrors,
  type RsvpCustomValues,
} from "@/components/shared/RSVPCustomFields";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

function createRsvpSchema(t: (key: keyof CustomTexts) => string) {
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

type RSVPFormData = z.output<ReturnType<typeof createRsvpSchema>>;

// ---------------------------------------------------------------------------
// Modal palette — always light & readable, themed only via accent / CTA
// ---------------------------------------------------------------------------

interface ModalPalette {
  cardBg: string;
  fieldBg: string;
  text: string;
  textSoft: string;
  textMuted: string;
  border: string;
  accent: string;
  ctaBg: string;
  ctaText: string;
  ctaRadius: string;
  iconColor: string;
  uiFont: string;
  displayFont: string;
  bodyFont: string;
}

function buildModalPalette(
  theme: TemplateTheme | RSVPThemeLegacy,
): ModalPalette {
  const isTemplate = "uiFont" in theme;
  return {
    cardBg: "#FFFFFF",
    fieldBg: "#F8F8F7",
    text: "#323232",
    textSoft: "#6B6B6B",
    textMuted: "#A0A0A0",
    border: "#E5E5E3",
    accent: theme.accent,
    ctaBg: theme.ctaPrimaryBg,
    ctaText: theme.ctaPrimaryText,
    ctaRadius: theme.ctaRadius,
    iconColor: "#999999",
    uiFont: isTemplate
      ? (theme as TemplateTheme).uiFont
      : "'Outfit', sans-serif",
    displayFont: "'Inter', serif",
    bodyFont: theme.bodyFont,
  };
}

// ---------------------------------------------------------------------------
// Legacy direct-theme interface (kept for backward compat)
// ---------------------------------------------------------------------------

interface RSVPThemeLegacy {
  bg: string;
  cardBg: string;
  primary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  ctaPrimaryBg: string;
  ctaPrimaryText: string;
  ctaRadius: string;
  cardBorder: string;
  bodyFont: string;
}

// ---------------------------------------------------------------------------
// Props — discriminated union (DirectProps | IntegrationProps), shared with RSVPModal
// ---------------------------------------------------------------------------

export interface RSVPFormDirectProps {
  invitationSlug: string;
  theme: RSVPThemeLegacy;
  showEmail?: boolean;
  showDietaryRestrictions?: boolean;
  showCompanion?: boolean;
  showNumAdults?: boolean;
  showNumChildren?: boolean;
  customFields?: RsvpCustomField[];
  apiEndpoint?: string;
  slugKey?: string;
  /** When true: render without the modal-style header X close button. */
  inline?: boolean;
  /** Called when the modal wrapper wants the form to close. Ignored in inline mode. */
  onClose?: () => void;
  /** Optional palette overrides to theme the form (field bg, border, text colors, fonts). */
  paletteOverride?: Partial<ModalPalette>;
}

export interface RSVPFormIntegrationProps {
  invitation: InvitationData;
  theme: TemplateTheme;
  customTexts?: CustomTexts;
  apiEndpoint?: string;
  slugKey?: string;
  guest?: PublicGuestData;
  inline?: boolean;
  onClose?: () => void;
  /** Optional palette overrides to theme the form (field bg, border, text colors, fonts). */
  paletteOverride?: Partial<ModalPalette>;
}

export type RSVPFormProps = RSVPFormDirectProps | RSVPFormIntegrationProps;

function isIntegration(p: RSVPFormProps): p is RSVPFormIntegrationProps {
  return "invitation" in p;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

type SubmitState =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "already_submitted";

const RSVP_STORAGE_KEY = RSVP_SUBMITTED_SLUGS_KEY;

function getRsvpSubmittedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RSVP_STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function markRsvpSubmitted(slug: string) {
  const slugs = getRsvpSubmittedSlugs();
  if (!slugs.includes(slug)) {
    localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify([...slugs, slug]));
  }
}

function hasSubmittedRsvp(slug: string): boolean {
  return getRsvpSubmittedSlugs().includes(slug);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RSVPForm(props: RSVPFormProps) {
  const inline = props.inline === true;
  const slug = isIntegration(props)
    ? props.invitation.slug
    : props.invitationSlug;
  const deadline = isIntegration(props)
    ? props.invitation.rsvp.deadline
    : undefined;
  const ct = isIntegration(props) ? props.customTexts : undefined;
  const resolveText = useCustomText(ct);
  const rsvpSchema = createRsvpSchema(resolveText);
  const guest = isIntegration(props) ? props.guest : undefined;
  const closed = isIntegration(props) && isRsvpClosed(props.invitation.rsvp);
  const showEmail = isIntegration(props)
    ? shouldShowRsvpEmail(props.invitation.rsvp)
    : props.showEmail === true;
  const showDietaryRestrictions = isIntegration(props)
    ? shouldShowRsvpDietaryRestrictions(props.invitation.rsvp)
    : props.showDietaryRestrictions !== false;
  const showCompanion = isIntegration(props)
    ? shouldShowRsvpCompanion(props.invitation.rsvp)
    : props.showCompanion === true;
  const showNumAdults = isIntegration(props)
    ? shouldShowRsvpNumAdults(props.invitation.rsvp)
    : props.showNumAdults === true;
  const showNumChildren = isIntegration(props)
    ? shouldShowRsvpNumChildren(props.invitation.rsvp)
    : props.showNumChildren === true;
  const customFields = isIntegration(props)
    ? getRsvpCustomFields(props.invitation.rsvp)
    : (props.customFields ?? []);
  const apiEndpoint = props.apiEndpoint ?? "/api/rsvp";
  const slugKey = props.slugKey ?? "invitationSlug";

  const p = { ...buildModalPalette(props.theme), ...props.paletteOverride };
  const rsvpInputColors = resolveRsvpInputColors(
    isIntegration(props) ? props.invitation.rsvp : undefined,
    {
      backgroundColor: p.fieldBg,
      textColor: p.text,
      placeholderColor: p.textMuted,
      borderColor: p.border,
    },
  );
  const rsvpPlaceholderStyle = {
    "--rsvp-placeholder-color": rsvpInputColors.placeholderColor,
  } as React.CSSProperties;

  // Per-element text style overrides — only available in integration mode
  // (legacy direct-theme callers pass no `invitation`). Resolved once per
  // render and spread on top of inline styles so admin customizations win
  // without losing the form's typography defaults.
  const textStyles = isIntegration(props)
    ? props.invitation.textStyles
    : undefined;
  const titleOverride = resolveTextElementOverride(textStyles, "sectionTitles");
  const labelsOverride = resolveTextElementOverride(textStyles, "labels");
  const bodyTextOverride = resolveTextElementOverride(textStyles, "bodyText");
  const ctaLabelOverride = resolveTextElementOverride(textStyles, "ctaLabel");

  const [submitState, setSubmitState] = useState<SubmitState>(() =>
    hasSubmittedRsvp(slug) ? "already_submitted" : "idle",
  );
  const [customValues, setCustomValues] = useState<RsvpCustomValues>({});
  const [customErrors, setCustomErrors] = useState<RsvpCustomErrors>({});

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RSVPFormData>({
    resolver: zodResolver(rsvpSchema) as unknown as Resolver<RSVPFormData>,
    defaultValues: {
      name: guest?.name ?? "",
      email: "",
      attending: undefined,
      dietaryRestrictions: "",
      companion: "",
      numAdults: 1,
      numChildren: 0,
      message: "",
    },
  });

  // Keep the name field synced when a guest token is present
  useEffect(() => {
    if (guest?.name) {
      reset((prev) => ({ ...prev, name: guest.name }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guest?.name]);

  const attending = watch("attending");

  const onSubmit = async (data: RSVPFormData) => {
    setSubmitState("loading");
    try {
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
        setSubmitState("idle");
        return;
      }
      setCustomErrors({});

      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [slugKey]: slug,
          guestName: data.name,
          email: data.email || undefined,
          attending: data.attending === "yes",
          dietaryRestrictions: data.dietaryRestrictions || undefined,
          companion: data.companion || undefined,
          numAdults: showNumAdults ? data.numAdults : undefined,
          numChildren: showNumChildren ? data.numChildren : undefined,
          message: data.message || undefined,
          customAnswers: customValidation.answers.map((answer) => ({
            fieldId: answer.fieldId,
            value: answer.value,
          })),
          guestToken: guest?.token,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      markRsvpSubmitted(slug);
      setSubmitState("success");
      reset();
      setCustomValues({});
    } catch {
      setSubmitState("error");
    }
  };

  const handleCloseInModal = () => {
    if (submitState !== "already_submitted") setSubmitState("idle");
    reset();
    setCustomValues({});
    setCustomErrors({});
    props.onClose?.();
  };

  const uiFont = p.uiFont;

  const inputClass =
    "w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-offset-1";

  const inputStyle = {
    fontFamily: uiFont,
    backgroundColor: rsvpInputColors.backgroundColor,
    borderColor: rsvpInputColors.borderColor,
    color: rsvpInputColors.textColor,
  };

  const labelStyle = {
    fontFamily: uiFont,
    fontSize: 11 as const,
    fontWeight: 600 as const,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    color: p.textSoft,
    // Admin per-element override for ALL field labels, applied last so it wins.
    ...labelsOverride,
  };

  return (
    <>
      {/* Header — modal mode renders X close on the right; inline mode
          centers the title since there's no close affordance. */}
      <div
        className={
          inline
            ? "px-1 pb-4 text-center"
            : "flex items-center justify-between border-b px-5 py-4"
        }
        style={inline ? undefined : { borderColor: p.border }}
      >
        <h2
          className={inline ? "" : "text-base font-semibold"}
          style={{
            fontFamily: p.displayFont,
            fontSize: inline ? 28 : 18,
            color: props.theme.accent,
            ...titleOverride,
          }}
        >
          <EditableText elementKey="sectionTitles">
            {resolveText("rsvp_modalTitle")}
          </EditableText>
        </h2>
        {!inline && (
          <button
            onClick={handleCloseInModal}
            aria-label={resolveText("rsvp_closeButton")}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
          >
            <X size={18} color={p.iconColor} />
          </button>
        )}
      </div>

      {/* Body */}
      <div
        className={`${inline ? "px-1 py-2" : "flex-1 overflow-y-auto px-5 py-5"} rsvp-input-color-scope`}
        style={rsvpPlaceholderStyle}
      >
        {closed ? (
          <motion.div
            className="flex flex-col items-center gap-3 py-10 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Lock size={48} color={p.iconColor} strokeWidth={1.5} />
            <p
              className="text-lg font-medium"
              style={{
                fontFamily: p.displayFont,
                color: p.text,
                ...titleOverride,
              }}
            >
              <EditableText elementKey="sectionTitles">
                {resolveText("rsvp_closedTitle")}
              </EditableText>
            </p>
            <p
              className="text-sm"
              style={{ color: p.textSoft, ...bodyTextOverride }}
            >
              <EditableText elementKey="bodyText">
                {resolveText("rsvp_closedMessage")}
              </EditableText>
            </p>
            {!inline && (
              <button
                onClick={handleCloseInModal}
                className="mt-4 px-6 py-2 text-sm font-medium"
                style={{
                  fontFamily: uiFont,
                  background: p.ctaBg,
                  color: p.ctaText,
                  borderRadius: p.ctaRadius,
                  ...ctaLabelOverride,
                }}
              >
                <EditableText elementKey="ctaLabel">
                  {resolveText("rsvp_closeButton")}
                </EditableText>
              </button>
            )}
          </motion.div>
        ) : null}

        {!closed && submitState === "already_submitted" && (
          <motion.div
            className="flex flex-col items-center gap-3 py-10 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle size={48} color="#22c55e" strokeWidth={1.5} />
            <p
              className="text-lg font-medium"
              style={{
                fontFamily: p.displayFont,
                color: p.text,
                ...titleOverride,
              }}
            >
              <EditableText elementKey="sectionTitles">
                {resolveText("rsvp_alreadyTitle")}
              </EditableText>
            </p>
            <p
              className="text-sm"
              style={{ color: p.textSoft, ...bodyTextOverride }}
            >
              <EditableText elementKey="bodyText">
                {resolveText("rsvp_alreadyMessage")}
              </EditableText>
            </p>
            {!inline && (
              <button
                onClick={handleCloseInModal}
                className="mt-4 px-6 py-2 text-sm font-medium"
                style={{
                  fontFamily: uiFont,
                  background: "#22c55e",
                  color: "#fff",
                  borderRadius: p.ctaRadius,
                  ...ctaLabelOverride,
                }}
              >
                <EditableText elementKey="ctaLabel">
                  {resolveText("rsvp_closeButton")}
                </EditableText>
              </button>
            )}
          </motion.div>
        )}

        {!closed && submitState === "success" && (
          <motion.div
            className="flex flex-col items-center gap-3 py-10 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle size={48} color={p.accent} strokeWidth={1.5} />
            <p
              className="text-lg font-medium"
              style={{
                fontFamily: p.displayFont,
                color: p.text,
                ...titleOverride,
              }}
            >
              <EditableText elementKey="sectionTitles">
                {resolveText("rsvp_successTitle")}
              </EditableText>
            </p>
            <p
              className="text-sm"
              style={{ color: p.textSoft, ...bodyTextOverride }}
            >
              <EditableText elementKey="bodyText">
                {resolveText("rsvp_successMessage")}
              </EditableText>
            </p>
            {!inline && (
              <button
                onClick={handleCloseInModal}
                className="mt-4 px-6 py-2 text-sm font-medium"
                style={{
                  fontFamily: uiFont,
                  background: p.ctaBg,
                  color: p.ctaText,
                  borderRadius: p.ctaRadius,
                  ...ctaLabelOverride,
                }}
              >
                <EditableText elementKey="ctaLabel">
                  {resolveText("rsvp_closeButton")}
                </EditableText>
              </button>
            )}
          </motion.div>
        )}

        {!closed && submitState === "error" && (
          <motion.div
            className="flex flex-col items-center gap-3 py-10 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <AlertCircle size={48} color="#ef4444" strokeWidth={1.5} />
            <p
              className="text-lg font-medium"
              style={{
                fontFamily: p.displayFont,
                color: p.text,
                ...titleOverride,
              }}
            >
              <EditableText elementKey="sectionTitles">
                {resolveText("rsvp_errorTitle")}
              </EditableText>
            </p>
            <p
              className="text-sm"
              style={{ color: p.textSoft, ...bodyTextOverride }}
            >
              <EditableText elementKey="bodyText">
                {resolveText("rsvp_errorMessage")}
              </EditableText>
            </p>
            <button
              onClick={() => setSubmitState("idle")}
              className="mt-4 px-6 py-2 text-sm font-medium"
              style={{
                fontFamily: uiFont,
                background: p.ctaBg,
                color: p.ctaText,
                borderRadius: p.ctaRadius,
                ...ctaLabelOverride,
              }}
            >
              <EditableText elementKey="ctaLabel">
                {resolveText("rsvp_retryButton")}
              </EditableText>
            </button>
          </motion.div>
        )}

        {!closed && (submitState === "idle" || submitState === "loading") && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            {deadline && (
              <p
                className="mb-2 text-center"
                style={{
                  fontFamily: uiFont,
                  fontSize: 13,
                  color: p.textMuted,
                  ...bodyTextOverride,
                }}
              >
                <EditableText elementKey="bodyText">
                  {resolveText("rsvp_deadlinePrefix")} {deadline}
                </EditableText>
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label style={labelStyle}>
                <EditableText elementKey="labels">
                  {resolveText("rsvp_nameLabel")}
                </EditableText>
              </label>
              <input
                {...register("name")}
                placeholder={resolveText("rsvp_namePlaceholder")}
                readOnly={!!guest}
                aria-readonly={!!guest}
                className={`${inputClass} ${guest ? "cursor-not-allowed opacity-80" : ""}`}
                style={inputStyle}
              />
              {errors.name && (
                <span className="text-xs text-red-500">
                  {errors.name.message}
                </span>
              )}
            </div>

            {showCompanion && (
              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>
                  <EditableText elementKey="labels">
                    {resolveText("rsvp_companionLabel")}
                  </EditableText>
                </label>
                <input
                  {...register("companion")}
                  placeholder={resolveText("rsvp_companionPlaceholder")}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            )}

            {showEmail && (
              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>
                  <EditableText elementKey="labels">
                    {resolveText("rsvp_emailLabel")}
                  </EditableText>
                </label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder={resolveText("rsvp_emailPlaceholder")}
                  className={inputClass}
                  style={inputStyle}
                />
                {errors.email && (
                  <span className="text-xs text-red-500">
                    {errors.email.message}
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label style={labelStyle}>
                <EditableText elementKey="labels">
                  {resolveText("rsvp_attendingLabel")}
                </EditableText>
              </label>
              <div className="flex gap-3">
                <label
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors"
                  style={{
                    borderColor:
                      attending === "yes" ? p.accent : rsvpInputColors.borderColor,
                    backgroundColor:
                      attending === "yes" ? p.accent + "15" : "transparent",
                    fontFamily: uiFont,
                    ...bodyTextOverride,
                    color: rsvpInputColors.textColor,
                  }}
                >
                  <input
                    {...register("attending")}
                    type="radio"
                    value="yes"
                    className="sr-only"
                  />
                  <EditableText elementKey="bodyText">
                    {resolveText("rsvp_attendingYes")}
                  </EditableText>
                </label>
                <label
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors"
                  style={{
                    borderColor:
                      attending === "no" ? p.accent : rsvpInputColors.borderColor,
                    backgroundColor:
                      attending === "no" ? p.accent + "15" : "transparent",
                    fontFamily: uiFont,
                    ...bodyTextOverride,
                    color: rsvpInputColors.textColor,
                  }}
                >
                  <input
                    {...register("attending")}
                    type="radio"
                    value="no"
                    className="sr-only"
                  />
                  <EditableText elementKey="bodyText">
                    {resolveText("rsvp_attendingNo")}
                  </EditableText>
                </label>
              </div>
              {errors.attending && (
                <span className="text-xs text-red-500">
                  {errors.attending.message}
                </span>
              )}
            </div>

            {attending === "yes" && showDietaryRestrictions && (
              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>
                  <EditableText elementKey="labels">
                    {resolveText("rsvp_dietaryLabel")}
                  </EditableText>
                </label>
                <input
                  {...register("dietaryRestrictions")}
                  placeholder={resolveText("rsvp_dietaryPlaceholder")}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            )}

            {attending === "yes" && showNumAdults && (
              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>
                  <EditableText elementKey="labels">
                    {resolveText("rsvp_adultsLabel")}
                  </EditableText>
                </label>
                <input
                  {...register("numAdults")}
                  type="number"
                  min={1}
                  inputMode="numeric"
                  className={inputClass}
                  style={inputStyle}
                />
                {errors.numAdults && (
                  <span className="text-xs text-red-500">
                    {errors.numAdults.message}
                  </span>
                )}
              </div>
            )}

            {attending === "yes" && showNumChildren && (
              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>
                  <EditableText elementKey="labels">
                    {resolveText("rsvp_childrenLabel")}
                  </EditableText>
                </label>
                <input
                  {...register("numChildren")}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className={inputClass}
                  style={inputStyle}
                />
                {errors.numChildren && (
                  <span className="text-xs text-red-500">
                    {errors.numChildren.message}
                  </span>
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
              inputClassName={inputClass}
              inputStyle={inputStyle}
            />

            <div className="flex flex-col gap-1.5">
              <label style={labelStyle}>
                <EditableText elementKey="labels">
                  {resolveText("rsvp_messageLabel")}
                </EditableText>
              </label>
              <textarea
                {...register("message")}
                rows={3}
                placeholder={resolveText("rsvp_messagePlaceholder")}
                className={`${inputClass} resize-none`}
                style={inputStyle}
                suppressHydrationWarning
              />
            </div>

            <button
              type="submit"
              disabled={submitState === "loading"}
              className="mt-2 flex w-full items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-opacity disabled:opacity-60"
              style={{
                fontFamily: uiFont,
                background: p.ctaBg,
                color: p.ctaText,
                borderRadius: p.ctaRadius,
                ...ctaLabelOverride,
              }}
            >
              {submitState === "loading" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <EditableText elementKey="ctaLabel">
                    {resolveText("rsvp_submitting")}
                  </EditableText>
                </>
              ) : (
                <EditableText elementKey="ctaLabel">
                  {resolveText("rsvp_submitButton")}
                </EditableText>
              )}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
