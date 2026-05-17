"use client";

import { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { DISPLAY_WHATSAPP_NUMBER, type ContactMessageFields } from "@/lib/landing-whatsapp";
import { AnimatedSection } from "./AnimatedSection";
import { SectionEyebrow } from "./SectionEyebrow";

export function ContactSection({
  formState,
  onFieldChange,
  onSubmit,
}: {
  formState: ContactMessageFields;
  onFieldChange: (field: keyof ContactMessageFields, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const t = useTranslations("LandingContact");

  return (
    <AnimatedSection id="orcamento" className="bg-[#F6F7F5] px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
        <div>
          <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
          <h2 className="mt-6 text-4xl font-medium leading-[1.08] tracking-[-0.03em] text-[#1F2420] sm:text-5xl">
            {t("titleLine1")}
            <span className="block text-[#3F4E3F]">{t("titleLine2")}</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#5C605A]">
            {t("body")}
          </p>
          <div className="mt-8 space-y-3 text-sm text-[#3F4E3F]">
            <p>WhatsApp · {DISPLAY_WHATSAPP_NUMBER}</p>
            <p>E-mail · ola@brindeal.studio</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="rounded-[1.5rem] border border-[#E5E7E4] bg-white p-6 shadow-sm sm:p-9">
          <h3 className="text-2xl font-semibold">{t("formTitle")}</h3>
          <p className="mt-2 text-sm text-[#5C605A]">{t("formSubtitle")}</p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <TextField label={t("name")} placeholder={t("namePlaceholder")} value={formState.name} onChange={(value) => onFieldChange("name", value)} />
            <TextField label={t("eventType")} placeholder={t("eventTypePlaceholder")} value={formState.eventType} onChange={(value) => onFieldChange("eventType", value)} />
            <TextField label={t("date")} placeholder={t("datePlaceholder")} value={formState.date} onChange={(value) => onFieldChange("date", value)} />
            <TextField label={t("guests")} placeholder={t("guestsPlaceholder")} value={formState.guests} onChange={(value) => onFieldChange("guests", value)} />
          </div>
          <label className="mt-4 block text-sm font-semibold text-[#1F2420]">
            {t("message")}
            <textarea
              value={formState.message}
              onChange={(event) => onFieldChange("message", event.target.value)}
              className="mt-2 min-h-28 w-full rounded-2xl border border-[#E5E7E4] bg-[#F6F7F5] px-4 py-3 text-sm font-normal outline-none transition focus:border-[#3F4E3F] focus:ring-2 focus:ring-[#3F4E3F]/20"
              placeholder={t("messagePlaceholder")}
            />
          </label>
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-[#3F4E3F] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#2D3A2D] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
          >
            {t("submit")}
          </button>
        </form>
      </div>
    </AnimatedSection>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-[#1F2420]">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-2xl border border-[#E5E7E4] bg-[#F6F7F5] px-4 text-sm font-normal outline-none transition focus:border-[#3F4E3F] focus:ring-2 focus:ring-[#3F4E3F]/20"
      />
    </label>
  );
}
