/**
 * Seed script for the Curtain-Canva invitation theme.
 *
 * Creates (or updates) one theme row with `layout: "curtain-canva"` so the
 * renderer at `app/[slug]/InvitationView.tsx` routes invitations using this
 * theme through the new `<CurtainCanvaPage>` flow (curtains hero → scratch
 * date reveal → Canva iframe → inline RSVP — no envelope).
 *
 * Run: npx tsx scripts/seed-curtain-canva-theme.ts
 *
 * Idempotent: safe to re-run. Re-running updates the existing row without
 * creating a duplicate.
 *
 * Env loading & DB connection mirror prisma/seed.ts so the script works
 * identically to the canonical seed flow.
 */
import dotenv from "dotenv";
import path from "node:path";

// Load the matching .env.<NODE_ENV> file BEFORE importing the Prisma client.
const envName = process.env.NODE_ENV || "development";
dotenv.config({ path: path.resolve(process.cwd(), `.env.${envName}`) });

import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool as never);
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Theme definition — cream/ivory + dark brown + gold (reference image)
// ---------------------------------------------------------------------------

const THEME = {
  id: "theme_curtain_canva",
  name: "curtain-canva",
  label: "Curtain Canva",
  description: "Curtains hero + scratch reveal + Canva embed",

  // Layout selector — this is what makes InvitationView route to CurtainCanvaPage
  layout: "curtain-canva",

  // Envelope fields are required by the schema but unused for this layout.
  // Reusing the legacy default flap images keeps the row valid without
  // committing new assets.
  envelope: {
    base: "#F5EFE6",
    topFlap: "/images/top.png",
    bottomFlap: "/images/bottom.png",
  },

  // Page palette — cream/ivory background, dark-brown text, gold accents
  bg: "#F5EFE6",
  cardBg: "rgba(255, 255, 255, 0.85)",
  cardBorder: "rgba(62, 39, 35, 0.08)",

  primary: "#3E2723", // dark brown
  secondary: "#6D4C41", // medium brown
  accent: "#C9A961", // gold

  textPrimary: "#3E2723",
  textSecondary: "#6D4C41",
  textMuted: "rgba(62, 39, 35, 0.55)",

  // Typography — serif display + sans-serif UI + script for the monogram
  displayFont: "'Playfair Display', serif",
  bodyFont: "'Cormorant Garamond', serif",
  scriptFont: "'Great Vibes', cursive",
  uiFont: "'Outfit', sans-serif",
  sectionTitleFont: null as string | null,
  sectionTitleFontSize: null as number | null,
  sectionTitleFontWeight: null as string | null,

  // CTA button — rounded-full gold pill with white text
  ctaPrimaryBg: "#C9A961",
  ctaPrimaryText: "#FFFFFF",
  ctaSecondaryBorder: "#3E2723",
  ctaSecondaryText: "#3E2723",
  ctaRadius: "9999px",

  // Cover/monogram colors (used for the hero info reveal in CurtainsHero)
  monogramColor: "#C9A961",
  tapTextColor: "#3E2723",

  // Atmospheric / decorative — drives the gold ScratchCoin base color
  bgGradient: null as string | null,
  decorativeColor: "#C9A961",
  ctaGlow: "rgba(201, 169, 97, 0.30)",
};

async function main() {
  console.log("Seeding curtain-canva theme...");

  const result = await prisma.theme.upsert({
    where: { id: THEME.id },
    update: {
      name: THEME.name,
      label: THEME.label,
      description: THEME.description,
      layout: THEME.layout,
      envelope: THEME.envelope,
      bg: THEME.bg,
      cardBg: THEME.cardBg,
      cardBorder: THEME.cardBorder,
      primary: THEME.primary,
      secondary: THEME.secondary,
      accent: THEME.accent,
      textPrimary: THEME.textPrimary,
      textSecondary: THEME.textSecondary,
      textMuted: THEME.textMuted,
      displayFont: THEME.displayFont,
      bodyFont: THEME.bodyFont,
      scriptFont: THEME.scriptFont,
      uiFont: THEME.uiFont,
      sectionTitleFont: THEME.sectionTitleFont,
      sectionTitleFontSize: THEME.sectionTitleFontSize,
      sectionTitleFontWeight: THEME.sectionTitleFontWeight,
      ctaPrimaryBg: THEME.ctaPrimaryBg,
      ctaPrimaryText: THEME.ctaPrimaryText,
      ctaSecondaryBorder: THEME.ctaSecondaryBorder,
      ctaSecondaryText: THEME.ctaSecondaryText,
      ctaRadius: THEME.ctaRadius,
      monogramColor: THEME.monogramColor,
      tapTextColor: THEME.tapTextColor,
      bgGradient: THEME.bgGradient,
      decorativeColor: THEME.decorativeColor,
      ctaGlow: THEME.ctaGlow,
    },
    create: THEME,
  });

  console.log(
    `✓ Theme upserted: id=${result.id} name=${result.name} layout=${result.layout}`,
  );
  console.log("");
  console.log("Next steps:");
  console.log("  1. In the admin panel (or Prisma Studio), pick (or create) an invitation.");
  console.log(`  2. Set its themeId to "${result.id}".`);
  console.log("  3. Set externalLink to the Canva-published URL you want embedded.");
  console.log("  4. Visit /<slug> — the curtain-canva flow renders.");
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
