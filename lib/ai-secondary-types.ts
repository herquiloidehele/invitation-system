/** What `useCountdown(iso)` returns. `done` is true once the date has passed. */
export interface CountdownApi {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

/** What `useCalendar()` returns. */
export interface CalendarApi {
  googleUrl: string;
}

/** What `useEntryPass()` returns. `value` is the QR payload URL, or null. */
export interface EntryPassApi {
  value: string | null;
  token: string | null;
  ready: boolean;
}
