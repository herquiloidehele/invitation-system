export function Footer() {
  return (
    <footer className="bg-[#1F2420] px-5 py-16 text-[#E8EBE7] sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-xl font-semibold text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E8EBE7]" />
            brindeal
          </div>
          <p className="mt-5 max-w-xs text-sm leading-6 text-[#A3A496]">
            Convites digitais feitos com cuidado, em Lisboa.
          </p>
        </div>
        {[
          ["Produto", "Casamento", "Save the Date", "Baptizado", "Noivado"],
          ["Recursos", "Galeria", "Como funciona", "FAQ", "Blog"],
          ["Empresa", "Sobre", "Contacto", "Termos", "Privacidade"],
        ].map(([heading, ...links]) => (
          <div key={heading} className="space-y-3 text-sm">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white">
              {heading}
            </p>
            {links.map((link) => (
              <a key={link} href="#top" className="block text-[#A3A496] transition hover:text-white">
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-4 border-t border-white/10 pt-8 text-xs text-[#A3A496] sm:flex-row">
        <p>© 2026 Brindeal Studio · Feito com cuidado em Lisboa</p>
        <p>Português · English · Español</p>
      </div>
    </footer>
  );
}
