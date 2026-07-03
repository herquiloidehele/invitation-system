"use client";

// Segment-level error boundary for every public page (landing, invitation
// viewer, RSVP, confirmations). It catches render/hydration errors thrown
// anywhere in this segment's client tree — e.g. a runtime exception while
// hydrating InvitationView on an old in-app WebView — and renders a branded,
// actionable fallback instead of letting React unmount to a blank white screen.
//
// Intentionally dependency-free + inline-styled: an error boundary must not
// rely on the same context (next-intl, theme, etc.) that may have just failed.

export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#faf7f2",
        color: "#3a3a3a",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        textAlign: "center",
        lineHeight: 1.5,
      }}
    >
      <div style={{ maxWidth: 340 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>💌</div>
        <div style={{ fontSize: 19, fontWeight: 600, marginBottom: 10 }}>
          Não foi possível abrir o convite
        </div>
        <p style={{ fontSize: 15, opacity: 0.85, margin: "0 0 20px" }}>
          Tente recarregar a página. Se estiver dentro do Instagram, toque no
          menu <b>•••</b> e escolha <b>“Abrir no navegador”</b> (Safari/Chrome).
        </p>
        <button
          onClick={() => reset()}
          style={{
            appearance: "none",
            border: "none",
            borderRadius: 999,
            padding: "12px 28px",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            background: "#3a3a3a",
            color: "#faf7f2",
          }}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
