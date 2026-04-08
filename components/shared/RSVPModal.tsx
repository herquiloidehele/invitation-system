"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CustomTexts, InvitationData, TemplateTheme } from "@/lib/types";
import { RSVP_SUBMITTED_SLUGS_KEY } from "@/lib/constants";
import { t } from "@/lib/custom-texts";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const rsvpSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").or(z.literal("")),
  attending: z.enum(["yes", "no"], {
    error: "Selecione uma opção",
  }),
  dietaryRestrictions: z.string(),
  message: z.string(),
});

type RSVPFormData = z.output<typeof rsvpSchema>;

// ---------------------------------------------------------------------------
// Modal palette — always light & readable, themed only via accent / CTA
// ---------------------------------------------------------------------------

interface ModalPalette {
  /** Card background — always opaque light */
  cardBg: string;
  /** Input / field background */
  fieldBg: string;
  /** Primary text (headings, input values) */
  text: string;
  /** Secondary text (labels, hints) */
  textSoft: string;
  /** Muted text (deadlines, placeholders) */
  textMuted: string;
  /** Field & card borders */
  border: string;
  /** Accent from theme (checkmark, active ring) */
  accent: string;
  /** CTA button bg */
  ctaBg: string;
  /** CTA button text */
  ctaText: string;
  /** CTA border-radius */
  ctaRadius: string;
  /** Close icon / secondary elements */
  iconColor: string;
  /** UI font */
  uiFont: string;
  /** Display font for headings */
  displayFont: string;
  /** Body font for couple label */
  bodyFont: string;
}

/** Build a high-contrast light palette, pulling only branding colors from the
 *  invitation theme. This guarantees readability on every template. */
