"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { buildWhatsappUrl } from "@/lib/landing-whatsapp";
import { AnimatedSection } from "./AnimatedSection";
import { getInvitationTypes } from "./landing-data";
import { landingImages } from "./landing-images";
import { SectionEyebrow } from "./SectionEyebrow";

export function TypesSection() {
  const t = useTranslations("LandingTypes");
  const invitationTypes = getInvitationTypes(t);

  return (
    <AnimatedSection id="tipos" className="bg-[#F6F7F5] px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-5 text-[#5C605A]">{t("body")}</p>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {invitationTypes.map((type) => {
            const featured = Boolean(type.featured);

            return (
              <motion.article
                key={type.title}
                whileHover={{ y: -8 }}
                className={`overflow-hidden rounded-[1.5rem] transition ${
                  featured
                    ? "bg-[#3F4E3F] text-white shadow-[0_24px_80px_rgba(63,78,63,0.24)]"
                    : "border border-[#E5E7E4] bg-white text-[#1F2420] shadow-[0_12px_40px_rgba(31,36,32,0.05)]"
                }`}
              >
                <TypeVisual typeKey={type.key} featured={featured} />
                <div className="p-7">
                  <div
                    className={`mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${
                      featured
                        ? "bg-white/14 text-white"
                        : "border border-[#E5E7E4] bg-white text-[#3F4E3F]"
                    }`}
                  >
                    {type.icon} · {type.title}
                  </div>
                  <h3 className="text-2xl font-semibold">{type.title}</h3>
                  <p
                    className={`mt-4 text-sm leading-6 ${
                      featured ? "text-[#E8EBE7]" : "text-[#5C605A]"
                    }`}
                  >
                    {type.text}
                  </p>
                  <a
                    href={buildWhatsappUrl(
                      t("typeQuestion", { type: type.title }),
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-8 inline-flex items-center gap-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
                  >
                    {t("learnMore")} <span aria-hidden="true">→</span>
                  </a>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </AnimatedSection>
  );
}

function TypeVisual({
  typeKey,
  featured,
}: {
  typeKey: "saveTheDate" | "wedding" | "engagement";
  featured: boolean;
}) {
  const t = useTranslations("LandingTypes");

  if (typeKey === "saveTheDate") {
    return (
      <PhotoVisual
        src={landingImages.saveTheDate}
        alt={t("visualSaveTheDateAlt")}
        overlay="bg-[linear-gradient(180deg,rgba(31,36,32,0.05),rgba(31,36,32,0.55))]"
      >
        <p className="text-2xl font-semibold tracking-[-0.02em] text-white drop-shadow">
          18 · 07 · 26
        </p>
      </PhotoVisual>
    );
  }

  if (typeKey === "wedding") {
    return (
      <PhotoVisual
        src={landingImages.wedding}
        alt={t("visualWeddingAlt")}
        overlay="bg-[linear-gradient(180deg,rgba(31,36,32,0.05),rgba(31,36,32,0.55))]"
      >
        <p className="text-lg font-semibold text-white drop-shadow">
          Leonor & Diogo
        </p>
      </PhotoVisual>
    );
  }

  return (
    <PhotoVisual
      src={landingImages.engagement}
      alt={t("visualEngagementAlt")}
      overlay="bg-[linear-gradient(180deg,rgba(255,253,249,0.05),rgba(31,36,32,0.45))]"
    >
      <p className="text-lg font-semibold text-white drop-shadow">
        {t("visualEngagementText")}
      </p>
    </PhotoVisual>
  );
}

function PhotoVisual({
  src,
  alt,
  overlay,
  children,
}: {
  src: string;
  alt: string;
  overlay: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-56 overflow-hidden shadow-[inset_0_-18px_24px_-18px_rgba(31,36,32,0.45)]">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 420px, 100vw"
        className="object-cover"
      />
      <div className={`absolute inset-0 ${overlay}`} />
      <div className="absolute inset-x-6 bottom-6">{children}</div>
    </div>
  );
}
