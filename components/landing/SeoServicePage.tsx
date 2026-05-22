import Link from "next/link";

import { getServicePageContent, type ServicePageSlug } from "@/lib/seo-service-pages";
import { buildWhatsappUrl } from "@/lib/landing-whatsapp";

export function SeoServicePage({
  slug,
  locale,
}: {
  slug: ServicePageSlug;
  locale: string;
}) {
  const content = getServicePageContent(slug, locale);
  const whatsappUrl = buildWhatsappUrl(
    `Olá! Gostava de saber mais sobre ${content.h1}.`,
  );

  return (
    <main className="min-h-screen bg-[#F8F7F2] font-[var(--font-outfit)] text-[#1F2420]">
      <section className="relative overflow-hidden px-5 py-24 sm:px-8 lg:py-32">
        <div className="absolute right-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-[#DDE5D9] blur-3xl" />
        <div className="absolute bottom-10 left-[-10rem] h-72 w-72 rounded-full bg-[#F1DDD4] blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <Link
              href="/"
              className="inline-flex rounded-full border border-[#D9DDD5] bg-white/70 px-4 py-2 text-sm font-semibold text-[#3F4E3F] transition hover:border-[#3F4E3F]"
            >
              brindeal
            </Link>
            <p className="mt-14 text-xs font-bold uppercase tracking-[0.34em] text-[#6D796B]">
              {content.eyebrow}
            </p>
            <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[#354333] sm:text-6xl lg:text-7xl">
              {content.h1}
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#5C605A]">
              {content.intro}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#3F4E3F] px-7 py-4 text-center text-sm font-semibold text-white shadow-[0_18px_60px_rgba(63,78,63,0.24)] transition hover:-translate-y-0.5 hover:bg-[#2D3A2D]"
              >
                Pedir proposta
              </a>
              <Link
                href="/#galeria"
                className="rounded-full border border-[#D9DDD5] bg-white/70 px-7 py-4 text-center text-sm font-semibold text-[#1F2420] transition hover:-translate-y-0.5 hover:border-[#3F4E3F]"
              >
                Ver exemplos
              </Link>
            </div>
          </div>
          <aside className="rounded-[2rem] border border-white/80 bg-white/70 p-8 shadow-[0_28px_90px_rgba(31,36,32,0.10)] backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6D796B]">
              O que inclui
            </p>
            <p className="mt-5 text-2xl font-medium tracking-[-0.03em] text-[#354333]">
              {content.proof}
            </p>
            <div className="mt-8 grid gap-3 text-sm text-[#5C605A]">
              {["Design mobile", "RSVP opcional", "Mapa e detalhes", "Partilha por WhatsApp"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#E5E7E4] bg-[#FAFBF9] px-4 py-3"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2">
          {content.sections.map((section) => (
            <article
              key={section.title}
              className="rounded-[1.75rem] border border-[#E5E7E4] p-8"
            >
              <h2 className="text-3xl font-medium tracking-[-0.035em] text-[#354333]">
                {section.title}
              </h2>
              <p className="mt-5 leading-8 text-[#5C605A]">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-4xl font-medium tracking-[-0.04em] text-[#354333]">
            Perguntas frequentes
          </h2>
          <div className="mt-8 space-y-3">
            {content.faqs.map((faq) => (
              <article key={faq.question} className="rounded-2xl bg-white p-6">
                <h3 className="font-semibold text-[#1F2420]">{faq.question}</h3>
                <p className="mt-3 leading-7 text-[#5C605A]">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-[#263126] p-8 text-white sm:p-12">
          <h2 className="text-4xl font-medium tracking-[-0.04em]">
            {content.ctaTitle}
          </h2>
          <p className="mt-4 max-w-2xl leading-8 text-[#D9DDD5]">
            {content.ctaBody}
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex rounded-full bg-white px-7 py-4 text-sm font-semibold text-[#263126] transition hover:-translate-y-0.5"
          >
            Falar no WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
