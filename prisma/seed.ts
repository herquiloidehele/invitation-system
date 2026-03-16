import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const pool = new pg.Pool({
  host: "localhost",
  port: 5433,
  user: process.env.USER || "hhele",
  database: "invitations",
  password: "",
});
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

// Read all invitation JSON files
const DATA_DIR = join(process.cwd(), "data", "invitations");

const jsonFiles = [
  "kezia-ruben.json",
  "ana-miguel.json",
  "sofia-pedro.json",
  "leonor-diogo.json",
];

async function main() {
  console.log("Seeding invitations...");

  for (const file of jsonFiles) {
    const filePath = join(DATA_DIR, file);
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    await prisma.invitation.upsert({
      where: { slug: data.slug },
      update: {
        template: data.template,
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
        template: data.template,
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

    console.log(`  ✓ ${data.slug} (${data.couple.bride} & ${data.couple.groom})`);
  }

  // Migrate existing RSVPs if they exist
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
            guestsCount: rsvp.guestsCount ?? 1,
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
