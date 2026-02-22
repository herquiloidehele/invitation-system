import type { Metadata } from "next";
import {
  Great_Vibes,
  Playfair_Display,
  Cormorant_Garamond,
  Homemade_Apple,
  Libre_Baskerville,
  Cinzel,
  Lora,
  Inter,
} from "next/font/google";
import "./globals.css";

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

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Convites Digitais",
  description: "Convites de casamento interativos e memoráveis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body
        className={`${greatVibes.variable} ${playfairDisplay.variable} ${cormorantGaramond.variable} ${homemadeApple.variable} ${libreBaskerville.variable} ${cinzel.variable} ${lora.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
