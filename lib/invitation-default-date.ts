import type { DateInfo } from "@/lib/types";

// pt-PT month/day names, matching how the invitation form pre-formats a picked
// date (see `deriveDateFields` in InvitationForm). Kept here so every "create a
// new invitation" path produces the same default date shape.
const PT_MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const PT_DAYS = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];

/**
 * The default event date for a brand-new invitation: `daysAhead` days from
 * today (30 by default), at UTC midnight — matching how the form stores dates
 * (`T00:00:00.000Z`) and reads them back with UTC getters, which avoids the
 * off-by-one that local-time getters cause. `time` is left blank for the owner
 * to fill in.
 */
export function defaultInvitationDate(daysAhead = 30): DateInfo {
  const now = new Date();
  const d = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysAhead,
    ),
  );
  return {
    iso: d.toISOString(),
    time: "",
    day: String(d.getUTCDate()).padStart(2, "0"),
    month: PT_MONTHS[d.getUTCMonth()],
    year: String(d.getUTCFullYear()),
    dayOfWeek: PT_DAYS[d.getUTCDay()],
    display: `${d.getUTCDate()} de ${PT_MONTHS[d.getUTCMonth()]} de ${d.getUTCFullYear()}`,
  };
}
