"use client";

/* ------------------------------------------------------------------ */
/*  ExternalLinkPage                                                    */
/*                                                                      */
/*  Full-screen iframe rendering the external invitation URL.          */
/*  Completely immersive — no header, no footer, no chrome.            */
/* ------------------------------------------------------------------ */

interface ExternalLinkPageProps {
  externalLink: string;
}

export default function ExternalLinkPage({
  externalLink,
}: ExternalLinkPageProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      <iframe
        src={externalLink}
        title="Convite externo"
        allowFullScreen
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
      />
    </div>
  );
}
