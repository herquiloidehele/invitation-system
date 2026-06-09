"use client";

import { useRouter } from "next/navigation";

import {
  CURRENCY_COOKIE,
  SUPPORTED_CURRENCIES,
  type Currency,
} from "@/lib/currency/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function CurrencySwitcher({ current }: { current: Currency }) {
  const router = useRouter();

  function choose(next: Currency) {
    document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-background/80 p-1 text-xs font-semibold text-muted-foreground">
      {SUPPORTED_CURRENCIES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => choose(code)}
          aria-current={current === code ? "true" : undefined}
          className={`rounded-full px-2 py-1 transition sm:px-2.5 ${
            current === code
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted hover:text-foreground"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
