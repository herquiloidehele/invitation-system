import {
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  type LucideIcon,
  MessageSquare,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { buildWhatsappUrl } from "@/lib/landing-whatsapp";
import { AnimatedSection } from "./AnimatedSection";
import { getProcessBadges, getProcessSteps } from "./landing-data";
import { SectionEyebrow } from "./SectionEyebrow";

const STEP_ICONS: LucideIcon[] = [
  MessageSquare,
  CreditCard,
  CheckCircle2,
  ArrowUpRight,
];

export function ProcessSection() {
  const t = useTranslations("LandingProcess");
  const landingT = useTranslations("Landing");
  const badges = getProcessBadges(t);
  const processSteps = getProcessSteps(t);

  return (
    <AnimatedSection
      id="processo"
      className="bg-[#F6F7F5] px-5 py-24 sm:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-5 text-[#5C605A]">
            {t("body")}
          </p>
        </div>
        <div className="mt-16 grid gap-5 lg:grid-cols-2">
          {processSteps.map(([number, title, text], index) => {
            const dark = index === 0;

            return (
              <article
                key={number}
                className={`min-h-[320px] rounded-[1.5rem] p-7 shadow-[0_18px_55px_rgba(31,36,32,0.05)] sm:p-8 ${
                  dark
                    ? "bg-[#3F4E3F] text-white"
                    : "border border-[#E5E7E4] bg-white text-[#1F2420]"
                }`}
              >
                <div className="flex items-start justify-between gap-6">
                  <p
                    className={`text-5xl font-semibold leading-none ${dark ? "text-white" : "text-[#3F4E3F]"}`}
                  >
                    {number}
                  </p>
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-2xl ${
                      dark
                        ? "bg-white/12 text-white"
                        : "bg-[#F6F7F5] text-[#3F4E3F]"
                    }`}
                    aria-hidden="true"
                  >
                    {(() => {
                      const Icon = STEP_ICONS[index] ?? MessageSquare;
                      return <Icon className="size-5" />;
                    })()}
                  </span>
                </div>
                <h3 className="mt-7 text-2xl font-semibold tracking-[-0.02em]">
                  {title}
                </h3>
                <p
                  className={`mt-5 text-sm leading-7 ${dark ? "text-[#E8EBE7]" : "text-[#5C605A]"}`}
                >
                  {text}
                </p>
                <span
                  className={`mt-6 inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] ${
                    dark
                      ? "bg-white/14 text-white"
                      : "border border-[#E5E7E4] bg-white text-[#1F2420]"
                  }`}
                >
                  • {badges[index]}
                </span>
                <ProcessPreview index={index} />
              </article>
            );
          })}
        </div>
        <div className="mt-14 flex flex-col items-center justify-center gap-5 text-center sm:flex-row">
          <p className="text-2xl font-medium text-[#1F2420]">
            {t("closing")}
          </p>
          <a
            href={buildWhatsappUrl(landingT("defaultWhatsappMessage"))}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#3F4E3F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2D3A2D] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
          >
            {t("cta")}
          </a>
        </div>
      </div>
    </AnimatedSection>
  );
}

function ProcessPreview({ index }: { index: number }) {
  const t = useTranslations("LandingProcess");

  if (index === 0) {
    return (
      <div className="mt-6 space-y-2 rounded-2xl bg-[#243326]/85 p-4 text-xs text-white">
        <div className="flex items-end gap-2">
          <div className="rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[#1F2420] shadow-sm">
            {t("previewMessageA")}
          </div>
          <span className="text-[9px] uppercase tracking-[0.18em] text-white/45">
            10:24
          </span>
        </div>
        <div className="flex items-end justify-end gap-2">
          <span className="text-[9px] uppercase tracking-[0.18em] text-white/45">
            10:26
          </span>
          <div className="rounded-2xl rounded-br-sm bg-[#6B7E68] px-3 py-2 text-white shadow-sm">
            {t("previewMessageB")}
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1 text-[10px] text-white/60">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:240ms]" />
          {t("typing")}
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="mt-6 rounded-2xl bg-[#F6F7F5] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5C605A]">
          {t("paymentTitle")}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-[#E5E7E4] bg-white px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5C605A]">
              {t("paymentOptionA")}
            </p>
            <p className="mt-1 text-xl font-semibold text-[#1F2420]">50%</p>
          </div>
          <div className="rounded-xl border border-[#3F4E3F] bg-[#3F4E3F] px-3 py-2 text-white">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">
              {t("paymentOptionB")}
            </p>
            <p className="mt-1 text-xl font-semibold">100%</p>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-[#3F4E3F] shadow-sm">
          <CheckCircle2 className="size-3.5" />
          <span>{t("paymentConfirmed")}</span>
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <>
        <div className="mt-6 grid grid-cols-[auto_1fr] gap-3 rounded-2xl bg-[#F6F7F5] p-4">
        <div className="relative h-24 w-16 overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="absolute inset-x-2 top-2 h-2 rounded-full bg-[#DEE1DC]" />
          <div className="absolute inset-x-2 top-5 h-2 w-8 rounded-full bg-[#DEE1DC]" />
          <div className="absolute inset-x-2 top-9 h-8 rounded-md bg-[#E8EBE7]" />
          <span className="absolute -right-1 top-3 grid h-5 w-5 place-items-center rounded-full bg-[#3F4E3F] text-[9px] font-bold text-white">
            1
          </span>
          <span className="absolute -left-1 bottom-3 grid h-5 w-5 place-items-center rounded-full bg-[#3F4E3F] text-[9px] font-bold text-white">
            2
          </span>
        </div>
        <div className="space-y-2 text-[11px] text-[#1F2420]">
          <div className="flex items-center gap-2">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-[#3F4E3F] text-[8px] font-bold text-white">
              1
            </span>
            {t("revisionA")}
          </div>
          <div className="flex items-center gap-2 text-[#5C605A]">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-[#3F4E3F] text-[8px] font-bold text-white">
              2
            </span>
            {t("revisionB")}
          </div>
          <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#3F4E3F]">
            {t("versionApproved")}
          </span>
        </div>
        </div>
        <p className="mt-4 text-[11px] leading-5 text-[#7A7E78]">
          {t("revisionFees")}
        </p>
      </>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-[auto_1fr] gap-3 rounded-2xl bg-[#F6F7F5] p-4 text-xs text-[#1F2420]">
      <div className="grid h-24 w-14 place-items-center rounded-xl border-[3px] border-[#3F4E3F] bg-white">
        <div className="space-y-1">
          <span className="block h-1.5 w-7 rounded-full bg-[#DEE1DC]" />
          <span className="block h-3 w-7 rounded-md bg-[#3F4E3F]" />
          <span className="block h-1.5 w-5 rounded-full bg-[#DEE1DC]" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-full bg-white px-3 py-1.5 text-[11px] shadow-sm">
          <span>{t("confirmed")}</span>
          <span className="font-semibold text-[#3F4E3F]">142</span>
        </div>
        <div className="flex items-center justify-between rounded-full bg-white px-3 py-1.5 text-[11px] shadow-sm">
          <span>{t("messages")}</span>
          <span className="font-semibold text-[#3F4E3F]">18</span>
        </div>
        <div className="flex items-center justify-between rounded-full bg-[#3F4E3F] px-3 py-1.5 text-[11px] text-white">
          <span>{t("realTime")}</span>
          <span className="font-semibold">{t("live")}</span>
        </div>
      </div>
    </div>
  );
}
