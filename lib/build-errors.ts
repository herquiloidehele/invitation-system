/**
 * Turning worker failures into something an operator can act on.
 *
 * The Agent SDK reports fatal problems in two unhelpful shapes: a minified
 * Node stack dumped to stderr, and plain assistant prose ("Credit balance is
 * too low"). Both used to land in the admin chat verbatim.
 */

export type BuildErrorInfo = {
  /** Short, human, actionable. */
  title: string;
  /** What to do about it, when we know. */
  hint?: string;
  /** The original text, for the disclosure. */
  detail?: string;
};

/** A line that is program source or a stack frame rather than a message. */
function isNoiseLine(line: string): boolean {
  if (!line) return true;
  if (/^at\s/.test(line)) return true;
  if (/node_modules|\.mjs:\d+|\.js:\d+:\d+/.test(line)) return true;
  if (/^(Node\.js v|\^+$)/.test(line)) return true;
  // Minified/source-ish: starts with punctuation, or is dense with code symbols.
  if (/^[`;{}()[\]^]/.test(line)) return true;
  const symbols = (line.match(/[{}();=>[\]]/g) ?? []).length;
  if (symbols >= 6) return true;
  return false;
}

/** The first operator-readable line of a stderr chunk, or null if it is noise. */
export function extractStderrMessage(raw: string): string | null {
  const line = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 3 && !isNoiseLine(l))[0];
  if (!line) return null;
  return line.length > 300 ? `${line.slice(0, 300)}…` : line;
}

const PATTERNS: Array<{
  match: RegExp;
  title: string;
  hint?: string;
}> = [
  {
    match: /credit balance|insufficient (credit|funds)|billing/i,
    title: "Sem crédito na conta Anthropic",
    hint: "Recarregue a conta para voltar a gerar convites.",
  },
  {
    match: /not logged in|invalid x-api-key|authentication|unauthorized|401/i,
    title: "Chave de API inválida ou em falta",
    hint: "Verifique ANTHROPIC_API_KEY nas variáveis de ambiente.",
  },
  {
    match: /rate.?limit|429|overloaded|529/i,
    title: "Limite de pedidos atingido",
    hint: "Aguarde um momento e tente novamente.",
  },
  {
    match: /max ?turns|budget|maxBudgetUsd/i,
    title: "O agente atingiu o limite da construção",
    hint: "Peça uma alteração mais pequena, ou aumente o limite.",
  },
  {
    match: /ENOENT|ECONNREFUSED|ETIMEDOUT|network|fetch failed/i,
    title: "Falha de ligação ao executar a construção",
    hint: "Verifique a ligação e tente novamente.",
  },
];

/** Map raw failure text to an explained error. Always returns something. */
export function classifyBuildError(raw: string): BuildErrorInfo {
  const text = (raw ?? "").trim();
  for (const p of PATTERNS) {
    if (p.match.test(text)) {
      return { title: p.title, hint: p.hint, detail: text };
    }
  }
  return { title: "A construção falhou", detail: text || undefined };
}

/**
 * True when assistant prose is actually a fatal SDK message. These arrive as
 * ordinary text, so without this they render as a normal chat reply.
 */
export function isFatalAgentText(text: string): boolean {
  return /credit balance|not logged in|invalid x-api-key|please run \/login/i.test(
    text ?? "",
  );
}
