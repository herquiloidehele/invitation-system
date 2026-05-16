import { AnimatedSection } from "./AnimatedSection";
import { PhoneIframePreview } from "./PhoneIframePreview";
import { SectionEyebrow } from "./SectionEyebrow";

export function LiveDemoSection() {
  return (
    <AnimatedSection className="bg-[#F6F7F5] px-5 py-24 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionEyebrow>Demo ao vivo</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.02em] sm:text-5xl">
            Veja o convite a respirar.
          </h2>
          <p className="mt-5 text-[#5C605A]">
            A experiência final parece leve para os convidados, mas concentra
            tudo o que o evento precisa.
          </p>
        </div>
        <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <PhoneIframePreview title="Leonor & Diogo" src="/leonor-diogo" />
          <PhoneIframePreview title="Sofia & Pedro" src="/sofia-pedro" />
        </div>
      </div>
    </AnimatedSection>
  );
}
