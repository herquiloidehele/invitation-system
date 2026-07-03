"use client";

// Top-level error boundary. `global-error.tsx` replaces the ROOT layout when an
// error is thrown in the root layout itself, so it must render its own <html>
// and <body>. It is the last line of defence against a fully blank white page:
// any uncaught render/hydration error now shows a branded, actionable fallback
// instead of React tearing the tree down to the bare (white) document.
//
// Keep this file dependency-free and inline-styled — globals.css / Tailwind /
// next-intl context may be exactly what failed, so we cannot rely on them here.

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
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
      </body>
    </html>
  );
}
