import type { Metadata, Viewport } from "next";
import {
  Great_Vibes,
  Playfair_Display,
  Cormorant_Garamond,
  Homemade_Apple,
  Libre_Baskerville,
  Cinzel,
  Lora,
  Outfit,
  DM_Serif_Display,
  Pinyon_Script,
  Geist,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const greatVibes = Great_Vibes({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-great-vibes",
});

const playfairDisplay = Playfair_Display({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-playfair-display",
});

const cormorantGaramond = Cormorant_Garamond({
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
});

const homemadeApple = Homemade_Apple({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-homemade-apple",
});

const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-libre-baskerville",
});

const cinzel = Cinzel({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-cinzel",
});

const lora = Lora({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-lora",
});

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
});

const pinyonScript = Pinyon_Script({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-pinyon-script",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Brindel Studio — Convites Digitais",
  description: "Convites de casamento interativos e memoráveis",
};

// Build the S3 origin at startup for DNS preconnect (e.g. "https://bucket.s3.region.amazonaws.com")
const s3Bucket = process.env.S3_BUCKET_NAME;
const s3Region = process.env.AWS_REGION;
const s3Origin =
  s3Bucket && s3Region
    ? `https://${s3Bucket}.s3.${s3Region}.amazonaws.com`
    : null;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt"
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
        className={`${greatVibes.variable} ${playfairDisplay.variable} ${cormorantGaramond.variable} ${homemadeApple.variable} ${libreBaskerville.variable} ${cinzel.variable} ${lora.variable} ${outfit.variable} ${dmSerifDisplay.variable} ${pinyonScript.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
