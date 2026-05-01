"use client";

import { useEffect, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react";
import type { CustomTexts, InvitationEventType } from "@/lib/types";
import { t } from "@/lib/custom-texts";
import { RSVP_SUBMITTED_SLUGS_KEY } from "@/lib/constants";
import { buildInvitationDisplayName } from "@/lib/invitation-event-types";

// ---------------------------------------------------------------------------
// Schema — identical to RSVPModal
// ---------------------------------------------------------------------------

const rsvpSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").or(z.literal("")),
  attending: z.enum(["yes", "no"], { error: "Selecione uma opção" }),
  dietaryRestrictions: z.string(),
  message: z.string(),
});

type RSVPFormData = z.output<typeof rsvpSchema>;

// ---------------------------------------------------------------------------
// localStorage helpers — same key as RSVPModal so the guard is shared
// ---------------------------------------------------------------------------

function getRsvpSubmittedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RSVP_SUBMITTED_SLUGS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function markRsvpSubmitted(slug: string) {
  const slugs = getRsvpSubmittedSlugs();
  if (!slugs.includes(slug)) {
    localStorage.setItem(
      RSVP_SUBMITTED_SLUGS_KEY,
      JSON.stringify([...slugs, slug]),
    );
  }
}

function hasSubmittedRsvp(slug: string): boolean {
  return getRsvpSubmittedSlugs().includes(slug);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RsvpPageProps {
  slug: string;
  eventType: InvitationEventType;
  bride: string;
  groom: string;
  dateDisplay: string;
  deadline?: string;
  deadlinePassed: boolean;
  showEmail?: boolean;
  customTexts?: CustomTexts;
}

// ---------------------------------------------------------------------------
// Fixed neutral palette — deliberately independent of invitation theme
// ---------------------------------------------------------------------------

const palette = {
  bg: "#F9F8F6",
  card: "#FFFFFF",
  text: "#2C2C2B",
  textSoft: "#6B6A68",
  textMuted: "#A5A39F",
  border: "#E6E4E0",
  fieldBg: "#F4F3F0",
  accent: "#BE8C7A", // warm neutral rose
  ctaBg: "#2C2C2B",
  ctaText: "#FFFFFF",
  ctaRadius: "10px",
};

type SubmitState =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "already_submitted";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RsvpPage({
  slug,
  eventType,
  bride,
  groom,
  dateDisplay,
  deadline,
  deadlinePassed,
  showEmail = false,
  customTexts: ct,
}: RsvpPageProps) {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  // Check localStorage on mount
  useEffect(() => {
    if (hasSubmittedRsvp(slug)) {
      setSubmitState("already_submitted");
    }
  }, [slug]);

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
  const invitationName = buildInvitationDisplayName({
    eventType,
    primaryName: bride,
    secondaryName: groom,
  });

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

  // Shared input styles
  const inputBase =
    "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-[#BE8C7A]/30";

  const inputStyle: React.CSSProperties = {
    backgroundColor: palette.fieldBg,
    borderColor: palette.border,
    color: palette.text,
    fontFamily: "'Inter', system-ui, sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: palette.textSoft,
  };

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{
        backgroundColor: palette.bg,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <header
        className="border-b px-5 py-8 text-center"
        style={{ borderColor: palette.border, backgroundColor: palette.card }}
      >
        <p
          className="text-xs tracking-[0.15em] uppercase mb-3"
          style={{ color: palette.textMuted }}
        >
          {t(ct, "cta_confirmLabel")}
        </p>
        <h1
          className="text-3xl font-light tracking-tight"
          style={{
            color: palette.text,
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          {invitationName}
        </h1>
        {dateDisplay && (
          <p className="mt-2 text-sm" style={{ color: palette.textSoft }}>
            {dateDisplay}
          </p>
        )}
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div
          className="w-full max-w-md rounded-2xl border shadow-sm overflow-hidden"
          style={{ backgroundColor: palette.card, borderColor: palette.border }}
        >
          {/* ── Deadline closed ── */}
          {deadlinePassed ? (
            <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
              <Clock
                size={44}
                strokeWidth={1.3}
                style={{ color: palette.textMuted }}
              />
              <p
                className="text-lg font-medium"
                style={{ color: palette.text }}
              >
                Prazo encerrado
              </p>
              <p className="text-sm" style={{ color: palette.textSoft }}>
                O prazo para confirmação de presença terminou
                {deadline ? ` em ${deadline}` : ""}.
              </p>
            </div>
          ) : submitState === "already_submitted" ? (
            /* ── Already submitted ── */
            <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
              <CheckCircle size={44} strokeWidth={1.3} color="#22c55e" />
              <p
                className="text-lg font-medium"
                style={{ color: palette.text }}
              >
                {t(ct, "rsvp_alreadyTitle")}
              </p>
              <p className="text-sm" style={{ color: palette.textSoft }}>
                {t(ct, "rsvp_alreadyMessage")}
              </p>
            </div>
          ) : submitState === "success" ? (
            /* ── Success ── */
            <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
              <CheckCircle
                size={44}
                strokeWidth={1.3}
                style={{ color: palette.accent }}
              />
              <p
                className="text-lg font-medium"
                style={{ color: palette.text }}
              >
                {t(ct, "rsvp_successTitle")}
              </p>
              <p className="text-sm" style={{ color: palette.textSoft }}>
                {t(ct, "rsvp_successMessage")}
              </p>
            </div>
          ) : submitState === "error" ? (
            /* ── Error ── */
            <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
              <AlertCircle size={44} strokeWidth={1.3} color="#ef4444" />
              <p
                className="text-lg font-medium"
                style={{ color: palette.text }}
              >
                {t(ct, "rsvp_errorTitle")}
              </p>
              <p className="text-sm" style={{ color: palette.textSoft }}>
                {t(ct, "rsvp_errorMessage")}
              </p>
              <button
                onClick={() => setSubmitState("idle")}
                className="mt-2 px-6 py-2.5 text-sm font-medium rounded-xl transition-opacity hover:opacity-80"
                style={{
                  background: palette.ctaBg,
                  color: palette.ctaText,
                  borderRadius: palette.ctaRadius,
                }}
              >
                {t(ct, "rsvp_retryButton")}
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5 px-6 py-8"
            >
              {/* Card title */}
              <div className="mb-1">
                <h2
                  className="text-base font-semibold"
                  style={{ color: palette.text }}
                >
                  {t(ct, "rsvp_modalTitle")}
                </h2>
                {deadline && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: palette.textMuted }}
                  >
                    {t(ct, "rsvp_deadlinePrefix")} {deadline}
                  </p>
                )}
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>{t(ct, "rsvp_nameLabel")}</label>
                <input
                  {...register("name")}
                  placeholder={t(ct, "rsvp_namePlaceholder")}
                  className={inputBase}
                  style={inputStyle}
                />
                {errors.name && (
                  <span className="text-xs text-red-500">
                    {errors.name.message}
                  </span>
                )}
              </div>

              {showEmail && (
                <div className="flex flex-col gap-1.5">
                  <label style={labelStyle}>{t(ct, "rsvp_emailLabel")}</label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder={t(ct, "rsvp_emailPlaceholder")}
                    className={inputBase}
                    style={inputStyle}
                  />
                  {errors.email && (
                    <span className="text-xs text-red-500">
                      {errors.email.message}
                    </span>
                  )}
                </div>
              )}

              {/* Attending */}
              <div className="flex flex-col gap-2">
                <label style={labelStyle}>{t(ct, "rsvp_attendingLabel")}</label>
                <div className="flex gap-3">
                  {(["yes", "no"] as const).map((val) => {
                    const label =
                      val === "yes"
                        ? t(ct, "rsvp_attendingYes")
                        : t(ct, "rsvp_attendingNo");
                    const selected = attending === val;
                    return (
                      <label
                        key={val}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition-all"
                        style={{
                          borderColor: selected
                            ? palette.accent
                            : palette.border,
                          backgroundColor: selected
                            ? palette.accent + "18"
                            : "transparent",
                          color: palette.text,
                          fontFamily: "'Inter', system-ui, sans-serif",
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
                  <span className="text-xs text-red-500">
                    {errors.attending.message}
                  </span>
                )}
              </div>

              {/* Dietary restrictions — only if attending */}
              {attending === "yes" && (
                <div className="flex flex-col gap-1.5">
                  <label style={labelStyle}>{t(ct, "rsvp_dietaryLabel")}</label>
                  <input
                    {...register("dietaryRestrictions")}
                    placeholder={t(ct, "rsvp_dietaryPlaceholder")}
                    className={inputBase}
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>{t(ct, "rsvp_messageLabel")}</label>
                <textarea
                  {...register("message")}
                  rows={3}
                  placeholder={t(ct, "rsvp_messagePlaceholder")}
                  className={`${inputBase} resize-none`}
                  style={inputStyle}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitState === "loading"}
                className="mt-1 flex w-full items-center justify-center gap-2 py-3.5 text-sm font-medium transition-opacity disabled:opacity-60 hover:opacity-85"
                style={{
                  background: palette.ctaBg,
                  color: palette.ctaText,
                  borderRadius: palette.ctaRadius,
                  fontFamily: "'Inter', system-ui, sans-serif",
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
      </main>
    </div>
  );
}
