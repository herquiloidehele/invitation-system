"use client";

export function PhoneIframePreview({
  title,
  src,
  showCaption = true,
  loading,
}: {
  title: string;
  src: string;
  showCaption?: boolean;
  loading?: "eager" | "lazy";
}) {
  return (
    <article className="text-center">
      <div className="relative mx-auto aspect-9/17 w-full max-w-[20rem] rounded-[2rem] border-8 border-primary-hover bg-background shadow-[0_30px_80px_color-mix(in_srgb,var(--foreground)_22%,transparent),inset_0_0_0_1px_rgba(255,255,255,0.06)]">
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-3 z-20 h-3.5 w-16 -translate-x-1/2 rounded-full bg-ink shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
        />
        <div className="absolute inset-0 overflow-hidden rounded-[1.4rem]">
          <iframe
            title={`Pré-visualização do convite ${title}`}
            src={src}
            className="h-full w-full border-0 [scrollbar-width:none]"
            loading={loading}
          />
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
