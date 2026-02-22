"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

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

/* ─── Stagger animation presets ─── */
const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" as const },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

/* ─── Template Card ─── */
function TemplateCard({
  template,
  index,
}: {
  template: (typeof templates)[number];
  index: number;
}) {
  return (
    <motion.div variants={fadeUp}>
      <Link href={`/${template.slug}`} className="block group">
        <div className="brindel-card">
          {/* Image */}
          <div className="brindel-card-img relative h-[220px] w-full overflow-hidden">
            <img
              src={template.image}
              alt={template.name}
              className="h-full w-full object-cover"
              loading={index < 2 ? "eager" : "lazy"}
            />
            {/* Subtle warm overlay at bottom for text readability */}
            <div
              className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(61,43,26,0.06), transparent)",
              }}
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1.5 px-3.5 py-3">
            <h3
              className="font-display-cormorant text-base font-semibold"
              style={{ color: "var(--brindel-text)" }}
            >
              {template.name}
            </h3>
            <p
              className="text-[11px]"
              style={{ color: "var(--brindel-text-muted)" }}
            >
              {template.description}
            </p>
            <div className="brindel-card-btn mt-0.5 w-full">Preview</div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Section Label with scroll trigger ─── */
function SectionLabel() {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.p
      ref={ref}
      className="brindel-label text-[11px] font-medium tracking-[3px]"
      initial={{ opacity: 0, x: -12 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={
        isInView
          ? { animation: "brindel-shimmer 3s ease-in-out 0.6s 1 forwards" }
          : undefined
      }
    >
      ESCOLHA SEU MODELO
    </motion.p>
  );
}

/* ─── Page ─── */
export default function Home() {
  const leftColumn = [templates[0], templates[2]];
  const rightColumn = [templates[1], templates[3]];

  return (
    <div className="brindel-page">
      <main className="relative z-10 mx-auto w-full max-w-[390px]">
        {/* ━━━ Hero Section ━━━ */}
        <motion.section
          className="flex flex-col items-center gap-4 px-7 pt-12 pb-9"
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          {/* Monogram Logo */}
          <motion.div
            className="brindel-logo flex items-center justify-center rounded-full"
            variants={scaleIn}
            style={{
              width: 56,
              height: 56,
              backgroundColor: "var(--brindel-brown)",
              boxShadow: "0 4px 24px rgba(150,100,58,0.18)",
            }}
          >
            <span
              className="font-display-cormorant italic font-semibold select-none"
              style={{
                fontSize: 30,
                color: "#fff",
                lineHeight: 1,
                marginTop: 2,
              }}
            >
              B
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="font-display-cormorant font-semibold text-center"
            variants={fadeUp}
            style={{
              color: "var(--brindel-text)",
              fontSize: 42,
              letterSpacing: "2px",
              lineHeight: 1.1,
            }}
          >
            Brindel
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="max-w-[280px] text-center text-[13px] leading-relaxed"
            variants={fadeUp}
            style={{
              color: "var(--brindel-text-muted)",
              lineHeight: 1.6,
            }}
          >
            Convites de casamento interativos e memoráveis
          </motion.p>

          {/* Divider */}
          <motion.div className="brindel-divider" variants={fadeIn} />
        </motion.section>

        {/* ━━━ Templates Section ━━━ */}
        <section className="flex flex-col gap-[18px] px-7 pb-9">
          <SectionLabel />

          {/* 2-column masonry grid */}
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            {/* Left column */}
            <motion.div
              className="flex flex-col gap-3"
              variants={stagger}
            >
              {leftColumn.map((t) => (
                <TemplateCard
                  key={t.slug}
                  template={t}
                  index={templates.indexOf(t)}
                />
              ))}
            </motion.div>
            {/* Right column */}
            <motion.div
              className="flex flex-col gap-3"
              variants={stagger}
            >
              {rightColumn.map((t) => (
                <TemplateCard
                  key={t.slug}
                  template={t}
                  index={templates.indexOf(t)}
                />
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ━━━ Footer ━━━ */}
        <motion.footer
          className="flex flex-col items-center gap-2 px-7 pt-5 pb-7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="brindel-divider" />
          <p
            className="font-display-cormorant text-sm italic text-center mt-1"
            style={{ color: "var(--brindel-text-muted)" }}
          >
            Feito com amor para o seu grande dia
          </p>
          <p
            className="text-[10px]"
            style={{ color: "var(--brindel-text-faint)" }}
          >
            &copy; 2026 Brindel Studio
          </p>
        </motion.footer>
      </main>
    </div>
  );
}
