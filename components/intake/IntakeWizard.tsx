"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  CloudOff,
  ExternalLink,
  Loader2,
  Lock,
  MessageCircle,
} from "lucide-react";

import logo from "@/design/logo.jpg";
import { type AppLocale, getDateFormatLocale } from "@/i18n/locales";
import {
  type IntakeAnswerKey,
  type IntakeAnswers,
  type IntakeEventType,
  type IntakeIssue,
  type IntakeKind,
  type IntakeStepId,
  isReadOnlyStatus,
  parseAnswers,
  parseContact,
  stepsFor,
  validateAll,
  validateStep,
} from "@/lib/intake/catalog";
import { joinWhatsapp, splitWhatsapp } from "@/lib/intake/links";
import { buildWhatsappUrl } from "@/lib/landing-whatsapp";
import { cn } from "@/lib/utils";
import {
  apiErrorKey,
  createIntakeRequest,
  saveIntakeRequest,
  submitIntakeRequest,
} from "./intake-api";
import { IntakeReview, stepTitleKey } from "./IntakeReview";
import {
  DetailsStep,
  ExtrasStep,
  GuestGuideStep,
  RsvpStep,
  SaveTheDateDetailsStep,
} from "./steps/DetailSteps";
import {
  ContactStep,
  EventStep,
  LocationsStep,
  ScheduleStep,
} from "./steps/EventSteps";
import type { ContactDraft, StepProps } from "./steps/types";

export interface IntakeWizardDemo {
  slug: string;
  name: string;
  imageUrl: string | null;
  previewHref: string;
  customizable: boolean;
}

export interface IntakeWizardProps {
  mode: "new" | "resume";
  kind: IntakeKind;
  locale: AppLocale;
  demo: IntakeWizardDemo;
  token: string | null;
  reference: string | null;
  initialContact: { name: string; whatsapp: string };
  initialAnswers: IntakeAnswers;
  initialStep: string | null;
  status: string;
  submittedAt: string | null;
  defaultPrefix: string;
  defaultEventType: IntakeEventType;
}

type View = "steps" | "review" | "success";
type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 2500;
const KNOWN_ERROR_CODES = new Set(["required", "invalid", "tooLong", "tooMany"]);

function withDefaults(
  kind: IntakeKind,
  answers: IntakeAnswers,
  defaultEventType: IntakeEventType,
): IntakeAnswers {
  return {
    ...answers,
    event: answers.event ?? { type: defaultEventType },
    rsvp: answers.rsvp ?? { askDietary: true },
    ...(kind === "convite" && !answers.locations?.length
      ? { locations: [{ kind: "religious" as const }] }
      : {}),
  };
}

function issuesToErrors(issues: IntakeIssue[]): Record<string, string> {
  return Object.fromEntries(issues.map((issue) => [issue.field, issue.message]));
}

