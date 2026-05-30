import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import {
  Cinzel,
  Cormorant_Garamond,
  DM_Serif_Display,
  Fraunces,
  Geist,
  Great_Vibes,
  Homemade_Apple,
  Libre_Baskerville,
  Lora,
  Manrope,
  Outfit,
  Pinyon_Script,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// `preload: false` only disables the <link rel="preload"> header for these
// fonts — the @font-face rules stay in the generated CSS, so the browser
// still fetches the file when a theme actually references the family. Public
// invitation pages otherwise eagerly download every decorative font even
// when the current theme only uses 2-3 of them.

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  preload: false,
});

const greatVibes = Great_Vibes({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-great-vibes",
  preload: false,
});

const playfairDisplay = Playfair_Display({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-playfair-display",
  preload: false,
});

const cormorantGaramond = Cormorant_Garamond({
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
  preload: false,
});

const homemadeApple = Homemade_Apple({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-homemade-apple",
  preload: false,
});

const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-libre-baskerville",
  preload: false,
});

const cinzel = Cinzel({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-cinzel",
  preload: false,
});

const lora = Lora({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-lora",
  preload: false,
});

// Outfit is the global UI font (body uses `var(--font-outfit)` in
// `app/globals.css`), so it is the only family we keep eagerly preloaded.
const outfit = Outfit({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-outfit",
});

const dmSerifDisplay = DM_Serif_Display({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-dm-serif-display",
  preload: false,
});

const pinyonScript = Pinyon_Script({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-pinyon-script",
  preload: false,
});

const manrope = Manrope({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-manrope",
  preload: false,
});

const fraunces = Fraunces({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-fraunces",
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
      className={cn("font-sans", geist.variable)}
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
        className={`${greatVibes.variable} ${playfairDisplay.variable} ${cormorantGaramond.variable} ${homemadeApple.variable} ${libreBaskerville.variable} ${cinzel.variable} ${lora.variable} ${outfit.variable} ${dmSerifDisplay.variable} ${pinyonScript.variable} ${manrope.variable} ${fraunces.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
