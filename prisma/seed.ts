import "dotenv/config";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Import default styles from model component code
import { DEFAULT_STYLES as ModernMinimalStyles } from "@/components/models/ModernMinimal/defaults";

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
    name: "modern-minimal",
    label: "Modern Minimal",
    description: "Limpo & Sofisticado",
    component: "ModernMinimal",
  },
];

// Map from model name → default styles (from code constants)
const MODEL_STYLES: Record<string, object> = {
  "modern-minimal": ModernMinimalStyles,
};

// Map from old template slug (in JSON files) → model name
const TEMPLATE_TO_MODEL_NAME: Record<string, string> = {
  "modern-minimal": "modern-minimal",
};

// Read all invitation JSON files
const DATA_DIR = join(process.cwd(), "data", "invitations");

const jsonFiles = ["ana-miguel.json"];

async function main() {
  // ── 1. Seed models (find-or-create) ───────────────────────────────────────
  console.log("Seeding models...");

  const modelNameToId: Record<string, string> = {};

  for (const model of MODELS) {
    const existing = await prisma.model.findUnique({
      where: { name: model.name },
    });

    if (existing) {
      await prisma.model.update({
        where: { name: model.name },
        data: {
          label: model.label,
          description: model.description,
          component: model.component,
        },
      });
      modelNameToId[model.name] = existing.id;
      console.log(`  ✓ model (updated): ${model.label} (${model.component})`);
    } else {
      const created = await prisma.model.create({
        data: {
          name: model.name,
          label: model.label,
          description: model.description,
          component: model.component,
        },
      });
      modelNameToId[model.name] = created.id;
      console.log(`  ✓ model (created): ${model.label} (${model.component})`);
    }
  }

  // ── 2. Seed invitations ───────────────────────────────────────────────────
  console.log("\nSeeding invitations...");

  for (const file of jsonFiles) {
    const filePath = join(DATA_DIR, file);
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    const modelName = TEMPLATE_TO_MODEL_NAME[data.template as string];
    if (!modelName) {
      console.warn(
        `  ⚠ Unknown template "${data.template}" for ${file}, skipping`,
      );
      continue;
    }

    const modelId = modelNameToId[modelName];
    if (!modelId) {
      console.warn(
        `  ⚠ Model "${modelName}" not found in DB for ${file}, skipping`,
      );
      continue;
    }

    const styles = MODEL_STYLES[modelName];

    const existingInvitation = await prisma.invitation.findUnique({
      where: { slug: data.slug },
    });

    if (existingInvitation) {
      await prisma.invitation.update({
        where: { slug: data.slug },
        data: {
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
    } else {
      await prisma.invitation.create({
        data: {
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
    }

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
