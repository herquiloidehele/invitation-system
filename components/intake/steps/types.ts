import type {
  IntakeAnswerKey,
  IntakeAnswers,
  IntakeKind,
} from "@/lib/intake/catalog";

export interface StepProps {
  kind: IntakeKind;
  answers: IntakeAnswers;
  update: <K extends IntakeAnswerKey>(key: K, value: IntakeAnswers[K]) => void;
  /** Translated error for a field path such as "event.primaryName". */
  errorFor: (path: string) => string | undefined;
  customizable: boolean;
}

export interface ContactDraft {
  name: string;
  prefix: string;
  number: string;
}

/** Today's date as "YYYY-MM-DD" in the visitor's time zone. */
export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
