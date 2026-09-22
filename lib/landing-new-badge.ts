/** How long a model stays "Novo" when the admin flags it without picking a date. */
export const DEFAULT_NEW_BADGE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** A landing feature shows the "Novo" badge while `newUntil` is in the future. */
export function isLandingFeatureNew(
  newUntil: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!newUntil) return false;
  const until = newUntil instanceof Date ? newUntil : new Date(newUntil);
  const time = until.getTime();
  return Number.isFinite(time) && time > now.getTime();
}

export function defaultNewUntil(now: Date = new Date()): Date {
  return new Date(now.getTime() + DEFAULT_NEW_BADGE_DAYS * DAY_MS);
}

/**
 * Validates the `newUntil` field of an admin request body. `undefined` means
 * the field was not sent, `null` clears the badge, and a string must be a
 * parseable date.
 */
export function parseNewUntilInput(
  value: unknown,
): { ok: true; value: Date | null | undefined } | { ok: false } {
  if (value === undefined) return { ok: true, value: undefined };
  if (value === null) return { ok: true, value: null };
  if (typeof value !== "string" || value.trim() === "") return { ok: false };
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return { ok: false };
  return { ok: true, value: date };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** ISO timestamp → `YYYY-MM-DD` in the admin's local timezone, for `<input type="date">`. */
export function toNewUntilDateInput(newUntil: string | null): string {
  if (!newUntil) return "";
  const date = new Date(newUntil);
  if (!Number.isFinite(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `YYYY-MM-DD` → ISO timestamp at the end of that local day, so the badge lasts the whole day. */
export function fromNewUntilDateInput(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day, 23, 59, 59, 999);
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date.toISOString();
}
