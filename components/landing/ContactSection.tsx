"use client";

import { FormEvent } from "react";
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
  return (
    <AnimatedSection id="orcamento" className="bg-[#F6F7F5] px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
        <div>
          <SectionEyebrow>Vamos criar juntos</SectionEyebrow>
          <h2 className="mt-6 text-4xl font-medium leading-[1.08] tracking-[-0.03em] text-[#1F2420] sm:text-5xl">
            Vamos desenhar
            <span className="block text-[#3F4E3F]">o convite convosco.</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#5C605A]">
            Conte-nos a data, o estilo e o que já imaginam. Respondemos com uma
            proposta clara no mesmo dia, sem compromisso.
          </p>
          <div className="mt-8 space-y-3 text-sm text-[#3F4E3F]">
            <p>WhatsApp · {DISPLAY_WHATSAPP_NUMBER}</p>
            <p>E-mail · ola@brindeal.studio</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="rounded-[1.5rem] border border-[#E5E7E4] bg-white p-6 shadow-sm sm:p-9">
          <h3 className="text-2xl font-semibold">Começar o convite</h3>
          <p className="mt-2 text-sm text-[#5C605A]">Resposta no mesmo dia.</p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <TextField label="Nome" placeholder="Maria Silva" value={formState.name} onChange={(value) => onFieldChange("name", value)} />
            <TextField label="Tipo de evento" placeholder="Casamento" value={formState.eventType} onChange={(value) => onFieldChange("eventType", value)} />
            <TextField label="Data" placeholder="12 Setembro 2026" value={formState.date} onChange={(value) => onFieldChange("date", value)} />
            <TextField label="Convidados" placeholder="120" value={formState.guests} onChange={(value) => onFieldChange("guests", value)} />
          </div>
          <label className="mt-4 block text-sm font-semibold text-[#1F2420]">
            Mensagem
            <textarea
              value={formState.message}
              onChange={(event) => onFieldChange("message", event.target.value)}
              className="mt-2 min-h-28 w-full rounded-2xl border border-[#E5E7E4] bg-[#F6F7F5] px-4 py-3 text-sm font-normal outline-none transition focus:border-[#3F4E3F] focus:ring-2 focus:ring-[#3F4E3F]/20"
              placeholder="Conte-nos o estilo, local ou qualquer detalhe importante."
            />
          </label>
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-[#3F4E3F] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#2D3A2D] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
          >
            Enviar pedido pelo WhatsApp
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
