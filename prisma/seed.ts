import "dotenv/config";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Theme seed data (mirrors the built-in theme definitions)
// ---------------------------------------------------------------------------

const THEMES = [
  {
    id: "theme_pink_floral",
    name: "pink-floral",
    label: "Pink Floral",
    description: "Romântico & Elegante",
    envelope: {
      base: "#f4f1e9",
      topFlap: "/images/top.png",
      bottomFlap: "/images/bottom.png",
    },
    bg: "#FEF7F2",
    cardBg: "rgba(255,255,255,0.65)",
    cardBorder: "rgba(201,169,98,0.08)",
    primary: "#8B1A4A",
    secondary: "#8B5E6B",
    accent: "#C4A050",
    textPrimary: "#8B1A4A",
    textSecondary: "#8B5E6B",
    textMuted: "rgba(139,94,107,0.45)",
    displayFont: "'Great Vibes', cursive",
    bodyFont: "'Cormorant Garamond', serif",
    scriptFont: "'Great Vibes', cursive",
    uiFont: "'Outfit', sans-serif",
    ctaPrimaryBg: "#C4A050",
    ctaPrimaryText: "#FFFFFF",
    ctaSecondaryBorder: "#8B1A4A",
    ctaSecondaryText: "#8B1A4A",
    ctaRadius: "9999px",
    monogramColor: "rgba(255,255,255,0.8)",
    tapTextColor: "rgba(255,255,255,0.7)",
    bgGradient:
      "radial-gradient(ellipse at 50% 30%, rgba(196,160,80,0.06) 0%, transparent 70%)",
    decorativeColor: "rgba(196,160,80,0.18)",
    ctaGlow: "rgba(196,160,80,0.25)",
  },
  {
    id: "theme_modern_minimal",
    name: "modern-minimal",
    label: "Modern Minimal",
    description: "Limpo & Sofisticado",
    envelope: {
      base: "#F7F0E8",
      topFlap: "/images/top.png",
      bottomFlap: "/images/bottom.png",
    },
    bg: "#FAFAF7",
    cardBg: "rgba(255,255,255,0.5)",
    cardBorder: "rgba(44,44,44,0.06)",
    primary: "#2C2C2C",
    secondary: "#666666",
    accent: "#D4AF37",
    textPrimary: "#2C2C2C",
    textSecondary: "#888888",
    textMuted: "rgba(136,136,136,0.5)",
    displayFont: "'Playfair Display', serif",
    bodyFont: "'Cormorant Garamond', serif",
    scriptFont: null,
    uiFont: "'Outfit', sans-serif",
    ctaPrimaryBg: "#2C2C2C",
    ctaPrimaryText: "#FAFAF7",
    ctaSecondaryBorder: "#D4AF37",
    ctaSecondaryText: "#D4AF37",
    ctaRadius: "0px",
    monogramColor: "rgba(44,44,44,0.6)",
    tapTextColor: "rgba(44,44,44,0.5)",
    bgGradient:
      "radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.04) 0%, transparent 60%)",
    decorativeColor: "rgba(212,175,55,0.2)",
    ctaGlow: "rgba(44,44,44,0.12)",
  },
  {
    id: "theme_boho_chic",
    name: "boho-chic",
    label: "Boho Chic",
    description: "Rústico & Natural",
    envelope: {
      base: "#F7F0E8",
      topFlap: "/images/top.png",
      bottomFlap: "/images/bottom.png",
    },
    bg: "#F3EBE1",
    cardBg: "rgba(255,255,255,0.42)",
    cardBorder: "rgba(160,113,90,0.08)",
    primary: "#A0715A",
    secondary: "#8B7355",
    accent: "#8B9A7A",
    textPrimary: "#A0715A",
    textSecondary: "#8B7355",
    textMuted: "rgba(139,115,85,0.35)",
    displayFont: "'Homemade Apple', cursive",
    bodyFont: "'Libre Baskerville', serif",
    scriptFont: "'Homemade Apple', cursive",
    uiFont: "'Outfit', sans-serif",
    ctaPrimaryBg: "#A0715A",
    ctaPrimaryText: "#FFFFFF",
    ctaSecondaryBorder: "#A0715A",
    ctaSecondaryText: "#A0715A",
    ctaRadius: "9999px",
    monogramColor: "rgba(255,255,255,0.8)",
    tapTextColor: "rgba(255,255,255,0.65)",
    bgGradient:
      "radial-gradient(ellipse at 50% 35%, rgba(139,154,122,0.06) 0%, transparent 65%)",
    decorativeColor: "rgba(139,154,122,0.22)",
    ctaGlow: "rgba(160,113,90,0.2)",
  },
  {
    id: "theme_midnight_elegance",
    name: "midnight-elegance",
    label: "Midnight Elegance",
    description: "Luxuoso & Dramático",
    envelope: {
      base: "#F7F0E8",
      topFlap: "/images/top.png",
      bottomFlap: "/images/bottom.png",
    },
    bg: "#080C16",
    cardBg: "rgba(255,255,255,0.025)",
    cardBorder: "rgba(255,215,0,0.08)",
    primary: "#FFFFFF",
    secondary: "rgba(255,215,0,0.38)",
    accent: "#FFD700",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.42)",
    textMuted: "rgba(255,255,255,0.19)",
    displayFont: "'Cinzel', serif",
    bodyFont: "'Lora', serif",
    scriptFont: null,
    uiFont: "'Outfit', sans-serif",
    ctaPrimaryBg: "#FFD700",
    ctaPrimaryText: "#080C16",
    ctaSecondaryBorder: "#FFD700",
    ctaSecondaryText: "#FFD700",
    ctaRadius: "0px",
    monogramColor: "rgba(255,215,0,0.6)",
    tapTextColor: "rgba(255,215,0,0.5)",
    bgGradient:
      "radial-gradient(ellipse at 50% 30%, rgba(255,215,0,0.03) 0%, transparent 60%)",
    decorativeColor: "rgba(255,215,0,0.15)",
    ctaGlow: "rgba(255,215,0,0.18)",
  },
];

