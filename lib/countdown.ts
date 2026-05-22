export interface CountdownTimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  passed: boolean;
}

const ZERO_TIME_LEFT: CountdownTimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  passed: false,
};

export function computeCountdownTimeLeft(
  isoDate: string | undefined,
  timeStr: string | undefined,
  nowMs = Date.now(),
): CountdownTimeLeft {
  const datePart = isoDate?.split("T")[0] ?? "";
  const time = timeStr || "00:00";
  const [hour, minute] = time.split(":").map(Number);
  const [year, month, day] = datePart.split("-").map(Number);

  if (
    !datePart ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return ZERO_TIME_LEFT;
  }

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const lisbonFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = lisbonFormatter.formatToParts(new Date(utcGuess));
  const get = (type: string) =>
    parseInt(parts.find((part) => part.type === type)?.value ?? "0", 10);

  const lisbonFromUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  const targetMs = utcGuess - (lisbonFromUtc - utcGuess);
  const diff = targetMs - nowMs;

  if (diff <= 0) {
    return { ...ZERO_TIME_LEFT, passed: diff < -86400000 };
  }

  const totalSeconds = Math.floor(diff / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    passed: false,
  };
}

export function formatCountdownValue(value: number): string {
  return String(value).padStart(2, "0");
}
