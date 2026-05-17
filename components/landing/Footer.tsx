import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("LandingFooter");
  const linkGroups = [
    {
      heading: t("product"),
      links: [
        { label: t("wedding"), href: "#galeria" },
        { label: t("saveTheDate"), href: "#galeria" },
        { label: t("baptism"), href: "#galeria" },
        { label: t("engagement"), href: "#galeria" },
      ],
    },
    {
      heading: t("resources"),
      links: [
        { label: t("gallery"), href: "#galeria" },
        { label: t("process"), href: "#processo" },
        { label: t("faq"), href: "#faq" },
      ],
    },
    {
      heading: t("company"),
      links: [
        { label: t("about"), href: "#recursos" },
        { label: t("contact"), href: "#orcamento" },
      ],
    },
  ];

  return (
    <footer className="bg-[#1F2420] px-5 py-16 text-[#E8EBE7] sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-xl font-semibold text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E8EBE7]" />
            brindeal
          </div>
          <p className="mt-5 max-w-xs text-sm leading-6 text-[#A3A496]">
            {t("description")}
          </p>
        </div>
        {linkGroups.map(({ heading, links }) => (
          <div key={heading} className="space-y-3 text-sm">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white">
              {heading}
            </p>
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block text-[#A3A496] transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-4 border-t border-white/10 pt-8 text-xs text-[#A3A496] sm:flex-row">
        <p>{t("copyright")}</p>
        <p>{t("languages")}</p>
      </div>
    </footer>
  );
}
