import Image from "next/image";
import {
  BarChart3,
  Languages,
  Palette,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { AnimatedSection } from "./AnimatedSection";
import { landingImages } from "./landing-images";
import { SectionEyebrow } from "./SectionEyebrow";

export function FeaturesSection() {
  const t = useTranslations("LandingFeatures");

  return (
    <AnimatedSection
      id="recursos"
      className="bg-white px-5 py-24 sm:px-8 lg:py-28"
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
        <div className="mt-14 grid gap-5 lg:grid-cols-12">
          <RsvpHero />

          <div className="grid gap-5 lg:col-span-5">
            <FeatureWideCard
              icon="♫"
              title={t("musicTitle")}
              text={t("musicText")}
              visual={<MusicPlayer />}
            />
            <FeatureWideCard
              icon="◎"
              title={t("mapTitle")}
              text={t("mapText")}
              visual={<MapTile />}
            />
          </div>

          <FeatureSmallCard
            icon={Users}
            title={t("guestsTitle")}
            text={t("guestsText")}
          >
            <GuestTable />
          </FeatureSmallCard>

          <FeatureSmallCard
            icon={BarChart3}
            title={t("analyticsTitle")}
            text={t("analyticsText")}
          >
            <AnalyticsChart />
          </FeatureSmallCard>

          <FeatureSmallCard
            icon={Languages}
            title={t("languagesTitle")}
            text={t("languagesText")}
            tinted
          >
            <LanguageList />
          </FeatureSmallCard>

          <FeatureSmallCard
            icon={Palette}
            title={t("customTitle")}
            text={t("customText")}
          >
            <CustomizationPanel />
          </FeatureSmallCard>
        </div>
      </div>
    </AnimatedSection>
  );
}

function RsvpHero() {
  const t = useTranslations("LandingFeatures");
  const guests = [
    { name: "Luena Santos", imageUrl: landingImages.guestPortraitA },
    { name: "Dário Monteiro", imageUrl: landingImages.guestPortraitB },
    { name: "Ana Pereira", imageUrl: landingImages.guestPortraitC },
  ];
  const menu = [t("menuMeat"), t("menuFish"), t("menuVegetarian")];

  return (
    <article className="min-h-[360px] rounded-[1.75rem] bg-[#3F4E3F] p-8 text-white sm:p-10 lg:col-span-7 lg:min-h-[430px]">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F6F7F5]">
        {t("rsvpEyebrow")}
      </p>
      <h3 className="mt-7 text-4xl font-semibold leading-tight tracking-[-0.02em] sm:text-5xl">
        {t("rsvpTitle")}
      </h3>
      <p className="mt-5 max-w-3xl text-sm leading-7 text-[#E8EBE7] sm:text-base">
        {t("rsvpBody")}
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E8EBE7]">
        {t("menu")}
        {menu.map((item) => (
          <span
            key={item}
            className="rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-semibold normal-case tracking-normal text-white"
          >
            {item}
          </span>
        ))}
      </div>
      <div className="mt-6 rounded-2xl bg-[#243326]/70 p-5 backdrop-blur">
        <div className="flex items-center justify-between text-xs font-semibold tracking-[0.12em] text-[#F6F7F5]">
          <span>{t("received")}</span>
          <span>142 / 150</span>
        </div>
        <div className="mt-5 h-2 rounded-full bg-black/20">
          <div className="h-full w-[92%] rounded-full bg-[#6B7E68]" />
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex -space-x-2">
            {guests.map((guest) => (
              <span
                key={guest.name}
                className="relative block h-9 w-9 overflow-hidden rounded-full border-2 border-[#243326] bg-[#F6F7F5] shadow-[0_3px_12px_rgba(0,0,0,0.18)]"
              >
                <Image
                  src={guest.imageUrl}
                  alt={guest.name}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </span>
            ))}
            <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#243326] bg-[#9AA795] text-[10px] font-bold text-white shadow-[0_3px_12px_rgba(0,0,0,0.18)]">
              +138
            </span>
          </div>
          <span className="text-xs text-[#E8EBE7]">{t("updatedNow")}</span>
        </div>
      </div>
    </article>
  );
}

