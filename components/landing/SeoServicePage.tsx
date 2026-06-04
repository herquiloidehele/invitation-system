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
    <main className="min-h-screen bg-surface-warm font-[var(--font-outfit)] text-foreground">
      <section className="relative overflow-hidden px-5 py-24 sm:px-8 lg:py-32">
        <div className="absolute right-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-primary-soft blur-3xl" />
        <div className="absolute bottom-10 left-[-10rem] h-72 w-72 rounded-full bg-warm-soft blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <Link
              href="/"
              className="inline-flex rounded-full border border-border bg-background/70 px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary"
            >
              brindeal
            </Link>
            <p className="mt-14 text-xs font-bold uppercase tracking-[0.34em] text-primary-muted">
              {content.eyebrow}
            </p>
            <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-primary-hover sm:text-6xl lg:text-7xl">
              {content.h1}
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground">
              {content.intro}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-primary px-7 py-4 text-center text-sm font-semibold text-primary-foreground shadow-[0_18px_60px_color-mix(in_srgb,var(--primary)_24%,transparent)] transition hover:-translate-y-0.5 hover:bg-primary-hover"
              >
                Pedir proposta
              </a>
              <Link
                href="/#galeria"
                className="rounded-full border border-border bg-background/70 px-7 py-4 text-center text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-primary"
              >
                Ver exemplos
              </Link>
            </div>
          </div>
          <aside className="rounded-[2rem] border border-background/80 bg-background/70 p-8 shadow-[0_28px_90px_color-mix(in_srgb,var(--foreground)_10%,transparent)] backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary-muted">
              O que inclui
            </p>
            <p className="mt-5 text-2xl font-medium tracking-[-0.03em] text-primary-hover">
              {content.proof}
            </p>
            <div className="mt-8 grid gap-3 text-sm text-muted-foreground">
              {["Design mobile", "RSVP opcional", "Mapa e detalhes", "Partilha por WhatsApp"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border bg-background px-4 py-3"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-background px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2">
          {content.sections.map((section) => (
            <article
              key={section.title}
              className="rounded-[1.75rem] border border-border p-8"
            >
              <h2 className="text-3xl font-medium tracking-[-0.035em] text-primary-hover">
                {section.title}
              </h2>
              <p className="mt-5 leading-8 text-muted-foreground">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-4xl font-medium tracking-[-0.04em] text-primary-hover">
            Perguntas frequentes
          </h2>
          <div className="mt-8 space-y-3">
            {content.faqs.map((faq) => (
              <article key={faq.question} className="rounded-2xl bg-card p-6">
                <h3 className="font-semibold text-foreground">{faq.question}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-primary-deep p-8 text-primary-foreground sm:p-12">
          <h2 className="text-4xl font-medium tracking-[-0.04em]">
            {content.ctaTitle}
          </h2>
          <p className="mt-4 max-w-2xl leading-8 text-primary-soft">
            {content.ctaBody}
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex rounded-full bg-background px-7 py-4 text-sm font-semibold text-primary-deep transition hover:-translate-y-0.5"
          >
            Falar no WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
