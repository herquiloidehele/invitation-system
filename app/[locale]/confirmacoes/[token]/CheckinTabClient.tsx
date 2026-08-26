"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  Check,
  Loader2,
  RotateCcw,
  Search,
  Undo2,
  X,
} from "lucide-react";
import type { CheckInPass, RsvpStatus } from "@/lib/checkin";

interface CheckinTabClientProps {
  ownerToken: string;
  checkinTitle: string;
}

interface CheckinData {
  passes: CheckInPass[];
  totalSubjects: number;
  arrivedSubjects: number;
  arrivedHeadcount: number;
}

type ScanView =
  | { kind: "scanning" }
  | { kind: "loading" }
  | { kind: "result"; pass: CheckInPass }
  | { kind: "notFound" }
  | { kind: "error"; message: string };

const STATUS_META: Record<RsvpStatus, { label: string; className: string }> = {
  confirmed: { label: "Confirmado", className: "bg-green-100 text-green-700" },
  declined: { label: "Recusou", className: "bg-red-100 text-red-700" },
  none: { label: "Sem resposta", className: "bg-stone-100 text-stone-600" },
};

const READER_ID = "owner-checkin-reader";

/**
 * Stop and clear an html5-qrcode instance without throwing. `stop()` throws
 * synchronously when the scanner is not running, so a plain `.catch()` is not
 * enough — wrap it in try/catch inside an async function.
 */
async function safeStopScanner(instance: Html5Qrcode | null): Promise<void> {
  if (!instance) return;
  try {
    await instance.stop();
  } catch {
    // Not running / already stopping — ignore.
  }
  try {
    instance.clear();
  } catch {
    // ignore
  }
}