function buildModalPalette(
  theme: TemplateTheme | RSVPThemeLegacy,
): ModalPalette {
  // Detect if the source is a full TemplateTheme (has uiFont) or legacy RSVPTheme
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
// Props — supports both standalone & InvitationPage integration
// ---------------------------------------------------------------------------

interface DirectProps {
  isOpen: boolean;
  onClose: () => void;
  invitationSlug: string;
  theme: RSVPThemeLegacy;
}

interface IntegrationProps {
  open: boolean;
  onClose: () => void;
  invitation: InvitationData;
  theme: TemplateTheme;
  customTexts?: CustomTexts;
}

type RSVPModalProps = DirectProps | IntegrationProps;

function isIntegration(p: RSVPModalProps): p is IntegrationProps {
  return "invitation" in p;
}

// ---------------------------------------------------------------------------
// Component
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

export default function RSVPModal(props: RSVPModalProps) {
  const isOpen = isIntegration(props) ? props.open : props.isOpen;
  const onClose = props.onClose;
  const slug = isIntegration(props)
    ? props.invitation.slug
    : props.invitationSlug;
  const deadline = isIntegration(props)
    ? props.invitation.rsvp.deadline
    : undefined;
  const ct = isIntegration(props) ? props.customTexts : undefined;

  // Build a guaranteed high-contrast light palette
  const p = buildModalPalette(props.theme);

  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  // Check localStorage when modal opens
  useEffect(() => {
    if (isOpen && hasSubmittedRsvp(slug)) {
      setSubmitState("already_submitted");
    } else if (!isOpen) {
      setSubmitState("idle");
    }
  }, [isOpen, slug]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RSVPFormData>({
    resolver: zodResolver(rsvpSchema) as unknown as Resolver<RSVPFormData>,
    defaultValues: {
      name: "",
      email: "",
      attending: undefined,
      dietaryRestrictions: "",
      message: "",
    },
  });

  const attending = watch("attending");

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const onSubmit = async (data: RSVPFormData) => {
    setSubmitState("loading");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationSlug: slug,
          guestName: data.name,
          email: data.email || undefined,
          attending: data.attending === "yes",
          dietaryRestrictions: data.dietaryRestrictions || undefined,
          message: data.message || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      markRsvpSubmitted(slug);
      setSubmitState("success");
      reset();
    } catch {
      setSubmitState("error");
    }
  };

  const handleClose = () => {
    if (submitState !== "already_submitted") {
      setSubmitState("idle");
    }
    reset();
    onClose();
  };

  // UI font — prefer the theme's bodyFont (which is Outfit in our refined themes)
  const uiFont = p.uiFont;

  // Shared input styles
  const inputClass =
    "w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-offset-1";

  const inputStyle = {
    fontFamily: uiFont,
    backgroundColor: p.fieldBg,
    borderColor: p.border,
    color: p.text,
  };

  const labelStyle = {
    fontFamily: uiFont,
    fontSize: 11 as const,
    fontWeight: 600 as const,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    color: p.textSoft,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Card */}
          <motion.div
            className="relative z-10 flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl shadow-2xl sm:rounded-2xl"
            style={{
              backgroundColor: p.cardBg,
            }}
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 32,
              stiffness: 340,
              mass: 0.8,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: p.border }}
            >
              <h2
                className="text-base font-semibold"
                style={{
                  fontFamily: p.displayFont,
                  fontSize: 18,
                  color: props.theme.accent,
                }}
              >
                {t(ct, "rsvp_modalTitle")}
              </h2>
              <button
                onClick={handleClose}
                aria-label={t(ct, "rsvp_closeButton")}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
              >
                <X size={18} color={p.iconColor} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {/* Already submitted state */}
              {submitState === "already_submitted" && (
                <motion.div
                  className="flex flex-col items-center gap-3 py-10 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <CheckCircle size={48} color="#22c55e" strokeWidth={1.5} />
                  <p
                    className="text-lg font-medium"
                    style={{ fontFamily: p.displayFont, color: p.text }}
                  >
                    {t(ct, "rsvp_alreadyTitle")}
                  </p>
                  <p className="text-sm" style={{ color: p.textSoft }}>
                    {t(ct, "rsvp_alreadyMessage")}
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-4 px-6 py-2 text-sm font-medium"
                    style={{
                      fontFamily: uiFont,
                      background: "#22c55e",
                      color: "#fff",
                      borderRadius: p.ctaRadius,
                    }}
                  >
                    {t(ct, "rsvp_closeButton")}
                  </button>
                </motion.div>
              )}

              {/* Success state */}
              {submitState === "success" && (
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
                    }}
                  >
                    {t(ct, "rsvp_successTitle")}
                  </p>
                  <p className="text-sm" style={{ color: p.textSoft }}>
                    {t(ct, "rsvp_successMessage")}
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-4 px-6 py-2 text-sm font-medium"
                    style={{
                      fontFamily: uiFont,
                      background: p.ctaBg,
                      color: p.ctaText,
                      borderRadius: p.ctaRadius,
                    }}
                  >
                    {t(ct, "rsvp_closeButton")}
                  </button>
                </motion.div>
              )}

              {/* Error state */}
              {submitState === "error" && (
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
                    }}
                  >
                    {t(ct, "rsvp_errorTitle")}
                  </p>
                  <p className="text-sm" style={{ color: p.textSoft }}>
                    {t(ct, "rsvp_errorMessage")}
                  </p>
                  <button
                    onClick={() => setSubmitState("idle")}
                    className="mt-4 px-6 py-2 text-sm font-medium"
                    style={{
                      fontFamily: uiFont,
                      background: p.ctaBg,
                      color: p.ctaText,
                      borderRadius: p.ctaRadius,
                    }}
                  >
                    {t(ct, "rsvp_retryButton")}
                  </button>
                </motion.div>
              )}

              {/* Form */}
              {(submitState === "idle" || submitState === "loading") && (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex flex-col gap-4"
                >
                  {/* Deadline */}
                  {deadline && (
                    <p
                      className="mb-2 text-center"
                      style={{
                        fontFamily: uiFont,
                        fontSize: 13,
                        color: p.textMuted,
                      }}
                    >
                      {t(ct, "rsvp_deadlinePrefix")} {deadline}
                    </p>
                  )}

                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label style={labelStyle}>{t(ct, "rsvp_nameLabel")}</label>
                    <input
                      {...register("name")}
                      placeholder={t(ct, "rsvp_namePlaceholder")}
                      className={inputClass}
                      style={inputStyle}
                    />
                    {errors.name && (
                      <span className="text-xs text-red-500">
                        {errors.name.message}
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label style={labelStyle}>{t(ct, "rsvp_emailLabel")}</label>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder={t(ct, "rsvp_emailPlaceholder")}
                      className={inputClass}
                      style={inputStyle}
                    />
                    {errors.email && (
                      <span className="text-xs text-red-500">
                        {errors.email.message}
                      </span>
                    )}
                  </div>

                  {/* Attending */}
                  <div className="flex flex-col gap-2">
                    <label style={labelStyle}>
                      {t(ct, "rsvp_attendingLabel")}
                    </label>
                    <div className="flex gap-3">
                      <label
                        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors"
                        style={{
                          borderColor:
                            attending === "yes" ? p.accent : p.border,
                          backgroundColor:
                            attending === "yes"
                              ? p.accent + "15"
                              : "transparent",
                          color: p.text,
                          fontFamily: uiFont,
                        }}
                      >
                        <input
                          {...register("attending")}
                          type="radio"
                          value="yes"
                          className="sr-only"
                        />
                        {t(ct, "rsvp_attendingYes")}
                      </label>
                      <label
                        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors"
                        style={{
                          borderColor: attending === "no" ? p.accent : p.border,
                          backgroundColor:
                            attending === "no"
                              ? p.accent + "15"
                              : "transparent",
                          color: p.text,
                          fontFamily: uiFont,
                        }}
                      >
                        <input
                          {...register("attending")}
                          type="radio"
                          value="no"
                          className="sr-only"
                        />
                        {t(ct, "rsvp_attendingNo")}
                      </label>
                    </div>
                    {errors.attending && (
                      <span className="text-xs text-red-500">
                        {errors.attending.message}
                      </span>
                    )}
                  </div>

                  {/* Dietary restrictions */}
                  {attending === "yes" && (
                    <div className="flex flex-col gap-1.5">
                      <label style={labelStyle}>
                        {t(ct, "rsvp_dietaryLabel")}
                      </label>
                      <input
                        {...register("dietaryRestrictions")}
                        placeholder={t(ct, "rsvp_dietaryPlaceholder")}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                  )}

                  {/* Message */}
                  <div className="flex flex-col gap-1.5">
                    <label style={labelStyle}>
                      {t(ct, "rsvp_messageLabel")}
                    </label>
                    <textarea
                      {...register("message")}
                      rows={3}
                      placeholder={t(ct, "rsvp_messagePlaceholder")}
                      className={`${inputClass} resize-none`}
                      style={inputStyle}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitState === "loading"}
                    className="mt-2 flex w-full items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-opacity disabled:opacity-60"
                    style={{
                      fontFamily: uiFont,
                      background: p.ctaBg,
                      color: p.ctaText,
                      borderRadius: p.ctaRadius,
                    }}
                  >
                    {submitState === "loading" ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {t(ct, "rsvp_submitting")}
                      </>
                    ) : (
                      t(ct, "rsvp_submitButton")
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
