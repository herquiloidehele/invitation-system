import Image from "next/image";
import { buildWhatsappUrl } from "@/lib/landing-whatsapp";
import logo from "@/design/logo.jpg";
import { navLinks } from "./landing-data";

export function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#E5E7E4]/80 bg-white/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <a
          href="#top"
          aria-label="Brindeal homepage"
          className="flex items-center gap-3 rounded-full font-semibold tracking-[-0.03em] text-[#1F2420] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
        >
          <Image
            src={logo}
            alt=""
            width={44}
            height={44}
            priority
            className="rounded-full border border-[#E5E7E4] shadow-[0_8px_24px_rgba(31,36,32,0.08)]"
          />
          <span className="text-xl">brindeal</span>
        </a>
        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#5C605A] transition hover:text-[#1F2420] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
            >
              {link.label}
            </a>
          ))}
        </div>
        <a
          href={buildWhatsappUrl()}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-[#3F4E3F] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#2D3A2D] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
        >
          Começar convite →
        </a>
      </nav>
    </header>
  );
}