// Map from template slug → theme id
const TEMPLATE_TO_THEME_ID: Record<string, string> = {
  "pink-floral": "theme_pink_floral",
  "modern-minimal": "theme_modern_minimal",
  "boho-chic": "theme_boho_chic",
  "midnight-elegance": "theme_midnight_elegance",
};

// Read all invitation JSON files
const DATA_DIR = join(process.cwd(), "data", "invitations");

const jsonFiles = [
  "kezia-ruben.json",
  "ana-miguel.json",
  "sofia-pedro.json",
  "leonor-diogo.json",
];

async function main() {
  // ── 1. Upsert themes ──────────────────────────────────────────────────────
  console.log("Seeding themes...");

  for (const theme of THEMES) {
    await prisma.theme.upsert({
      where: { id: theme.id },
      update: {
        name: theme.name,
        label: theme.label,
        description: theme.description,
        envelope: theme.envelope,
        bg: theme.bg,
        cardBg: theme.cardBg,
        cardBorder: theme.cardBorder,
        primary: theme.primary,
        secondary: theme.secondary,
        accent: theme.accent,
        textPrimary: theme.textPrimary,
        textSecondary: theme.textSecondary,
        textMuted: theme.textMuted,
        displayFont: theme.displayFont,
        bodyFont: theme.bodyFont,
        scriptFont: theme.scriptFont,
        uiFont: theme.uiFont,
        ctaPrimaryBg: theme.ctaPrimaryBg,
        ctaPrimaryText: theme.ctaPrimaryText,
        ctaSecondaryBorder: theme.ctaSecondaryBorder,
        ctaSecondaryText: theme.ctaSecondaryText,
        ctaRadius: theme.ctaRadius,
        monogramColor: theme.monogramColor,
        tapTextColor: theme.tapTextColor,
        bgGradient: theme.bgGradient,
        decorativeColor: theme.decorativeColor,
        ctaGlow: theme.ctaGlow,
      },
      create: {
        id: theme.id,
        name: theme.name,
        label: theme.label,
        description: theme.description,
        envelope: theme.envelope,
        bg: theme.bg,
        cardBg: theme.cardBg,
        cardBorder: theme.cardBorder,
        primary: theme.primary,
        secondary: theme.secondary,
        accent: theme.accent,
        textPrimary: theme.textPrimary,
        textSecondary: theme.textSecondary,
        textMuted: theme.textMuted,
        displayFont: theme.displayFont,
        bodyFont: theme.bodyFont,
        scriptFont: theme.scriptFont,
        uiFont: theme.uiFont,
        ctaPrimaryBg: theme.ctaPrimaryBg,
        ctaPrimaryText: theme.ctaPrimaryText,
        ctaSecondaryBorder: theme.ctaSecondaryBorder,
        ctaSecondaryText: theme.ctaSecondaryText,
        ctaRadius: theme.ctaRadius,
        monogramColor: theme.monogramColor,
        tapTextColor: theme.tapTextColor,
        bgGradient: theme.bgGradient,
        decorativeColor: theme.decorativeColor,
        ctaGlow: theme.ctaGlow,
      },
    });
    console.log(`  ✓ theme: ${theme.label}`);
  }

  // ── 2. Upsert invitations ─────────────────────────────────────────────────
  console.log("\nSeeding invitations...");

  for (const file of jsonFiles) {
    const filePath = join(DATA_DIR, file);
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    const themeId = TEMPLATE_TO_THEME_ID[data.template as string];
    if (!themeId) {
      console.warn(
        `  ⚠ Unknown template "${data.template}" for ${file}, skipping`,
      );
      continue;
    }

    await prisma.invitation.upsert({
      where: { slug: data.slug },
      update: {
        themeId,
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
      },
      create: {
        slug: data.slug,
        themeId,
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
      },
    });

    console.log(
      `  ✓ ${data.slug} (${data.couple.bride} & ${data.couple.groom})`,
    );
  }

  // ── 3. Migrate existing RSVPs if they exist ───────────────────────────────
  const rsvpFile = join(process.cwd(), "data", "rsvps.json");
  if (existsSync(rsvpFile)) {
    const rsvpRaw = readFileSync(rsvpFile, "utf-8");
    const rsvps = JSON.parse(rsvpRaw);

    if (Array.isArray(rsvps) && rsvps.length > 0) {
      console.log(`\nMigrating ${rsvps.length} RSVP responses...`);

      for (const rsvp of rsvps) {
        await prisma.rsvpResponse.create({
          data: {
            invitationSlug: rsvp.invitationSlug,
            guestName: rsvp.guestName,
            email: rsvp.email ?? null,
            attending: rsvp.attending,
            dietaryRestrictions: rsvp.dietaryRestrictions ?? null,
            message: rsvp.message ?? null,
            submittedAt: new Date(rsvp.submittedAt),
          },
        });
      }

      console.log("  ✓ RSVPs migrated");
    }
  }

  console.log("\nSeed complete!");
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
