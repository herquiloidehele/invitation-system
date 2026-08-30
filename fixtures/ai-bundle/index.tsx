import { motion } from "framer-motion";
import {
  invitation,
  useGifts,
  useGuest,
  useLocale,
  useRsvp,
} from "@platform";

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

        <RsvpSection />
      </motion.div>
    </main>
  );
}

function RsvpSection() {
  const rsvp = useRsvp();
  const { fields, values, setValue, errors, status } = rsvp;

  if (status === "closed") {
    return (
      <p data-testid="ai-fixture-rsvp-closed" style={{ marginTop: "2rem" }}>
        RSVP is closed.
      </p>
    );
  }

  if (status === "success") {
    return (
      <p
        data-testid="ai-fixture-rsvp-success"
        style={{ marginTop: "2rem", color: "#9ec8a0" }}
      >
        Thank you — your RSVP is confirmed.
      </p>
    );
  }

  const inputStyle = {
    display: "block",
    width: "100%",
    margin: "0.4rem 0",
    padding: "0.5rem",
    background: "#1c1915",
    color: "#f3ece1",
    border: "1px solid #2a2620",
    borderRadius: "0.25rem",
  } as const;

  return (
    <section data-testid="ai-fixture-rsvp" style={{ marginTop: "2.5rem" }}>
      <h2 style={{ fontSize: "1.5rem" }}>RSVP</h2>

      {status === "already_submitted" ? (
        <p data-testid="ai-fixture-rsvp-already" style={{ opacity: 0.7 }}>
          You have already responded — submit again to update.
        </p>
      ) : null}

      <input
        data-testid="rsvp-name"
        placeholder="Name"
        value={values.name}
        onChange={(e) => setValue("name", e.target.value)}
        style={inputStyle}
      />
      {errors.name ? (
        <p data-testid="rsvp-error-name" style={{ color: "#e2a0a0" }}>
          {errors.name}
        </p>
      ) : null}

      {fields.email ? (
        <input
          data-testid="rsvp-email"
          placeholder="Email"
          value={values.email}
          onChange={(e) => setValue("email", e.target.value)}
          style={inputStyle}
        />
      ) : null}

      <div
        style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
          margin: "0.75rem 0",
        }}
      >
        <button
          type="button"
          data-testid="rsvp-attending-yes"
          onClick={() => setValue("attending", true)}
          style={{
            padding: "0.4rem 1rem",
            borderRadius: "999px",
            border: "1px solid #c8a96a",
            background: values.attending === true ? "#c8a96a" : "transparent",
            color: values.attending === true ? "#12100e" : "#c8a96a",
          }}
        >
          Attending
        </button>
        <button
          type="button"
          data-testid="rsvp-attending-no"
          onClick={() => setValue("attending", false)}
          style={{
            padding: "0.4rem 1rem",
            borderRadius: "999px",
            border: "1px solid #8a8078",
            background: values.attending === false ? "#8a8078" : "transparent",
            color: values.attending === false ? "#12100e" : "#8a8078",
          }}
        >
          Can&apos;t make it
        </button>
      </div>
      {errors.attending ? (
        <p data-testid="rsvp-error-attending" style={{ color: "#e2a0a0" }}>
          {errors.attending}
        </p>
      ) : null}

      <button
        type="button"
        data-testid="rsvp-submit"
        disabled={status === "submitting"}
        onClick={() => rsvp.submit()}
        style={{
          marginTop: "0.75rem",
          padding: "0.5rem 1.5rem",
          borderRadius: "999px",
          border: "none",
          background: "#c8a96a",
          color: "#12100e",
          cursor: "pointer",
        }}
      >
        {status === "submitting" ? "Sending…" : "Send RSVP"}
      </button>

      {status === "error" ? (
        <p data-testid="rsvp-error" style={{ color: "#e2a0a0" }}>
          Something went wrong. Please try again.
        </p>
      ) : null}
    </section>
  );
}

hostRuntime().bundles.register(__FIXTURE_BUNDLE_ID__, FixtureInvitation);
