"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Check, Copy, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import type { TemplateTheme } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  companion: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface InviteOthersModalProps {
  open: boolean;
  onClose: () => void;
  inviterToken: string;
  theme: TemplateTheme;
}

export default function InviteOthersModal({
  open,
  onClose,
  inviterToken,
  theme,
}: InviteOthersModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ name: string; url: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

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
        throw new Error(err.error || "Falha ao registar convidado");
      }
      const data = await res.json();
      setResult({ name: data.guest.name, url: data.personalUrl });
      reset();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
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
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
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
              aria-label="Fechar"
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
                  Convidar mais pessoas
                </h3>
                <p className="mt-1 text-sm text-stone-500">
                  Adiciona o nome dos convidados extra. Receberás um link
                  pessoal para partilhar com cada um.
                </p>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="mt-5 space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-stone-600">
                      Nome *
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
                      Acompanhante
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
                    Adicionar convidado
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
                    Convidado adicionado!
                  </h3>
                </div>
                <p className="mt-3 text-sm text-stone-500">
                  Partilha este link pessoal com{" "}
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
                  Adicionar outro convidado
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
