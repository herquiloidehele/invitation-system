import { AnimatedSection } from "./AnimatedSection";
import { SectionEyebrow } from "./SectionEyebrow";

export function FeaturesSection() {
  return (
    <AnimatedSection id="recursos" className="bg-white px-5 py-24 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionEyebrow>Recursos</SectionEyebrow>
          </div>
          <h2 className="mt-5 text-4xl font-medium tracking-[-0.025em] sm:text-5xl">
            Tudo o que precisa, num só link.
          </h2>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-12">
          <article className="min-h-[360px] rounded-[1.75rem] bg-[#3F4E3F] p-8 text-white sm:p-10 lg:col-span-7 lg:min-h-[430px]">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F6F7F5]">
              • Favorito dos noivos
            </p>
            <h3 className="mt-7 text-4xl font-semibold leading-tight tracking-[-0.02em] sm:text-5xl">
              RSVP em tempo real
            </h3>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#E8EBE7] sm:text-base">
              Os convidados confirmam, escolhem ementa, deixam mensagem.
              Acompanham tudo num painel privado, sincronizado ao minuto.
            </p>
            <div className="mt-24 rounded-2xl bg-[#243326]/70 p-5 backdrop-blur sm:mt-28">
              <div className="flex items-center justify-between text-xs font-semibold tracking-[0.12em] text-[#F6F7F5]">
                <span>Confirmações recebidas</span>
                <span>142 / 150</span>
              </div>
              <div className="mt-5 h-2 rounded-full bg-black/20">
                <div className="h-full w-[92%] rounded-full bg-[#6B7E68]" />
              </div>
              <div className="mt-5 flex items-center justify-between gap-4">
                <div className="flex -space-x-2">
                  {["#6B7E68", "#F6F7F5", "#F6F7F5", "#9AA795"].map(
                    (color, index) => (
                      <span
                        key={`${color}-${index}`}
                        className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#243326] text-[9px] font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {index === 3 ? "+138" : ""}
                      </span>
                    ),
                  )}
                </div>
                <span className="text-xs text-[#E8EBE7]">actualizado agora</span>
              </div>
            </div>
          </article>

          <div className="grid gap-5 lg:col-span-5">
            <FeatureWideCard
              icon="♫"
              title="Música ambiente"
              text="Spotify, YouTube ou ficheiro próprio."
              visual={<AudioWave />}
            />
            <FeatureWideCard
              icon="◎"
              title="Mapa interactivo"
              text="Direcções, GPS e estacionamento."
              visual={<MapTarget />}
            />
          </div>

          <FeatureSmallCard title="Gestão de convidados" text="Lista com mesa, link pessoal e acompanhantes.">
            <div className="mt-5 space-y-2 rounded-xl bg-[#F6F7F5] p-2">
              {["Leonor S.", "Diogo M.", "Sara F."].map((name, index) => (
                <div key={name} className="flex items-center justify-between rounded-lg bg-white px-2 py-1.5 text-xs">
                  <span className="flex items-center gap-2">
                    <span className={`h-4 w-4 rounded-full ${index === 2 ? "bg-[#E5E7E4]" : "bg-[#3F4E3F]"}`} />
                    {name}
                  </span>
                  <span className="rounded-full bg-[#3F4E3F] px-2 py-0.5 text-[10px] font-semibold text-white">
                    Mesa {index === 2 ? 3 : 1}
                  </span>
                </div>
              ))}
            </div>
          </FeatureSmallCard>

          <FeatureSmallCard title="Analytics" text="Quem abriu, confirmou e respondeu.">
            <div className="mt-5 rounded-xl bg-[#F6F7F5] p-4">
              <div className="flex h-20 items-end justify-between gap-3">
                {[22, 40, 30, 48, 63, 54, 78].map((height, index) => (
                  <span
                    key={index}
                    className="w-4 rounded-sm bg-[#657661]"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#3F4E3F]">
              +38% <span className="text-xs font-normal text-[#5C605A]">esta semana</span>
            </p>
          </FeatureSmallCard>

          <FeatureSmallCard
            title="Multi-idioma"
            text="PT, EN, ES para convidados internacionais."
            tinted
          >
            <div className="mt-5 space-y-2">
              {["Português", "English", "Español"].map((language) => (
                <div key={language} className="flex items-center justify-between rounded-xl bg-white px-4 py-2 text-sm">
                  {language}
                  <span>✓</span>
                </div>
              ))}
            </div>
          </FeatureSmallCard>

          <FeatureSmallCard title="Personalização total" text="Tipografia, cores e fotografias sob medida.">
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.28em] text-[#5C605A]">
              Paleta
            </p>
            <div className="mt-3 flex gap-2">
              {["#3F4E3F", "#2D3A2D", "#E8EBE7", "#DEE1DC"].map((color) => (
                <span key={color} className="h-8 w-8 rounded-lg" style={{ backgroundColor: color }} />
              ))}
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#5C605A]">
              Tipografia
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#1F2420]">
              Aa <span className="text-2xl font-normal">Aa</span>
            </p>
          </FeatureSmallCard>
        </div>
      </div>
    </AnimatedSection>
  );
}

function FeatureWideCard({
  icon,
  title,
  text,
  visual,
}: {
  icon: string;
  title: string;
  text: string;
  visual: React.ReactNode;
}) {
  return (
    <article className="grid min-h-[205px] grid-cols-[1fr_auto] items-center gap-6 rounded-[1.75rem] border border-[#E5E7E4] bg-white p-7 shadow-[0_12px_40px_rgba(31,36,32,0.035)] sm:p-8">
      <div>
        <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-[#F6F7F5] text-xl text-[#3F4E3F]">
          {icon}
        </div>
        <h3 className="text-xl font-semibold tracking-[-0.02em] text-[#1F2420]">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#5C605A]">{text}</p>
      </div>
      {visual}
    </article>
  );
}

function FeatureSmallCard({
  title,
  text,
  children,
  tinted,
}: {
  title: string;
  text: string;
  children: React.ReactNode;
  tinted?: boolean;
}) {
  return (
    <article
      className={`rounded-[1.5rem] border border-[#E5E7E4] p-6 shadow-[0_12px_40px_rgba(31,36,32,0.035)] lg:col-span-3 ${
        tinted ? "bg-[#E8EBE7]" : "bg-white"
      }`}
    >
      <div className="mb-6 grid h-11 w-11 place-items-center rounded-2xl bg-[#F6F7F5] text-[#3F4E3F]">
        ✦
      </div>
      <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#1F2420]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[#5C605A]">{text}</p>
      {children}
    </article>
  );
}

function AudioWave() {
  return (
    <div className="flex h-16 items-center gap-1 text-[#6B7E68]" aria-hidden="true">
      {[22, 36, 50, 64, 44, 58, 42, 30].map((height, index) => (
        <span
          key={index}
          className="w-1 rounded-full bg-current"
          style={{ height }}
        />
      ))}
    </div>
  );
}

function MapTarget() {
  return (
    <div className="grid h-24 w-24 place-items-center rounded-2xl border border-[#E5E7E4] bg-[#F6F7F5]" aria-hidden="true">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm">
        <span className="h-5 w-5 rounded-full border-8 border-[#3F4E3F]" />
      </span>
    </div>
  );
}