export default function CheckinTabClient({
  ownerToken,
  checkinTitle,
}: CheckinTabClientProps) {
  const [data, setData] = useState<CheckinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyToken, setBusyToken] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanView, setScanView] = useState<ScanView>({ kind: "scanning" });
  const [arrived, setArrived] = useState(1);
  const instanceRef = useRef<Html5Qrcode | null>(null);
  const base = `/api/owner/${encodeURIComponent(ownerToken)}/checkin`;

  const load = useCallback(async () => {
    try {
      const res = await fetch(base, { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar");
      setData((await res.json()) as CheckinData);
    } catch {
      toast.error("Não foi possível carregar o check-in.");
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  const showPass = useCallback((pass: CheckInPass) => {
    setArrived(pass.arrivedCount ?? pass.partySize);
    setScanView({ kind: "result", pass });
  }, []);

  const resolveToken = useCallback(
    async (decoded: string) => {
      setScanView({ kind: "loading" });
      try {
        const res = await fetch(
          `${base}/resolve?token=${encodeURIComponent(decoded)}`,
          { cache: "no-store" },
        );
        if (res.status === 404) return setScanView({ kind: "notFound" });
        if (!res.ok)
          return setScanView({ kind: "error", message: "Erro de rede" });
        const json = (await res.json()) as { pass: CheckInPass };
        showPass(json.pass);
      } catch {
        setScanView({ kind: "error", message: "Sem ligação" });
      }
    },
    [base, showPass],
  );

  // Camera lifecycle: run only while the scanner is open AND on the scanning step.
  useEffect(() => {
    if (!scannerOpen || scanView.kind !== "scanning") return;
    let stopped = false;
    let instance: Html5Qrcode | null = null;
    (async () => {
      try {
        const { Html5Qrcode: Ctor } = await import("html5-qrcode");
        instance = new Ctor(READER_ID);
        instanceRef.current = instance;
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          (text) => {
            if (stopped) return;
            stopped = true;
            void safeStopScanner(instance);
            resolveToken(text);
          },
          () => {},
        );
      } catch {
        setScanView({ kind: "error", message: "Câmara indisponível" });
      }
    })();
    return () => {
      stopped = true;
      const active = instanceRef.current;
      if (active) {
        void safeStopScanner(active);
        instanceRef.current = null;
      }
    };
  }, [scannerOpen, scanView.kind, resolveToken]);

  function openScanner() {
    setScanView({ kind: "scanning" });
    setScannerOpen(true);
  }

  function closeScanner() {
    setScannerOpen(false);
    setScanView({ kind: "scanning" });
  }

  async function checkIn(pass: CheckInPass, undo: boolean) {
    setBusyToken(pass.token);
    try {
      const res = await fetch(`${base}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          undo
            ? { token: pass.token, undo: true }
            : { token: pass.token, arrivedCount: arrived },
        ),
      });
      if (!res.ok) throw new Error("Falha");
      const json = (await res.json()) as { pass: CheckInPass };
      // If the check-in came from the scanner result card, refresh it in place.
      if (scanView.kind === "result" && scanView.pass.token === pass.token) {
        showPass(json.pass);
      }
      await load();
    } catch {
      toast.error("Não foi possível actualizar a entrada.");
    } finally {
      setBusyToken(null);
    }
  }

  const filteredPasses = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.passes;
    return data.passes.filter((p) => p.name.toLowerCase().includes(q));
  }, [data, query]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-stone-500">
        <Loader2 className="animate-spin" size={18} /> A carregar…
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Scanner */}
      <section className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-stone-800">
              {checkinTitle}
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Lê o QR code do convite para validar a entrada.
            </p>
          </div>
          {scannerOpen ? (
            <button
              type="button"
              onClick={closeScanner}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-sm text-stone-600"
            >
              <X size={15} /> Fechar
            </button>
          ) : (
            <button
              type="button"
              onClick={openScanner}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-stone-800 px-4 text-sm font-medium text-white"
            >
              <Camera size={15} /> Ler QR code
            </button>
          )}
        </div>

        {scannerOpen ? (
          <div className="mt-4">
            {scanView.kind === "scanning" ? (
              <div className="overflow-hidden rounded-xl border bg-black">
                <div id={READER_ID} className="mx-auto w-full max-w-sm" />
              </div>
            ) : null}

            {scanView.kind === "loading" ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border py-12 text-stone-500">
                <Loader2 className="animate-spin" size={18} /> A validar…
              </div>
            ) : null}

            {scanView.kind === "result" ? (
              <ResultCard
                pass={scanView.pass}
                arrived={arrived}
                setArrived={setArrived}
                busy={busyToken === scanView.pass.token}
                onCheckIn={() => checkIn(scanView.pass, false)}
                onUndo={() => checkIn(scanView.pass, true)}
                onScanAgain={() => setScanView({ kind: "scanning" })}
              />
            ) : null}

            {scanView.kind === "notFound" ? (
              <StatusPanel
                tone="error"
                title="QR não reconhecido"
                message="Este código não faz parte deste evento."
                onScanAgain={() => setScanView({ kind: "scanning" })}
              />
            ) : null}

            {scanView.kind === "error" ? (
              <StatusPanel
                tone="warn"
                title="Ocorreu um problema"
                message={scanView.message}
                onScanAgain={() => setScanView({ kind: "scanning" })}
              />
            ) : null}
          </div>
        ) : null}
      </section>

      {/* Progress */}
      <section className="grid grid-cols-2 gap-3 rounded-xl border bg-white p-4 text-center sm:grid-cols-3">
        <Stat label="Convidados" value={data.totalSubjects} />
        <Stat label="Já entraram" value={data.arrivedSubjects} />
        <Stat label="Pessoas na porta" value={data.arrivedHeadcount} />
      </section>

      {/* Searchable list */}
      <section className="rounded-xl border bg-white">
        <div className="border-b p-3">
          <div className="flex items-center gap-2 rounded-lg border px-3">
            <Search size={15} className="text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar por nome"
              className="min-h-10 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>
        <ul className="divide-y">
          {filteredPasses.map((p) => {
            const arrivedIn = p.checkedInAt !== null;
            const time = p.checkedInAt
              ? new Date(p.checkedInAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null;
            return (
              <li
                key={`${p.subjectType}-${p.subjectId}`}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-800">
                    {p.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <StatusBadge status={p.rsvpStatus} />
                    <span className="text-xs text-stone-400">
                      {p.partySize} pax
                    </span>
                    {arrivedIn ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <Check size={12} /> {p.arrivedCount} · {time}
                      </span>
                    ) : null}
                  </div>
                </div>
                {arrivedIn ? (
                  <button
                    type="button"
                    onClick={() => checkIn(p, true)}
                    disabled={busyToken === p.token}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs text-stone-600 disabled:opacity-50"
                  >
                    <Undo2 size={13} /> Anular
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => checkIn(p, false)}
                    disabled={busyToken === p.token}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-stone-800 px-3 text-xs font-medium text-white disabled:opacity-50"
                  >
                    {busyToken === p.token ? (
                      <Loader2 className="animate-spin" size={13} />
                    ) : (
                      <Check size={13} />
                    )}
                    Entrada
                  </button>
                )}
              </li>
            );
          })}
          {filteredPasses.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-stone-400">
              {query.trim()
                ? "Nenhum convidado encontrado."
                : "Ainda não há convidados para validar."}
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-stone-900 tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-stone-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: RsvpStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function ResultCard({
  pass,
  arrived,
  setArrived,
  busy,
  onCheckIn,
  onUndo,
  onScanAgain,
}: {
  pass: CheckInPass;
  arrived: number;
  setArrived: (n: number) => void;
  busy: boolean;
  onCheckIn: () => void;
  onUndo: () => void;
  onScanAgain: () => void;
}) {
  const alreadyIn = pass.checkedInAt !== null;
  const arrivedTime = pass.checkedInAt
    ? new Date(pass.checkedInAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-semibold text-stone-900">{pass.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={pass.rsvpStatus} />
            {pass.tableLabel ? (
              <span className="text-xs text-stone-500">
                Mesa {pass.tableLabel}
              </span>
            ) : null}
          </div>
        </div>
        {alreadyIn ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            Já entrou · {arrivedTime}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setArrived(Math.max(0, arrived - 1))}
          className="size-11 rounded-lg bg-stone-100 text-xl font-bold text-stone-700"
          aria-label="Menos"
        >
          –
        </button>
        <div className="text-center">
          <span className="text-2xl font-bold text-stone-900">{arrived}</span>
          <span className="ml-1 text-sm text-stone-500">
            de {pass.partySize}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setArrived(arrived + 1)}
          className="size-11 rounded-lg bg-stone-100 text-xl font-bold text-stone-700"
          aria-label="Mais"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={onCheckIn}
        disabled={busy}
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-stone-800 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <Check size={16} />
        )}
        {alreadyIn ? "Actualizar contagem" : `Registar entrada (${arrived})`}
      </button>

      <div className="mt-2 flex gap-2">
        {alreadyIn ? (
          <button
            type="button"
            onClick={onUndo}
            disabled={busy}
            className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm text-stone-600 disabled:opacity-50"
          >
            <Undo2 size={15} /> Anular
          </button>
        ) : null}
        <button
          type="button"
          onClick={onScanAgain}
          className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm text-stone-600"
        >
          <RotateCcw size={15} /> Ler outro
        </button>
      </div>
    </div>
  );
}

function StatusPanel({
  tone,
  title,
  message,
  onScanAgain,
}: {
  tone: "error" | "warn";
  title: string;
  message: string;
  onScanAgain: () => void;
}) {
  return (
    <div className="rounded-xl border p-6 text-center">
      <p
        className={`text-lg font-semibold ${
          tone === "error" ? "text-red-600" : "text-amber-700"
        }`}
      >
        {title}
      </p>
      <p className="mt-1 text-sm text-stone-500">{message}</p>
      <button
        type="button"
        onClick={onScanAgain}
        className="mt-4 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-4 text-sm text-stone-700"
      >
        <RotateCcw size={15} /> Voltar a ler
      </button>
    </div>
  );
}
