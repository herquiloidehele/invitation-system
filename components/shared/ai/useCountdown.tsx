"use client";

import { useEffect, useState } from "react";

import { computeCountdownTimeLeft } from "@/lib/countdown";
import type { CountdownApi } from "@/lib/ai-secondary-types";

/**
 * Live countdown to an ISO datetime, re-computed each second. `time` is an
 * optional "HH:MM" override; when omitted the ISO's own time is used.
 *
 * `Date.now()` is read only in the lazy state initializer (once) and the
 * interval's timer callback — never in the render body — so the hook stays
 * render-pure with no synchronous setState in the effect.
 */
export function useCountdown(iso: string, time?: string): CountdownApi {
  const [left, setLeft] = useState(() =>
    computeCountdownTimeLeft(iso, time, Date.now()),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setLeft(computeCountdownTimeLeft(iso, time, Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [iso, time]);

  return {
    days: left.days,
    hours: left.hours,
    minutes: left.minutes,
    seconds: left.seconds,
    done: left.passed,
  };
}
