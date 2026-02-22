"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

const templates = [
  {
    name: "Pink Floral",
    description: "Romântico & Elegante",
    slug: "kezia-ruben",
    image:
      "https://images.unsplash.com/photo-1646309619510-c15b16a7c8be?w=400&q=80",
  },
  {
    name: "Modern Minimal",
    description: "Limpo & Sofisticado",
    slug: "ana-miguel",
    image:
      "https://images.unsplash.com/photo-1655045802235-889a17a9d3d4?w=400&q=80",
  },
  {
    name: "Boho Chic",
    description: "Rústico & Natural",
    slug: "sofia-pedro",
    image:
      "https://images.unsplash.com/photo-1662959832799-c7203051862b?w=400&q=80",
  },
  {
    name: "Midnight Elegance",
    description: "Luxuoso & Dramático",
    slug: "leonor-diogo",
    image:
      "https://images.unsplash.com/photo-1645856050970-fc1150f4f47d?w=400&q=80",
  },
];

function TemplateCard({
  template,
  index,
}: {
  template: (typeof templates)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.2 + index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <Link href={`/${template.slug}`} className="block">
        <div
          className="overflow-hidden rounded-2xl border border-[#3A3A3C]"
          style={{ backgroundColor: "#242426" }}
        >
          {/* Image area */}
          <div className="relative h-[220px] w-full overflow-hidden">
            <img
              src={template.image}
              alt={template.name}
              className="h-full w-full object-cover"
              loading={index < 2 ? "eager" : "lazy"}
            />
          </div>

          {/* Content area */}
          <div className="flex flex-col gap-1.5 px-4 py-3.5">
            <h3
              className="font-display-cormorant text-base font-semibold"
              style={{ color: "#F5F5F0" }}
            >
              {template.name}
            </h3>
            <p className="text-[11px]" style={{ color: "#6E6E70" }}>
              {template.description}
            </p>
            <div
              className="mt-0.5 w-full rounded-[20px] py-2 px-4 text-center text-[11px] font-semibold"
              style={{ backgroundColor: "#C9A962", color: "#1A1A1C" }}
            >
              Preview
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Home() {
  // Arrange templates into 2 columns (left: 0,2 / right: 1,3)
  const leftColumn = [templates[0], templates[2]];
  const rightColumn = [templates[1], templates[3]];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1A1A1C" }}>
      <main className="mx-auto w-full max-w-[390px]">
        {/* Hero Section */}
        <motion.section
          className="flex flex-col items-center gap-4 px-7 pt-[60px] pb-10"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Heart
            size={28}
            fill="#C9A962"
            color="#C9A962"
            strokeWidth={1.5}
          />
          <h1
            className="font-display-cormorant text-4xl font-semibold text-center"
            style={{ color: "#F5F5F0", fontSize: "36px" }}
          >
            Convites Digitais
          </h1>
          <p
            className="max-w-[300px] text-center text-sm leading-relaxed"
            style={{ color: "#6E6E70", lineHeight: 1.6 }}
          >
            Crie convites de casamento interativos e memoráveis
          </p>
          <div
            className="h-px w-[60px]"
            style={{ backgroundColor: "#C9A96260" }}
          />
        </motion.section>

        {/* Templates Section */}
        <section className="flex flex-col gap-5 px-7 pb-10">
          <motion.p
            className="text-[11px] font-medium"
            style={{ color: "#6E6E70", letterSpacing: "3px" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            ESCOLHA SEU MODELO
          </motion.p>

          {/* 2-column grid */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Left column */}
            <div className="flex flex-col gap-3.5">
              {leftColumn.map((t) => (
                <TemplateCard
                  key={t.slug}
                  template={t}
                  index={templates.indexOf(t)}
                />
              ))}
            </div>
            {/* Right column */}
            <div className="flex flex-col gap-3.5">
              {rightColumn.map((t) => (
                <TemplateCard
                  key={t.slug}
                  template={t}
                  index={templates.indexOf(t)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <motion.footer
          className="flex flex-col items-center gap-2 px-7 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div
            className="h-px w-[60px]"
            style={{ backgroundColor: "#3A3A3C" }}
          />
          <p
            className="font-display-cormorant text-sm italic text-center"
            style={{ color: "#4A4A4C" }}
          >
            Feito com amor para o seu grande dia
          </p>
          <p className="text-[10px]" style={{ color: "#3A3A3C" }}>
            © 2026 Convites Digitais
          </p>
        </motion.footer>
      </main>
    </div>
  );
}
