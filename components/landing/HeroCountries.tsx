"use client";

import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";

import AO from "country-flag-icons/react/3x2/AO";
import BR from "country-flag-icons/react/3x2/BR";
import ES from "country-flag-icons/react/3x2/ES";
import MZ from "country-flag-icons/react/3x2/MZ";
import PT from "country-flag-icons/react/3x2/PT";
import US from "country-flag-icons/react/3x2/US";

import {
  SERVED_COUNTRY_CODES,
  type ServedCountryCode,
} from "@/lib/landing-countries";
import { landingItemVariants } from "./landing-motion";

// country-flag-icons types each flag as `FlagComponent` (props extend
// React.HTMLAttributes), which is not assignable to React's SVGProps — so we
// key the map by the library's own component type via `typeof PT`.
const FLAGS: Record<ServedCountryCode, typeof PT> = {
  PT,
  ES,
  BR,
  AO,
  MZ,
  US,
};

// Flags-only strip: no visible country names, so each flag carries its name via
// aria-label + a hover title. Each flag sits in a small rounded "card" (clipped
// corners, hairline ring, soft shadow) that lifts slightly on hover.
const CHIP =
  "inline-flex h-4 w-6 shrink-0 overflow-hidden rounded-[5px] ring-1 ring-black/10 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md";

export function HeroCountries() {
  const t = useTranslations("Landing");

  return (
    <motion.div
      variants={landingItemVariants}
      role="group"
      aria-label={t("heroCountriesLabel")}
      className="mt-8 flex flex-wrap items-center gap-2"
    >
      <span
        aria-hidden="true"
        className="text-sm font-medium text-muted-foreground"
      >
        {t("heroCountriesLabel")}:
      </span>
      {SERVED_COUNTRY_CODES.map((code) => {
        const Flag = FLAGS[code];
        const name = t(`countries.${code}`);
        return (
          <span key={code} title={name} className={CHIP}>
            <Flag
              role="img"
              aria-label={name}
              className="block h-full w-full"
            />
          </span>
        );
      })}
      <span
        title={t("heroCountriesMore")}
        className={`${CHIP} items-center justify-center bg-primary/10 text-primary ring-primary/20 hover:bg-primary/15`}
      >
        <Globe
          role="img"
          aria-label={t("heroCountriesMore")}
          className="h-2.5 w-2.5"
        />
      </span>
    </motion.div>
  );
}
