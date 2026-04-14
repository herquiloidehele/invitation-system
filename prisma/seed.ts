import "dotenv/config";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Import default styles from model component code
import { DEFAULT_STYLES as ClassicFloralStyles } from "@/components/models/ClassicFloral/defaults";
import { DEFAULT_STYLES as ModernMinimalStyles } from "@/components/models/ModernMinimal/defaults";
import { DEFAULT_STYLES as BohoNaturalStyles } from "@/components/models/BohoNatural/defaults";
import { DEFAULT_STYLES as MidnightLuxeStyles } from "@/components/models/MidnightLuxe/defaults";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Model seed data — each model defines structure (component) only
// ---------------------------------------------------------------------------

const MODELS = [
  {
    id: "model_classic_floral",
    name: "classic-floral",
    label: "Classic Floral",
    description: "Romântico & Elegante",
    component: "ClassicFloral",
  },
  {
    id: "model_modern_minimal",
    name: "modern-minimal",
    label: "Modern Minimal",
    description: "Limpo & Sofisticado",
    component: "ModernMinimal",
  },
  {
    id: "model_boho_natural",
    name: "boho-natural",
    label: "Boho Natural",
    description: "Rústico & Natural",
    component: "BohoNatural",
  },
  {
    id: "model_midnight_luxe",
    name: "midnight-luxe",
    label: "Midnight Luxe",
    description: "Luxuoso & Dramático",
    component: "MidnightLuxe",
  },
];

// Map from model id → default styles (from code constants)
const MODEL_STYLES: Record<string, object> = {
  model_classic_floral: ClassicFloralStyles,
  model_modern_minimal: ModernMinimalStyles,
  model_boho_natural: BohoNaturalStyles,
  model_midnight_luxe: MidnightLuxeStyles,
};

// Map from old template slug (in JSON files) → model id
const TEMPLATE_TO_MODEL_ID: Record<string, string> = {
  "pink-floral": "model_classic_floral",
  "modern-minimal": "model_modern_minimal",
  "boho-chic": "model_boho_natural",
  "midnight-elegance": "model_midnight_luxe",
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
  // ── 1. Upsert models ─────────────────────────────────────────────────────
  console.log("Seeding models...");

  for (const model of MODELS) {
    await prisma.model.upsert({
      where: { id: model.id },
      update: {
        name: model.name,
        label: model.label,
        description: model.description,
        component: model.component,
      },
      create: {
        id: model.id,
        name: model.name,
        label: model.label,
        description: model.description,
        component: model.component,
      },
    });
    console.log(`  ✓ model: ${model.label} (${model.component})`);
  }

  // ── 2. Upsert invitations ─────────────────────────────────────────────────
  console.log("\nSeeding invitations...");

  for (const file of jsonFiles) {
    const filePath = join(DATA_DIR, file);
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    const modelId = TEMPLATE_TO_MODEL_ID[data.template as string];
    if (!modelId) {
      console.warn(
        `  ⚠ Unknown template "${data.template}" for ${file}, skipping`,
      );
      continue;
    }

    // Copy-on-create: the invitation gets the model's default styles from code
    const styles = MODEL_STYLES[modelId];

    await prisma.invitation.upsert({
      where: { slug: data.slug },
      update: {
        modelId,
        styles,
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
        faqs: data.faqs ?? null,
      },
      create: {
        slug: data.slug,
        modelId,
        styles,
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
