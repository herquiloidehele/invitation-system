import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// Static-font policy (2026-05-31):
//
// Previously the root layout statically loaded 13 Google Font families.
// Even with `preload: false`, every page shipped the @font-face rules
// and CSS variable bindings, leaving ~188 stale entries in
// document.fonts on a cold load and adding ~70 KB of font CSS to every
// route.
//
// We now ship only the two families that are used outside theme-driven
// UI:
//   * Outfit — the global body/UI font (referenced by `app/globals.css`).
//     Eagerly preloaded.
//   * Cormorant Garamond — a common decorative fallback used by base
//     components when a theme hasn't supplied a display font yet. Loaded
//     without preload so the bytes only ship if a theme references it.
//
// All other decorative families are loaded on demand by the per-theme
// `useDynamicFonts` hook (hooks/useDynamicFont.ts), which injects a
// <link rel="stylesheet"> only when a theme actually references the
// family. See `lib/google-fonts.ts` for the registered builtins and the
// canonical Google Fonts URL builder.

const outfit = Outfit({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-outfit",
});

const cormorantGaramond = Cormorant_Garamond({
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
  preload: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://convites.brindealstudio.com",
  ),
  applicationName: "Brindeal Studio",
  title: {
    default: "Brindeal Studio | Convites Digitais",
    template: "%s | Brindeal Studio",
  },
  description:
    "Convites digitais personalizados para casamentos e celebrações, com RSVP online, mapa, música e partilha simples por WhatsApp.",
  openGraph: {
    type: "website",
    siteName: "Brindeal Studio",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-default.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

// Build the S3 origin at startup for DNS preconnect (e.g. "https://bucket.s3.region.amazonaws.com")
const s3Bucket = process.env.S3_BUCKET_NAME;
const s3Region = process.env.AWS_REGION;
const s3Origin =
  s3Bucket && s3Region
    ? `https://${s3Bucket}.s3.${s3Region}.amazonaws.com`
    : null;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={cn("font-sans", outfit.variable)}
      suppressHydrationWarning
    >
      <head>
        {/* Early DNS + TLS handshake to the S3 bucket so media loads faster */}
        {s3Origin && (
          <>
            <link rel="preconnect" href={s3Origin} />
            <link rel="dns-prefetch" href={s3Origin} />
          </>
        )}
      </head>
      <body
        className={`${cormorantGaramond.variable} ${outfit.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
