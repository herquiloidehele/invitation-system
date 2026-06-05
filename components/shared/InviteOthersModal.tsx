"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Check, Copy, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import type { CustomTexts, TemplateTheme } from "@/lib/types";
import { useCustomText } from "@/lib/custom-texts";

function createSchema(t: (key: keyof CustomTexts) => string) {
  return z.object({
    name: z.string().min(1, t("invite_nameRequired")),
    companion: z.string().optional(),
  });
}

type FormValues = { name: string; companion?: string };

interface InviteOthersModalProps {
  open: boolean;
  onClose: () => void;
  inviterToken: string;
  theme: TemplateTheme;
  customTexts?: CustomTexts;
}

export default function InviteOthersModal({
  open,
  onClose,
  inviterToken,
  theme,
  customTexts,
}: InviteOthersModalProps) {
  const t = useCustomText(customTexts);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ name: string; url: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
        copyResetTimeoutRef.current = null;
      }
    };
  }, []);

  const schema = createSchema(t);
  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", companion: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/guests/self-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviterToken,
          name: values.name,
          companion: values.companion?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t("invite_genericError"));
      }
      const data = await res.json();
      setResult({ name: data.guest.name, url: data.personalUrl });
      reset();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("invite_unknownError");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      toast.success(t("invite_linkCopied"));
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
      copyResetTimeoutRef.current = setTimeout(() => {
        copyResetTimeoutRef.current = null;
        setCopied(false);
      }, 2000);
    } catch {
      toast.error(t("invite_copyFailed"));
    }
  }

  function handleClose() {
    setResult(null);
    reset();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={handleClose}
          />

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl border bg-white px-6 py-7"
            style={{ borderColor: "#E5E5E3" }}
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label={t("common_close")}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-600"
            >
              <X className="size-5" />
            </button>

            {!result ? (
              <>
                <h3
                  className="text-xl font-semibold text-stone-800"
                  style={{ fontFamily: theme.displayFont }}
                >
                  {t("invite_modalTitle")}
                </h3>
                <p className="mt-1 text-sm text-stone-500">
                  {t("invite_modalSubtitle")}
                </p>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="mt-5 space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-stone-600">
                      {t("invite_nameLabel")}
                    </label>
                    <input
                      {...register("name")}
                      className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-stone-400"
                      autoFocus
                    />
                    {formState.errors.name && (
                      <p className="text-xs text-red-600">
                        {formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-stone-600">
                      {t("invite_companionLabel")}
                    </label>
                    <input
                      {...register("companion")}
                      className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-stone-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium disabled:opacity-50"
                    style={{
                      background: theme.ctaPrimaryBg,
                      color: theme.ctaPrimaryText,
                      borderRadius: theme.ctaRadius,
                    }}
                  >
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    {t("invite_submitButton")}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check className="size-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-stone-800">
                    {t("invite_successTitle")}
                  </h3>
                </div>
                <p className="mt-3 text-sm text-stone-500">
                  {t("invite_shareLinkPrefix")}{" "}
                  <strong>{result.name}</strong>:
                </p>

                <div className="mt-3 flex gap-2">
                  <input
                    readOnly
                    value={result.url}
                    onClick={(e) =>
                      (e.target as HTMLInputElement).select()
                    }
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    className="shrink-0 rounded-lg border border-stone-200 px-3 py-2 text-xs hover:bg-stone-100"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="mt-5 w-full rounded-full border px-4 py-2.5 text-sm hover:bg-stone-50"
                >
                  {t("invite_addAnother")}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
