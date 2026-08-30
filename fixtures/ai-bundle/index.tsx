import { motion } from "framer-motion";

import { hostRuntime } from "./runtime";

/** Replaced at build time by esbuild `define`. */
declare const __FIXTURE_BUNDLE_ID__: string;

interface AssetManifest {
  hero: string | null;
  gallery: string[];
  sections: Record<string, string>;
}

interface BundleProps {
  invitation: Record<string, never>;
  guest: { name?: string } | null;
  locale: string;
  assets: AssetManifest;
  coverOpened: boolean;
}

function FixtureInvitation({
  invitation,
  guest,
  locale,
  assets,
  coverOpened,
}: BundleProps) {
  const couple = invitation.couple as unknown as
    | { bride?: string; groom?: string }
    | undefined;

  return (
    <main
      data-testid="ai-fixture-bundle"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
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
        style={{ textAlign: "center", maxWidth: "34rem" }}
      >
        {assets.hero ? (
          <img
            src={assets.hero}
            alt=""
            style={{
              width: "100%",
              borderRadius: "0.25rem",
              marginBottom: "2rem",
            }}
          />
        ) : null}

        <h1 style={{ fontSize: "2.5rem", fontWeight: 400, letterSpacing: "0.02em" }}>
          {couple?.bride ?? "—"} &amp; {couple?.groom ?? "—"}
        </h1>

        <p data-testid="ai-fixture-locale" style={{ opacity: 0.7 }}>
          locale: {locale}
        </p>

        <p data-testid="ai-fixture-guest" style={{ opacity: 0.7 }}>
          guest: {guest?.name ?? "none"}
        </p>

        <p data-testid="ai-fixture-gallery" style={{ opacity: 0.7 }}>
          gallery images: {assets.gallery.length}
        </p>
      </motion.div>
    </main>
  );
}

hostRuntime().bundles.register(__FIXTURE_BUNDLE_ID__, FixtureInvitation);
