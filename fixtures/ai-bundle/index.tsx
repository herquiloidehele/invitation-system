import { motion } from "framer-motion";
import { invitation, useGifts, useGuest, useLocale } from "@platform";

import { hostRuntime } from "./runtime";

/** Replaced at build time by esbuild `define`. */
declare const __FIXTURE_BUNDLE_ID__: string;

interface BundleProps {
  coverOpened: boolean;
}

function FixtureInvitation({ coverOpened }: BundleProps) {
  const { guest } = useGuest();
  const { locale, t } = useLocale();
  const gifts = useGifts();

  const couple = (invitation as { couple?: { bride?: string; groom?: string } })
    .couple;

  const heading = t({ pt: "Presentes", en: "Gifts", es: "Regalos" });

  return (
    <main
      data-testid="ai-fixture-bundle"
      style={{
        minHeight: "100vh",
        background: "#12100e",
        color: "#f3ece1",
        fontFamily: "Georgia, serif",
        padding: "3rem 1.5rem",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={coverOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ maxWidth: "34rem", margin: "0 auto", textAlign: "center" }}
      >
        <h1 style={{ fontSize: "2.5rem", fontWeight: 400 }}>
          {couple?.bride ?? "—"} &amp; {couple?.groom ?? "—"}
        </h1>

        <p data-testid="ai-fixture-locale" style={{ opacity: 0.7 }}>
          locale: {locale}
        </p>
        <p data-testid="ai-fixture-guest" style={{ opacity: 0.7 }}>
          guest: {guest?.name ?? "none"}
        </p>

        <h2 style={{ marginTop: "2rem", fontSize: "1.5rem" }}>{heading}</h2>

        {gifts.loading ? (
          <p data-testid="ai-fixture-gifts-loading">loading gifts…</p>
        ) : (
          <ul
            data-testid="ai-fixture-gifts"
            style={{ listStyle: "none", padding: 0 }}
          >
            {gifts.items.map((item) => (
              <li
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  padding: "0.75rem 0",
                  borderBottom: "1px solid #2a2620",
                }}
              >
                <span>{item.name}</span>
                <button
                  type="button"
                  data-testid={`gift-reserve-${item.id}`}
                  disabled={item.status !== "available" || gifts.pending}
                  onClick={() =>
                    gifts.reserve(item.id, guest?.name ?? "Fixture Guest")
                  }
                  style={{
                    background: "transparent",
                    color: "#c8a96a",
                    border: "1px solid #c8a96a",
                    borderRadius: "999px",
                    padding: "0.25rem 0.9rem",
                    cursor: item.status === "available" ? "pointer" : "default",
                  }}
                >
                  {item.status === "available" ? "Reserve" : item.status}
                </button>
              </li>
            ))}
          </ul>
        )}

        {gifts.error ? (
          <p data-testid="ai-fixture-gifts-error" style={{ color: "#e2a0a0" }}>
            error: {gifts.error}
          </p>
        ) : null}
      </motion.div>
    </main>
  );
}

hostRuntime().bundles.register(__FIXTURE_BUNDLE_ID__, FixtureInvitation);
