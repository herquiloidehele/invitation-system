import "dotenv/config";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Targeted seed: upserts ONLY the Minimalism Brown theme, its demo invitation
 * and that demo's guestbook entries.
 *
 * `prisma/seed.ts` re-upserts every theme and every landing demo, which against
 * production would overwrite live records — `sofia-pedro` and `leonor-diogo`
 * both exist there, and the five base themes would have any admin
 * customisation reset. This touches nothing else. Run with:
 *   tsx --env-file=.env.production scripts/seed-minimalism-brown.ts   (prod)
 *   tsx --env-file=.env.development scripts/seed-minimalism-brown.ts  (dev)
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(
  pool as unknown as ConstructorParameters<typeof PrismaPg>[0],
);
const prisma = new PrismaClient({ adapter });

// Mirrors the "theme_minimalism_brown" entry in prisma/seed.ts.
const THEME = {
  id: "theme_minimalism_brown",
  name: "minimalism-brown",
  label: "Minimalism Brown",
  description: "Terroso & Minimalista",
  envelope: {
    base: "#FFF7F3",
    topFlap: "/images/top.png",
    bottomFlap: "/images/bottom.png",
  },
  bg: "#FFF7F3",
  cardBg: "#F6EADD",
  cardBorder: "rgba(124,106,96,0.10)",
  primary: "#7C6A60",
  secondary: "#918077",
  accent: "#C8A97E",
  textPrimary: "#7C6A60",
  textSecondary: "#918077",
  textMuted: "rgba(145,128,119,0.55)",
  displayFont: "'EB Garamond', serif",
  bodyFont: "Baskerville, 'Times New Roman', serif",
  scriptFont: "'The Nautigal', cursive",
  uiFont: "'Cormorant Garamond', serif",
  sectionTitleFont: "Baskerville, 'Times New Roman', serif",
  sectionTitleFontSize: 20,
  sectionTitleFontWeight: "700",
  ctaPrimaryBg: "#7C6A60",
  ctaPrimaryText: "#DED9D7",
  ctaSecondaryBorder: "#7C6A60",
  ctaSecondaryText: "#7C6A60",
  ctaRadius: "9999px",
  monogramColor: "rgba(255,255,255,0.85)",
  tapTextColor: "rgba(255,255,255,0.75)",
  bgGradient: null,
  decorativeColor: "rgba(124,106,96,0.18)",
  ctaGlow: "rgba(200,169,126,0.25)",
  layout: "minimalism-brown",
};

async function main() {
  const { id, ...themeFields } = THEME;
  await prisma.theme.upsert({
    where: { id },
    update: themeFields,
    create: { id, ...themeFields },
  });
  console.log(`  ✓ theme: ${THEME.label}`);

  const data = JSON.parse(
    readFileSync(
      join(process.cwd(), "data", "invitations", "constanca-rodrigo.json"),
      "utf-8",
    ),
  );
  if (data.template !== "minimalism-brown") {
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
    faqs: data.faqs ?? null,
    location2: data.location2 ?? null,
    parents: data.parents ?? null,
    countdown: data.countdown ?? null,
    coupleGallery: data.coupleGallery ?? null,
    guestbook: data.guestbook ?? null,
    eventType: data.eventType ?? "wedding",
    heroHeight: data.heroHeight ?? null,
    customTexts: data.customTexts ?? null,
    textStyles: data.textStyles ?? null,
    cardStyles: data.cardStyles ?? null,
    isDemo: true,
  };

  await prisma.invitation.upsert({
    where: { slug: data.slug },
    update: fields,
    create: { slug: data.slug, ...fields },
  });
  console.log(
    `  ✓ invitation: ${data.slug} (${data.couple.bride} & ${data.couple.groom})`,
  );

  // The guestbook renders the messages guests leave on their RSVP, so the demo
  // needs real RsvpResponse rows for that section to show anything.
  for (const [i, wish] of (data.demoWishes ?? []).entries()) {
    const wishId = `demo_wish_${data.slug}_${i}`;
    const row = {
      invitationSlug: data.slug,
      guestName: wish.guestName as string,
      attending: true,
      message: wish.message as string,
      submittedAt: new Date(wish.submittedAt as string),
    };
    await prisma.rsvpResponse.upsert({
      where: { id: wishId },
      update: row,
      create: { id: wishId, ...row },
    });
  }
  console.log(`  ✓ ${(data.demoWishes ?? []).length} guestbook entries`);

  console.log("\nDone — only these records were touched.");
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
