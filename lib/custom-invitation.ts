import {
  CURRENCY_LOCALE,
  deriveCents,
  type Currency,
} from "@/lib/currency/config";
import { formatCurrencyAmount } from "@/lib/landing-price";

export const CUSTOM_INVITATION_PRICE_EUR_CENTS = 25_000;

export function getCustomInvitationPrice(currency: Currency): string {
  const convertedCents = deriveCents(
    CUSTOM_INVITATION_PRICE_EUR_CENTS,
    currency,
  );

  return formatCurrencyAmount(
    convertedCents,
    currency,
    CURRENCY_LOCALE[currency],
  );
}
