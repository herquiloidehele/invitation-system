import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./locales";

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "as-needed",
  localeDetection: false,
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
