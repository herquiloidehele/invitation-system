import "dotenv/config";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Targeted seed: upserts ONLY the Elegant Floral theme + the elma-osvaldo
 * invitation. Unlike `prisma/seed.ts` (which re-upserts every theme and every
 * landing demo), this leaves all other records untouched — safe to run against
 * production. Run with:
 *   tsx --env-file=.env.production scripts/seed-elegant-floral.ts   (prod)
 *   tsx --env-file=.env.development scripts/seed-elegant-floral.ts  (dev)
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

// Mirrors the "theme_elegant_floral" entry in prisma/seed.ts.
const THEME = {
  id: "theme_elegant_floral",
  name: "elegant-floral",
  label: "Elegant Floral",
  description: "Cremes, Dourado & Florais",
  envelope: {
    base: "#F3E9DC",
    topFlap: "/images/top.png",
    bottomFlap: "/images/bottom.png",
  },
  bg: "#FBF7F0",
  cardBg: "rgba(255,255,255,0.7)",
  cardBorder: "rgba(184,144,47,0.15)",
  primary: "#B8902F",
  secondary: "#C49A86",
  accent: "#9CA77F",
  textPrimary: "#8A6D3B",
  textSecondary: "#A88A5A",
  textMuted: "rgba(138,109,59,0.5)",
  displayFont: "'Playfair Display', serif",
  bodyFont: "'Cormorant Garamond', serif",
  scriptFont: "'Pinyon Script', cursive",
  uiFont: "'Outfit', sans-serif",
  ctaPrimaryBg: "#B8902F",
  ctaPrimaryText: "#FFFFFF",
  ctaSecondaryBorder: "#C49A86",
  ctaSecondaryText: "#B8902F",
  ctaRadius: "9999px",
  monogramColor: "#B8902F",
  tapTextColor: "#A88A5A",
  bgGradient:
    "radial-gradient(ellipse at 50% 0%, rgba(184,144,47,0.06) 0%, transparent 60%)",
  decorativeColor: "#C49A86",
  ctaGlow: "rgba(184,144,47,0.25)",
  layout: "elegant-floral",
};

async function main() {
  const host = connectionString!.split("@")[1]?.split("/")[0] ?? "?";
  console.log(`Seeding Elegant Floral → ${host}\n`);

  // 1. Theme
  const { id, ...themeUpdate } = THEME;
  await prisma.theme.upsert({
    where: { id },
    update: themeUpdate,
    create: THEME,
  });
  console.log("  ✓ theme: Elegant Floral");

  // 2. elma-osvaldo invitation (same field mapping as prisma/seed.ts)
  const data = JSON.parse(
    readFileSync(
      join(process.cwd(), "data", "invitations", "elma-osvaldo.json"),
      "utf-8",
    ),
  );
  if (data.template !== "elegant-floral") {
    throw new Error(`Unexpected template "${data.template}" for ${data.slug}`);
  }

  const fields = {
    themeId: id,
    couple: data.couple,
    date: data.date,
    quote: data.quote,
    location: data.location,
    rsvp: data.rsvp,
    schedule: data.schedule,
    dressCode: data.dressCode,
    giftRegistry: data.giftRegistry,
    audio: data.audio,
    heroImage: data.heroImage,
    videoUrl: data.videoUrl ?? null,
    videoPoster: data.videoPoster ?? null,
    faqs: data.faqs ?? null,
    location2: data.location2 ?? null,
    parents: data.parents ?? null,
    countdown: data.countdown ?? null,
    coupleGallery: data.coupleGallery ?? null,
    eventType: data.eventType ?? "wedding",
    heroHeight: data.heroHeight ?? null,
    heroOverlay: data.heroOverlay ?? null,
    heroMediaFit: data.heroMediaFit ?? null,
    scheduleStyle: data.scheduleStyle ?? null,
    customTexts: data.customTexts ?? null,
    textStyles: data.textStyles ?? null,
    cardStyles: data.cardStyles ?? null,
  };

  await prisma.invitation.upsert({
    where: { slug: data.slug },
    update: fields,
    create: { slug: data.slug, ...fields },
  });
  console.log(
    `  ✓ invitation: ${data.slug} (${data.couple.bride} & ${data.couple.groom})`,
  );

  console.log("\nDone — only these two records were touched.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
