import { buildWhatsappUrl } from "@/lib/landing-whatsapp";
import { AnimatedSection } from "./AnimatedSection";
import { processSteps } from "./landing-data";
import { SectionEyebrow } from "./SectionEyebrow";

export function ProcessSection() {
  const badges = ["No mesmo dia", "3 a 5 dias úteis", "Iterativo", "Ao vivo"];

  return (
    <AnimatedSection id="processo" className="bg-[#F6F7F5] px-5 py-24 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionEyebrow>Processo</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
            Quatro passos. Zero stress.
          </h2>
          <p className="mt-5 text-[#5C605A]">
            Do primeiro contacto à publicação. Tratamos de tudo. Vocês
            aproveitam.
          </p>
        </div>
        <div className="mt-16 grid gap-5 lg:grid-cols-2">
          {processSteps.map(([number, title, text], index) => {
            const dark = index === 0;

            return (
              <article
                key={number}
                className={`min-h-[320px] rounded-[1.5rem] p-7 shadow-[0_18px_55px_rgba(31,36,32,0.05)] sm:p-8 ${
                  dark
                    ? "bg-[#3F4E3F] text-white"
                    : "border border-[#E5E7E4] bg-white text-[#1F2420]"
                }`}
              >
                <div className="flex items-start justify-between gap-6">
                  <p className={`text-5xl font-semibold leading-none ${dark ? "text-white" : "text-[#3F4E3F]"}`}>
                    <span className="text-lg">•</span> {number}
                  </p>
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-2xl text-lg ${
                      dark ? "bg-white/12 text-white" : "bg-[#F6F7F5] text-[#3F4E3F]"
                    }`}
                    aria-hidden="true"
                  >
                    {index === 0 ? "✉" : index === 1 ? "✦" : index === 2 ? "◐" : "↗"}
                  </span>
                </div>
                <h3 className="mt-7 text-2xl font-semibold tracking-[-0.02em]">
                  {title}
                </h3>
                <p className={`mt-5 text-sm leading-7 ${dark ? "text-[#E8EBE7]" : "text-[#5C605A]"}`}>
                  {text}
                </p>
                <span
                  className={`mt-6 inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] ${
                    dark
                      ? "bg-white/14 text-white"
                      : "border border-[#E5E7E4] bg-white text-[#1F2420]"
                  }`}
                >
                  • {badges[index]}
                </span>
                <ProcessPreview index={index} />
              </article>
            );
          })}
        </div>
        <div className="mt-14 flex flex-col items-center justify-center gap-5 text-center sm:flex-row">
          <p className="text-2xl font-medium text-[#1F2420]">
            Pronto para começar a vossa história?
          </p>
          <a
            href={buildWhatsappUrl()}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#3F4E3F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2D3A2D] focus:outline-none focus:ring-2 focus:ring-[#3F4E3F] focus:ring-offset-4"
          >
            Falar agora →
          </a>
        </div>
      </div>
    </AnimatedSection>
  );
}

function ProcessPreview({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-[#243326]/75 p-4 text-xs text-white">
        <div className="w-fit rounded-full bg-white px-4 py-2 text-[#1F2420]">
          Olá, é casamento em Julho
        </div>
        <div className="mt-2 w-fit rounded-full bg-white/12 px-4 py-2">
          Perfeito! Envio proposta hoje
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="mt-6 rounded-2xl bg-[#F6F7F5] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5C605A]">
          Paleta
        </p>
        <div className="mt-3 flex gap-3">
          {["#3F4E3F", "#6B7E68", "#E8EBE7", "#DEE1DC"].map((color) => (
            <span key={color} className="h-9 w-9 rounded-lg" style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="mt-6 rounded-2xl bg-[#F6F7F5] p-4">
        <div className="space-y-3">
          {[0, 1].map((row) => (
            <div key={row} className="flex items-center gap-3">
              <span className={`h-5 w-5 rounded-full ${row === 0 ? "bg-[#3F4E3F]" : "bg-[#DEE1DC]"}`} />
              <span className="h-2 w-24 rounded-full bg-[#DEE1DC]" />
              <span className="h-2 w-16 rounded-full bg-[#E5E7E4]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 flex items-center gap-4 rounded-2xl bg-[#F6F7F5] p-4 text-xs text-[#1F2420]">
      <div className="grid h-20 w-12 place-items-center rounded-lg border-3 border-[#3F4E3F] bg-white">
        <span className="h-4 w-4 rounded-full bg-[#3F4E3F]" />
      </div>
      <div className="space-y-2">
        <p>• 142 confirmaram</p>
        <p>• 18 mensagens</p>
        <p>• em tempo real</p>
      </div>
    </div>
  );
}
