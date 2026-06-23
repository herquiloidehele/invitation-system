"use client";

/**
 * Flag appended to the embedded invitation URL so it knows it is being shown
 * inside the public landing showcase. The invitation reads this to render the
 * sample personal guest card for display, even when no real guest is attached.
 * Only the iframe URL carries the flag — the "open invite" caption link keeps
 * the clean URL so visitors get the normal, un-flagged experience.
 */
function withLandingPreviewFlag(
  src: string,
  { lazyExternalIframe = false }: { lazyExternalIframe?: boolean } = {},
): string {
  const separator = src.includes("?") ? "&" : "?";
  const externalIframeFlag = lazyExternalIframe ? "&lazyExternalIframe=1" : "";

  return `${src}${separator}landingPreview=1${externalIframeFlag}`;
}

export function PhoneIframePreview({
  title,
  src,
  showCaption = true,
  loading,
  lazyExternalIframe = false,
  staticPreview = false,
  posterSrc = null,
}: {
  title: string;
  src: string;
  showCaption?: boolean;
  loading?: "eager" | "lazy";
  lazyExternalIframe?: boolean;
  /** When true, show a static poster + "open" link instead of a live iframe.
   *  Used on phones / in-app browsers, where booting a full invitation app
   *  inside the iframe can crash the memory-constrained WebView (blank page). */
  staticPreview?: boolean;
  /** Cover image used as the static poster. */
  posterSrc?: string | null;
}) {
  return (
    <article className="text-center">
      <div className="relative mx-auto aspect-9/17 w-full max-w-88 rounded-[2rem] border-8 border-primary-hover bg-background shadow-[0_30px_80px_color-mix(in_srgb,var(--foreground)_22%,transparent),inset_0_0_0_1px_rgba(255,255,255,0.06)]">
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-3 z-20 h-3.5 w-16 -translate-x-1/2 rounded-full bg-ink shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
        />
        <div className="absolute inset-0 overflow-hidden rounded-[1.4rem]">
          {staticPreview ? (
            // Lightweight fallback: a tappable poster that opens the real
            // invitation, instead of a live (memory-heavy) iframe.
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              aria-label={`Abrir o convite ${title}`}
              className="group block h-full w-full"
            >
              {posterSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={posterSrc}
                  alt={`Pré-visualização do convite ${title}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted px-6 text-center text-sm font-medium text-muted-foreground">
                  {title}
                </div>
              )}
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),transparent_30%,transparent_60%,rgba(0,0,0,0.45))]" />
              <span className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                <span className="rounded-full bg-background/90 px-5 py-2 text-sm font-semibold text-foreground shadow-lg backdrop-blur-sm">
                  Toque para abrir →
                </span>
              </span>
            </a>
          ) : (
            <iframe
              title={`Pré-visualização do convite ${title}`}
              src={withLandingPreviewFlag(src, { lazyExternalIframe })}
              className="h-full w-full border-0 [scrollbar-width:none]"
              loading={loading}
            />
          )}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent_24%)]"
          />
        </div>
      </div>
      {showCaption ? (
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="md:hidden mt-4 inline-flex rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4"
        >
          Abrir convite →
        </a>
      ) : null}
    </article>
  );
}
