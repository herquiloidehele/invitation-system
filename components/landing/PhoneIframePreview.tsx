"use client";

export function PhoneIframePreview({
  title,
  src,
  showCaption = true,
}: {
  title: string;
  src: string;
  showCaption?: boolean;
}) {
  function hideScrollbar(event: React.SyntheticEvent<HTMLIFrameElement>) {
    const iframeDocument = event.currentTarget.contentDocument;

    if (!iframeDocument) return;

    iframeDocument.documentElement.style.scrollbarWidth = "none";
    iframeDocument.body.style.scrollbarWidth = "none";
    (
      iframeDocument.body.style as CSSStyleDeclaration & {
        msOverflowStyle?: string;
      }
    ).msOverflowStyle = "none";

    if (!iframeDocument.getElementById("brindeal-hide-scrollbar")) {
      const style = iframeDocument.createElement("style");
      style.id = "brindeal-hide-scrollbar";
      style.textContent = "::-webkit-scrollbar{display:none}";
      iframeDocument.head.appendChild(style);
    }
  }

  return (
    <article className="text-center">
      <div className="relative mx-auto aspect-9/17 w-full max-w-[20rem] rounded-[2rem] border-8 border-[#2D3A2D] bg-white shadow-[0_30px_80px_rgba(31,36,32,0.22),inset_0_0_0_1px_rgba(255,255,255,0.06)]">
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-3 z-20 h-3.5 w-16 -translate-x-1/2 rounded-full bg-[#0D1510] shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
        />
        <div className="absolute inset-0 overflow-hidden rounded-[1.6rem]">
          <iframe
            title={`Pré-visualização do convite ${title}`}
            src={src}
            className="h-full w-full border-0 [scrollbar-width:none]"
            loading="lazy"
            onLoad={hideScrollbar}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent_24%)]"
          />
        </div>
      </div>
      {showCaption ? (
        <>
          <h3 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-[#1F2420]">
            {title}
          </h3>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-full border border-[#E5E7E4] bg-white px-6 py-3 text-sm font-semibold text-[#1F2420] transition hover:border-[#3F4E3F] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
          >
            Abrir convite →
          </a>
        </>
      ) : null}
    </article>
  );
}
