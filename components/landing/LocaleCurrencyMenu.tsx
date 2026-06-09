"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

import {
  buildLocaleHref,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@/i18n/locales";
import {
  CURRENCY_COOKIE,
  CURRENCY_SYMBOL,
  formatSelectorTrigger,
  SUPPORTED_CURRENCIES,
  type Currency,
} from "@/lib/currency/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

// Module scope so the cookie write isn't re-created each render — keeps the
// react-hooks lint happy.
function persistCurrency(next: Currency) {
  document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

const rowBase =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition";
const rowActive = "bg-muted font-semibold text-foreground";
const rowIdle = "text-muted-foreground hover:bg-muted hover:text-foreground";
const dotBase = "h-2.5 w-2.5 flex-none rounded-full border-2";

export function LocaleCurrencyMenu({
  currentCurrency,
}: {
  currentCurrency: Currency;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as AppLocale;
  const t = useTranslations("LocaleCurrencyMenu");
  const langT = useTranslations("Locale");
  const reduceMotion = useReducedMotion();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside pointerdown and on Escape (Escape restores trigger focus).
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Move focus to the active row when the panel opens.
  useEffect(() => {
    if (open) {
      panelRef.current
        ?.querySelector<HTMLElement>('[aria-current="true"]')
        ?.focus();
    }
  }, [open]);

  function chooseCurrency(next: Currency) {
    persistCurrency(next);
    router.refresh(); // refresh prices in place; panel stays open
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="locale-currency-panel"
        aria-label={t("menuAriaLabel")}
        className="flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4"
      >
        {formatSelectorTrigger(locale, currentCurrency)}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M1 3l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id="locale-currency-panel"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 origin-top-right rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-xl"
          >
            <p className="px-2 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
              {t("language")}
            </p>
            {SUPPORTED_LOCALES.map((code) => {
              const active = locale === code;
              return (
                <a
                  key={code}
                  href={buildLocaleHref(pathname, code)}
                  aria-current={active ? "true" : undefined}
                  className={`${rowBase} ${active ? rowActive : rowIdle}`}
                >
                  <span
                    className={`${dotBase} ${active ? "border-primary bg-primary" : "border-muted-foreground/40"}`}
                  />
                  {langT(code)}
                </a>
              );
            })}

            <div className="my-1.5 h-px bg-border" />

            <p className="px-2 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
              {t("currency")}
            </p>
            {SUPPORTED_CURRENCIES.map((code) => {
              const active = currentCurrency === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => chooseCurrency(code)}
                  aria-current={active ? "true" : undefined}
                  className={`${rowBase} ${active ? rowActive : rowIdle}`}
                >
                  <span
                    className={`${dotBase} ${active ? "border-primary bg-primary" : "border-muted-foreground/40"}`}
                  />
                  {t(`currencyNames.${code}`)}
                  <span className="ml-auto text-xs text-muted-foreground/70">
                    {CURRENCY_SYMBOL[code]}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
