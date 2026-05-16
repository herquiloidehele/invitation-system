"use client";

export function PhoneIframePreview({ title, src }: { title: string; src: string }) {
  function hideScrollbar(event: React.SyntheticEvent<HTMLIFrameElement>) {
    const iframeDocument = event.currentTarget.contentDocument;

    if (!iframeDocument) return;

    iframeDocument.documentElement.style.scrollbarWidth = "none";
    iframeDocument.body.style.scrollbarWidth = "none";
    iframeDocument.body.style.msOverflowStyle = "none";

    if (!iframeDocument.getElementById("brindeal-hide-scrollbar")) {
      const style = iframeDocument.createElement("style");
      style.id = "brindeal-hide-scrollbar";
      style.textContent = "::-webkit-scrollbar{display:none}";
      iframeDocument.head.appendChild(style);
    }
  }

  return (
    <article className="text-center">
      <div className="mx-auto aspect-[9/16] w-full max-w-[20rem] overflow-hidden rounded-[2.75rem] border-[7px] border-[#3F4E3F] bg-white shadow-[0_28px_90px_rgba(31,36,32,0.16)]">
        <iframe
          title={`Pré-visualização do convite ${title}`}
          src={src}
          className="h-full w-full border-0 [scrollbar-width:none]"
          loading="lazy"
          onLoad={hideScrollbar}
        />
      </div>
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
    </article>
  );
}
