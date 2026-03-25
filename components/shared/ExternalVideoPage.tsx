"use client";

/* ------------------------------------------------------------------ */
/*  ExternalVideoPage                                                   */
/*                                                                      */
/*  Full-screen autoplay video — no controls, no chrome.               */
/*  The video fills the entire viewport, object-fit: cover.            */
/* ------------------------------------------------------------------ */

interface ExternalVideoPageProps {
  videoUrl: string;
}

export default function ExternalVideoPage({
  videoUrl,
}: ExternalVideoPageProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        src={videoUrl}
        autoPlay
        loop
        muted={false}
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );
}
