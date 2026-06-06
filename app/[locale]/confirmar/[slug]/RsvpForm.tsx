"use client";

import type { CSSProperties } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { CustomTexts, TemplateTheme } from "@/lib/types";
import { useCustomText } from "@/lib/custom-texts";

function createRsvpSchema(t: (key: keyof CustomTexts) => string) {
  return z.object({
    name: z.string().min(1, t("rsvp_nameRequired")),
    email: z.string().email(t("rsvp_invalidEmail")).or(z.literal("")),
    attending: z.enum(["yes", "no"], { error: t("rsvp_selectOption") }),
    dietaryRestrictions: z.string(),
    message: z.string(),
  });
}

export type RsvpFormData = z.output<ReturnType<typeof createRsvpSchema>>;

interface Props {
  theme: TemplateTheme;
  customTexts?: CustomTexts;
  showEmail: boolean;
  showDietaryRestrictions: boolean;
  deadline?: string;
  submitting: boolean;
  onSubmit: (data: RsvpFormData) => void | Promise<void>;
}

export default function RsvpForm({
  theme,
  customTexts,
  showEmail,
  showDietaryRestrictions,
  deadline,
  submitting,
  onSubmit,
}: Props) {
  const t = useCustomText(customTexts);
  const rsvpSchema = createRsvpSchema(t);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RsvpFormData>({
    resolver: zodResolver(rsvpSchema) as unknown as Resolver<RsvpFormData>,
    defaultValues: {
      name: "",
      email: "",
      attending: undefined,
      dietaryRestrictions: "",
      message: "",
    },
  });

  const attending = watch("attending");

  const labelStyle: CSSProperties = {
    fontFamily: theme.uiFont,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: theme.textMuted,
  };

  const inputClass =
    "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-offset-1 placeholder:text-neutral-400";

  const inputStyle: CSSProperties = {
    backgroundColor: theme.bg,
    borderColor: theme.cardBorder,
    color: theme.textPrimary,
    fontFamily: theme.bodyFont,
  };

  const cardTitleStyle: CSSProperties = {
    fontFamily: theme.displayFont,
    color: theme.textPrimary,
  };

  const deadlineHintStyle: CSSProperties = {
    fontFamily: theme.bodyFont,
    color: theme.textMuted,
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 px-6 py-8"
      style={
        {
          "--rsvp-accent": theme.accent,
        } as CSSProperties
      }
    >
      <div className="mb-1">
        <h2 className="text-base font-semibold" style={cardTitleStyle}>
          {t("rsvp_modalTitle")}
        </h2>
        {deadline && (
          <p className="mt-1 text-xs" style={deadlineHintStyle}>
            {t("rsvp_deadlinePrefix")} {deadline}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label style={labelStyle}>{t("rsvp_nameLabel")}</label>
        <input
          {...register("name")}
          placeholder={t("rsvp_namePlaceholder")}
          className={`${inputClass} focus:ring-[var(--rsvp-accent)]/30`}
          style={inputStyle}
        />
        {errors.name && (
          <span className="text-xs text-red-500">{errors.name.message}</span>
        )}
      </div>

      {showEmail && (
        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>{t("rsvp_emailLabel")}</label>
          <input
            {...register("email")}
            type="email"
            placeholder={t("rsvp_emailPlaceholder")}
            className={`${inputClass} focus:ring-[var(--rsvp-accent)]/30`}
            style={inputStyle}
          />
          {errors.email && (
            <span className="text-xs text-red-500">{errors.email.message}</span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label style={labelStyle}>{t("rsvp_attendingLabel")}</label>
        <div className="flex gap-3">
          {(["yes", "no"] as const).map((val) => {
            const label =
              val === "yes" ? t("rsvp_attendingYes") : t("rsvp_attendingNo");
            const selected = attending === val;
            return (
              <label
                key={val}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition-all"
                style={{
                  borderColor: selected ? theme.accent : theme.cardBorder,
                  backgroundColor: selected
                    ? `${theme.accent}1F`
                    : "transparent",
                  color: theme.textPrimary,
                  fontFamily: theme.bodyFont,
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

      {showDietaryRestrictions && (
        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>{t("rsvp_dietaryLabel")}</label>
          <input
            {...register("dietaryRestrictions")}
            placeholder={t("rsvp_dietaryPlaceholder")}
            className={`${inputClass} focus:ring-[var(--rsvp-accent)]/30`}
            style={inputStyle}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label style={labelStyle}>{t("rsvp_messageLabel")}</label>
        <textarea
          {...register("message")}
          rows={3}
          placeholder={t("rsvp_messagePlaceholder")}
          className={`${inputClass} resize-none focus:ring-[var(--rsvp-accent)]/30`}
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 flex w-full items-center justify-center gap-2 py-3.5 text-sm font-medium transition-opacity disabled:opacity-60 hover:opacity-85"
        style={{
          background: theme.ctaPrimaryBg,
          color: theme.ctaPrimaryText,
          borderRadius: theme.ctaRadius,
          fontFamily: theme.uiFont,
        }}
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {t("rsvp_submitting")}
          </>
        ) : (
          t("rsvp_submitButton")
        )}
      </button>
    </form>
  );
}