function FeatureWideCard({
  icon,
  title,
  text,
  visual,
}: {
  icon: string;
  title: string;
  text: string;
  visual: React.ReactNode;
}) {
  return (
    <article className="grid min-h-[205px] grid-cols-[1fr_auto] items-center gap-6 rounded-[1.75rem] border border-[#E5E7E4] bg-white p-7 shadow-[0_12px_40px_rgba(31,36,32,0.035)] sm:p-8">
      <div>
        <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-[#F6F7F5] text-xl text-[#3F4E3F]">
          {icon}
        </div>
        <h3 className="text-xl font-semibold tracking-[-0.02em] text-[#1F2420]">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#5C605A]">{text}</p>
      </div>
      {visual}
    </article>
  );
}

function FeatureSmallCard({
  icon: Icon = Sparkles,
  title,
  text,
  children,
  tinted,
}: {
  icon?: LucideIcon;
  title: string;
  text: string;
  children: React.ReactNode;
  tinted?: boolean;
}) {
  return (
    <article
      className={`rounded-[1.5rem] border border-[#E5E7E4] p-6 shadow-[0_12px_40px_rgba(31,36,32,0.035)] lg:col-span-3 ${
        tinted ? "bg-[#E8EBE7]" : "bg-white"
      }`}
    >
      <div className="mb-6 grid h-11 w-11 place-items-center rounded-2xl bg-[#F6F7F5] text-[#3F4E3F]">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#1F2420]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[#5C605A]">{text}</p>
      {children}
    </article>
  );
}

function MusicPlayer() {
  return (
    <div
      className="grid w-40 grid-cols-[auto_1fr] items-center gap-3 rounded-2xl bg-[#F6F7F5] p-3 shadow-inner"
      aria-hidden="true"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#3F4E3F] text-white">
        ▶
      </span>
      <div>
        <p className="text-[11px] font-semibold text-[#1F2420]">Marry Me</p>
        <p className="text-[10px] text-[#5C605A]">Train · 02:46</p>
      </div>
    </div>
  );
}

function MapTile() {
  const t = useTranslations("LandingFeatures");

  return (
    <div
      className="relative h-24 w-32 overflow-hidden rounded-2xl border border-[#E5E7E4] bg-[#F6F7F5]"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#EEF1EC_0%,#E0E5DC_100%)]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0_10px,rgba(63,78,63,0.07)_10px_11px),repeating-linear-gradient(-45deg,transparent_0_10px,rgba(63,78,63,0.07)_10px_11px)]" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 128 96"
        fill="none"
      >
        <path
          d="M8 78 Q 40 60 60 50 T 110 22"
          stroke="#3F4E3F"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="4 4"
          fill="none"
        />
      </svg>
      <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-white shadow">
        <span className="h-2.5 w-2.5 rounded-full bg-[#3F4E3F]" />
      </span>
      <span className="absolute bottom-2 left-2 rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold text-[#3F4E3F] shadow">
        {t("mapVenue")}
      </span>
    </div>
  );
}

function GuestTable() {
  const t = useTranslations("LandingFeatures");
  const rows = [
    { name: "Leonor S.", table: 1, state: "✓" },
    { name: "Diogo M.", table: 1, state: "✓" },
    { name: "Sara F.", table: 3, state: "·" },
  ];

  return (
    <div className="mt-5 overflow-hidden rounded-xl bg-[#F6F7F5]">
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.22em] text-[#5C605A]">
        <span>{t("guest")}</span>
        <span>{t("table")}</span>
        <span>RSVP</span>
      </div>
      <div className="space-y-1 px-2 pb-2">
        {rows.map((row, index) => (
          <div
            key={row.name}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg bg-white px-2 py-1.5 text-xs"
          >
            <span className="flex items-center gap-2 truncate">
              <span
                className={`h-4 w-4 rounded-full ${index === 2 ? "bg-[#E5E7E4]" : "bg-[#3F4E3F]"}`}
              />
              {row.name}
            </span>
            <span className="rounded-full bg-[#3F4E3F] px-2 py-0.5 text-[10px] font-semibold text-white">
              {row.table}
            </span>
            <span
              className={`text-[11px] font-bold ${
                row.state === "✓" ? "text-[#3F4E3F]" : "text-[#A3A496]"
              }`}
            >
              {row.state}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsChart() {
  const t = useTranslations("LandingFeatures");
  const bars = [22, 40, 30, 48, 63, 54, 78];

  return (
    <>
      <div className="mt-5 rounded-xl bg-[#F6F7F5] p-4">
        <div className="flex items-end justify-between text-[9px] font-semibold uppercase tracking-[0.18em] text-[#5C605A]">
          <span>{t("visits")}</span>
          <span>RSVPs</span>
        </div>
        <div className="mt-3 flex h-20 items-end justify-between gap-3">
          {bars.map((height, index) => (
            <span
              key={index}
              className={`w-4 rounded-sm ${
                index === bars.length - 1 ? "bg-[#3F4E3F]" : "bg-[#657661]"
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[9px] text-[#A3A496]">
          {["S", "T", "Q", "Q", "S", "S", "D"].map((day, index) => (
            <span key={`${day}-${index}`}>{day}</span>
          ))}
        </div>
      </div>
      <p className="mt-3 text-3xl font-semibold text-[#3F4E3F]">
        +38%{" "}
        <span className="text-xs font-normal text-[#5C605A]">{t("updatedNow")}</span>
      </p>
    </>
  );
}

function LanguageList() {
  const languages = [
    { label: "Português", flag: "#3F4E3F" },
    { label: "English", flag: "#6B7E68" },
    { label: "Español", flag: "#9AA795" },
  ];

  return (
    <div className="mt-5 space-y-2">
      {languages.map((language) => (
        <div
          key={language.label}
          className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
        >
          <span className="flex items-center gap-2">
            <span
              className="h-4 w-4 rounded-sm"
              style={{ backgroundColor: language.flag }}
            />
            {language.label}
          </span>
          <span className="text-[#3F4E3F]">✓</span>
        </div>
      ))}
    </div>
  );
}

function CustomizationPanel() {
  const t = useTranslations("LandingProcess");
  const tiles = [
    { src: landingImages.personalisationA, alt: "Casal" },
    { src: landingImages.personalisationB, alt: "Flores" },
    { src: landingImages.personalisationC, alt: "Papelaria" },
  ];

  return (
    <>
      <div className="mt-5 flex gap-2">
        {tiles.map((tile) => (
          <span
            key={tile.src}
            className="relative block h-12 w-12 overflow-hidden rounded-lg"
          >
            <Image
              src={tile.src}
              alt={tile.alt}
              fill
              sizes="48px"
              className="object-cover"
            />
          </span>
        ))}
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#5C605A]">
        {t("palette")}
      </p>
      <div className="mt-2 flex gap-2">
        {["#3F4E3F", "#2D3A2D", "#E8EBE7", "#DEE1DC"].map((color) => (
          <span
            key={color}
            className="h-7 w-7 rounded-lg"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#5C605A]">
        {t("typography")}
      </p>
      <p className="mt-1.5 text-2xl font-semibold text-[#1F2420]">
        Aa <span className="text-base font-normal text-[#5C605A]">Manrope</span>
      </p>
    </>
  );
}