export function IntakeWizard(props: IntakeWizardProps) {
  const { kind, locale, demo, mode } = props;
  const t = useTranslations("Intake");
  const steps = useMemo(
    () => stepsFor(kind, { customizable: demo.customizable }),
    [kind, demo.customizable],
  );

  const [token, setToken] = useState(props.token);
  const [reference, setReference] = useState(props.reference);
  const [status, setStatus] = useState(props.status);
  const [submittedAt, setSubmittedAt] = useState(props.submittedAt);
  const [contact, setContact] = useState<ContactDraft>(() => {
    const split = splitWhatsapp(props.initialContact.whatsapp);
    return {
      name: props.initialContact.name,
      prefix: split.prefix || props.defaultPrefix,
      number: split.number,
    };
  });
  const [answers, setAnswers] = useState<IntakeAnswers>(() =>
    withDefaults(kind, props.initialAnswers, props.defaultEventType),
  );
  const readOnly = isReadOnlyStatus(status);
  const [view, setView] = useState<View>(() =>
    isReadOnlyStatus(props.status) || props.status === "submitted"
      ? "review"
      : "steps",
  );
  const [stepIndex, setStepIndex] = useState(() => {
    if (mode === "new") return 0;
    // An admin-created link opened for the first time has no lastStep: start
    // on the (prefilled) contact step so the customer confirms their details.
    const saved = steps.findIndex((step) => step.id === props.initialStep);
    return saved >= 0 ? saved : 0;
  });
  const [showWelcome, setShowWelcome] = useState(
    () =>
      mode === "resume" &&
      props.status === "draft" &&
      !!props.initialStep &&
      !!props.initialContact.name,
  );
  const [returnToReview, setReturnToReview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [busy, setBusy] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [changeTick, setChangeTick] = useState(0);

  // Refs read by the (serialized) save queue, so a save always sends the
  // latest values even when it was scheduled several renders ago.
  const tokenRef = useRef(token);
  const answersRef = useRef(answers);
  const contactRef = useRef(contact);
  const readOnlyRef = useRef(readOnly);
  const dirtyKeys = useRef(new Set<IntakeAnswerKey>());
  const contactDirty = useRef(false);
  const saveChain = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    tokenRef.current = token;
    answersRef.current = answers;
    contactRef.current = contact;
    readOnlyRef.current = readOnly;
  }, [token, answers, contact, readOnly]);

  const contactValue = useCallback(
    (draft: ContactDraft) => ({
      name: draft.name,
      // A bare prefix is "no number yet" (→ "required"), not an invalid one.
      whatsapp: draft.number.trim() ? joinWhatsapp(draft.prefix, draft.number) : "",
    }),
    [],
  );

  const runSave = useCallback(
    async (options: {
      keys?: IntakeAnswerKey[];
      lastStep?: IntakeStepId;
      keepalive?: boolean;
    }): Promise<boolean> => {
      const currentToken = tokenRef.current;
      if (!currentToken || readOnlyRef.current) return true;

      const keys = new Set([...dirtyKeys.current, ...(options.keys ?? [])]);
      dirtyKeys.current.clear();

      // Send only values that pass lenient validation; a half-typed link stays
      // dirty and is retried once it is valid (or caught on "Continuar").
      const sendAnswers: Record<string, unknown> = {};
      for (const key of keys) {
        const value = answersRef.current[key];
        if (value === undefined) continue;
        if (parseAnswers({ [key]: value }, "lenient").ok) sendAnswers[key] = value;
        else dirtyKeys.current.add(key);
      }

      let sendContact: { name: string; whatsapp: string } | undefined;
      if (contactDirty.current) {
        const value = contactValue(contactRef.current);
        if (parseContact(value, "lenient").ok) {
          sendContact = value;
          contactDirty.current = false;
        }
      }

      if (!Object.keys(sendAnswers).length && !sendContact && !options.lastStep) {
        return true;
      }

      setSaveState("saving");
      const result = await saveIntakeRequest(
        currentToken,
        {
          ...(Object.keys(sendAnswers).length ? { answers: sendAnswers } : {}),
          ...(sendContact ? { contact: sendContact } : {}),
          ...(options.lastStep ? { lastStep: options.lastStep } : {}),
        },
        { keepalive: options.keepalive },
      );

      if (!result.ok) {
        for (const key of Object.keys(sendAnswers)) {
          dirtyKeys.current.add(key as IntakeAnswerKey);
        }
        if (sendContact) contactDirty.current = true;
        if (result.status === 409) setStatus("in_production");
        setSaveState("error");
        return false;
      }
      setSaveState("saved");
      return true;
    },
    [contactValue],
  );

  /** Saves run one after another so an older request never overwrites a newer one. */
  const save = useCallback(
    (options: Parameters<typeof runSave>[0] = {}) => {
      const run = saveChain.current.then(() => runSave(options));
      saveChain.current = run.catch(() => undefined);
      return run;
    },
    [runSave],
  );

  // Debounced autosave after edits.
  useEffect(() => {
    if (!changeTick) return;
    const timer = window.setTimeout(() => void save(), AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [changeTick, save]);

  // Flush when the tab is hidden (app switch, closing the browser).
  useEffect(() => {
    function onHide() {
      if (document.visibilityState === "hidden") void save({ keepalive: true });
    }
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [save]);

  const update = useCallback<StepProps["update"]>((key, value) => {
    setAnswers((previous) => ({ ...previous, [key]: value }));
    dirtyKeys.current.add(key);
    setErrors((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(
          ([field]) => field !== key && !field.startsWith(`${key}.`),
        ),
      ),
    );
    setShowWelcome(false);
    setChangeTick((tick) => tick + 1);
  }, []);

  const updateContact = useCallback((next: ContactDraft) => {
    setContact(next);
    contactDirty.current = true;
    setErrors((previous) => {
      const rest = { ...previous };
      delete rest.name;
      delete rest.whatsapp;
      return rest;
    });
    setChangeTick((tick) => tick + 1);
  }, []);

  const errorFor = useCallback(
    (path: string) => {
      const code = errors[path];
      if (!code) return undefined;
      return t(`errors.${KNOWN_ERROR_CODES.has(code) ? code : "invalid"}`);
    },
    [errors, t],
  );

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function focusFirstError() {
    window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(
        '[aria-invalid="true"], [role="alert"]',
      );
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
      if (target?.matches("input, textarea, select")) {
        target.focus({ preventScroll: true });
      }
    });
  }

  function showIssues(issues: IntakeIssue[]) {
    setErrors(issuesToErrors(issues));
    setBanner("errors.fixStep");
    focusFirstError();
  }

  const step = steps[stepIndex];
  const validationContact = contactValue(contact);

  async function goNext() {
    const issues = validateStep(kind, step.id, validationContact, answers, {
      customizable: demo.customizable,
    });
    if (issues.length) return showIssues(issues);
    setErrors({});
    setBanner(null);
    setShowWelcome(false);

    if (step.id === "contact" && !tokenRef.current) {
      setBusy(true);
      const result = await createIntakeRequest({
        productKind: kind,
        demoSlug: demo.slug,
        locale,
        contactName: validationContact.name,
        contactWhatsapp: validationContact.whatsapp,
        website: honeypot,
      });
      setBusy(false);
      if (!result.ok) {
        const issues = result.body.issues;
        if (result.status === 400 && Array.isArray(issues)) {
          return showIssues(issues as IntakeIssue[]);
        }
        setBanner(apiErrorKey(result.error, result.status));
        return;
      }
      tokenRef.current = result.data.token;
      setToken(result.data.token);
      setReference(result.data.reference);
      contactDirty.current = false;
      window.history.replaceState(null, "", result.data.path);
    }

    const next = steps[stepIndex + 1];
    void save({ keys: step.keys, lastStep: next?.id ?? step.id });

    if (returnToReview || !next) {
      setReturnToReview(false);
      setView("review");
    } else {
      setStepIndex(stepIndex + 1);
    }
    scrollToTop();
  }

  function goBack() {
    setErrors({});
    setBanner(null);
    if (view === "review") {
      setView("steps");
      setStepIndex(steps.length - 1);
    } else if (stepIndex > 0) {
      void save({ lastStep: steps[stepIndex - 1].id });
      setStepIndex(stepIndex - 1);
    }
    scrollToTop();
  }

  function editStep(stepId: IntakeStepId) {
    const index = steps.findIndex((item) => item.id === stepId);
    if (index < 0) return;
    setStepIndex(index);
    setReturnToReview(true);
    setView("steps");
    setBanner(null);
    scrollToTop();
  }

  async function submit() {
    const result = validateAll(kind, validationContact, answers, {
      customizable: demo.customizable,
    });
    if (!result.ok) {
      editStep(result.step);
      showIssues(result.issues);
      return;
    }
    const currentToken = tokenRef.current;
    if (!currentToken) return;

    setBusy(true);
    setBanner(null);
    // Every step was saved on "Continuar"; only pending edits remain.
    const saved = await save();
    if (!saved) {
      setBusy(false);
      setBanner("errors.network");
      return;
    }
    const response = await submitIntakeRequest(currentToken);
    setBusy(false);
    if (!response.ok) {
      const issues = response.body.issues;
      if (response.status === 422 && typeof response.body.step === "string") {
        editStep(response.body.step as IntakeStepId);
        if (Array.isArray(issues)) showIssues(issues as IntakeIssue[]);
        return;
      }
      if (response.status === 409) setStatus("in_production");
      setBanner(apiErrorKey(response.error, response.status));
      return;
    }
    setStatus("submitted");
    setSubmittedAt(response.data.submittedAt);
    setView("success");
    scrollToTop();
  }

  const stepProps: StepProps = {
    kind,
    answers,
    update,
    errorFor,
    customizable: demo.customizable,
  };

  const studioMessage = t("success.whatsappMessage", {
    model: demo.name,
    ref: reference ?? "",
  });
  const studioWhatsappHref = buildWhatsappUrl(studioMessage);
  const progress =
    view === "steps" ? (stepIndex + 1) / steps.length : 1;

  return (
    <main className="min-h-dvh bg-surface-warm font-[var(--font-outfit)] text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2">
            <Image
              src={logo}
              alt=""
              width={28}
              height={28}
              priority
              className="rounded-full outline outline-1 -outline-offset-1 outline-black/10"
            />
            <span className="text-[15px] font-semibold tracking-[-0.04em]">
              brindeal
            </span>
          </div>
          <SaveIndicator state={saveState} t={t} />
        </div>
        <div className="h-1 bg-muted-strong/60">
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 pb-36 pt-5">
        <DemoCard demo={demo} kind={kind} t={t} />

        {view === "success" ? (
          <SuccessView
            t={t}
            demoName={demo.name}
            whatsappHref={studioWhatsappHref}
            onReview={() => {
              setView("review");
              scrollToTop();
            }}
          />
        ) : view === "review" ? (
          <section className="mt-6 space-y-4">
            <div>
              <h1 className="text-[1.6rem] font-medium leading-tight tracking-[-0.02em]">
                {t("review.title")}
              </h1>
              {status === "draft" ? (
                <p className="mt-1 text-[15px] text-muted-foreground">
                  {t("review.description")}
                </p>
              ) : null}
            </div>
            {readOnly ? (
              <Notice icon={<Lock className="size-4" />} tone="neutral">
                {t("review.readOnlyBanner")}
              </Notice>
            ) : status === "submitted" && submittedAt ? (
              <Notice icon={<CheckCircle2 className="size-4" />} tone="success">
                {t("review.submittedBanner", {
                  date: new Intl.DateTimeFormat(getDateFormatLocale(locale), {
                    day: "numeric",
                    month: "long",
                  }).format(new Date(submittedAt)),
                })}
              </Notice>
            ) : null}
            {banner ? <Notice tone="error">{t(banner)}</Notice> : null}
            <IntakeReview
              kind={kind}
              steps={steps}
              answers={answers}
              contact={{
                name: contact.name,
                whatsapp: contact.number
                  ? `${contact.prefix} ${contact.number}`
                  : "",
              }}
              locale={locale}
              onEdit={readOnly ? undefined : editStep}
            />
          </section>
        ) : (
          <section className="mt-6 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brindel-brown)]">
                {t("stepCounter", {
                  current: stepIndex + 1,
                  total: steps.length,
                })}
              </p>
              <h1 className="mt-1.5 text-[1.6rem] font-medium leading-tight tracking-[-0.02em]">
                {t(`${stepTitleKey(kind, step.id)}.title`)}
              </h1>
              <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
                {t(`${stepTitleKey(kind, step.id)}.description`)}
              </p>
            </div>
            {showWelcome && stepIndex > 0 ? (
              <Notice tone="success">
                {t("welcomeBack", { name: contact.name.split(" ")[0] })}
              </Notice>
            ) : null}
            {banner ? <Notice tone="error">{t(banner)}</Notice> : null}
            <StepBody
              stepId={step.id}
              kind={kind}
              stepProps={stepProps}
              contact={contact}
              onContact={updateContact}
              honeypot={mode === "new" && !token ? honeypot : undefined}
              onHoneypot={mode === "new" && !token ? setHoneypot : undefined}
            />
          </section>
        )}
      </div>

      {view !== "success" ? (
        <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto flex max-w-xl gap-3 px-4">
            {readOnly ? (
              <a
                href={studioWhatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-[15px] font-semibold text-background"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                {t("review.talkOnWhatsapp")}
              </a>
            ) : (
              <>
                {(view === "steps" && stepIndex > 0) || view === "review" ? (
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={busy}
                    className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full border border-border bg-white px-5 text-[15px] font-medium text-foreground transition-colors hover:bg-surface-warm disabled:opacity-50"
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {t("back")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={view === "review" ? submit : goNext}
                  disabled={busy}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_26px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition-[transform,background-color] hover:bg-primary-hover active:scale-[0.98] disabled:opacity-60"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {busy
                    ? t("sending")
                    : view === "review"
                      ? status === "submitted"
                        ? t("saveChanges")
                        : t("submit")
                      : returnToReview || stepIndex === steps.length - 1
                        ? t("toReview")
                        : t("continue")}
                </button>
              </>
            )}
          </div>
        </footer>
      ) : null}
    </main>
  );
}

type Translate = ReturnType<typeof useTranslations<"Intake">>;

function StepBody({
  stepId,
  kind,
  stepProps,
  contact,
  onContact,
  honeypot,
  onHoneypot,
}: {
  stepId: IntakeStepId;
  kind: IntakeKind;
  stepProps: StepProps;
  contact: ContactDraft;
  onContact: (contact: ContactDraft) => void;
  honeypot?: string;
  onHoneypot?: (value: string) => void;
}) {
  switch (stepId) {
    case "contact":
      return (
        <ContactStep
          contact={contact}
          onChange={onContact}
          errorFor={stepProps.errorFor}
          honeypot={honeypot}
          onHoneypot={onHoneypot}
        />
      );
    case "event":
      return <EventStep {...stepProps} />;
    case "locations":
      return <LocationsStep {...stepProps} />;
    case "schedule":
      return <ScheduleStep {...stepProps} />;
    case "details":
      return kind === "save-the-date" ? (
        <SaveTheDateDetailsStep {...stepProps} />
      ) : (
        <DetailsStep {...stepProps} />
      );
    case "guestGuide":
      return <GuestGuideStep {...stepProps} />;
    case "rsvp":
      return <RsvpStep {...stepProps} />;
    case "extras":
      return <ExtrasStep {...stepProps} />;
  }
}

function SaveIndicator({ state, t }: { state: SaveState; t: Translate }) {
  if (state === "idle") return null;
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        state === "error" ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {state === "saving" ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : state === "saved" ? (
        <Check className="size-3.5" aria-hidden="true" />
      ) : (
        <CloudOff className="size-3.5" aria-hidden="true" />
      )}
      {state === "saving" ? t("saving") : state === "saved" ? t("saved") : t("saveError")}
    </span>
  );
}

function DemoCard({
  demo,
  kind,
  t,
}: {
  demo: IntakeWizardDemo;
  kind: IntakeKind;
  t: Translate;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
        {demo.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote S3 thumbnails; the image loader is not configured for every bucket.
          <img src={demo.imageUrl} alt="" className="size-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brindel-brown)]">
          {kind === "save-the-date" ? t("eyebrowSaveTheDate") : t("eyebrowInvitation")}
        </p>
        <p className="truncate text-[15px] font-medium">{demo.name}</p>
      </div>
      <a
        href={demo.previewHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-primary-deep hover:bg-primary-soft"
      >
        {t("viewModel")}
        <ExternalLink className="size-3.5" aria-hidden="true" />
      </a>
    </div>
  );
}

function Notice({
  children,
  tone,
  icon,
}: {
  children: ReactNode;
  tone: "success" | "error" | "neutral";
  icon?: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm leading-snug",
        tone === "success" && "bg-primary-soft text-primary-deep",
        tone === "error" && "bg-destructive/10 text-destructive",
        tone === "neutral" && "bg-white text-foreground shadow-[inset_0_0_0_1px_var(--border)]",
      )}
    >
      <span className="mt-0.5 shrink-0">
        {icon ?? (tone === "error" ? <AlertCircle className="size-4" /> : <CheckCircle2 className="size-4" />)}
      </span>
      <span>{children}</span>
    </div>
  );
}

function SuccessView({
  t,
  demoName,
  whatsappHref,
  onReview,
}: {
  t: Translate;
  demoName: string;
  whatsappHref: string;
  onReview: () => void;
}) {
  return (
    <section className="mt-10 flex flex-col items-center text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary-deep">
        <CheckCircle2 className="size-8" aria-hidden="true" />
      </div>
      <h1 className="mt-5 text-[1.75rem] font-medium leading-tight tracking-[-0.02em]">
        {t("success.title")}
      </h1>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
        {t("success.body", { model: demoName })}
      </p>
      <div className="mt-8 grid w-full max-w-sm gap-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-[15px] font-semibold text-background"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {t("success.whatsappCta")}
        </a>
        <button
          type="button"
          onClick={onReview}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white px-6 text-[15px] font-medium text-foreground hover:bg-surface-warm"
        >
          {t("success.editAnswers")}
        </button>
      </div>
    </section>
  );
}
