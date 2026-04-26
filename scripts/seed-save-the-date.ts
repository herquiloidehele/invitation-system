/**
 * Seed script for Save The Date test data.
 * Run: npx tsx scripts/seed-save-the-date.ts
 */
import { prisma } from "../lib/db";

async function main() {
  // 1. Create or upsert the golden-heart theme
  const theme = await prisma.saveTheDateTheme.upsert({
    where: { name: "golden-heart" },
    update: {},
    create: {
      name: "golden-heart",
      label: "Golden Heart",
      description: "Classic gold glitter heart scratch-off",
      heartColor: "#D4AF37",
      rsvpButtonBgColor: "#8B7536",
      heartGlitterColors: [
        "#D4AF37",
        "#C5A028",
        "#E8C547",
        "#F5E6A3",
        "#FFFFFF",
      ],
      bgColor: "#FFFFFF",
      titleFont: "'Great Vibes', cursive",
      coupleFont: "'Cormorant Garamond', serif",
      dateFont: "'Cormorant Garamond', serif",
      textColor: "#2C2C2C",
      confettiColors: [
        "#D4AF37",
        "#C5A028",
        "#E8C547",
        "#F5E6A3",
        "#8B7536",
      ],
    },
  });

  console.log("Theme created:", theme.id, theme.name);

  // 2. Create a test save-the-date
  const std = await prisma.saveTheDate.upsert({
    where: { slug: "alba-javier" },
    update: {},
    create: {
      slug: "alba-javier",
      themeId: theme.id,
      couple: { bride: "Alba", groom: "Javier" },
      date: {
        iso: "2027-09-12",
        display: "12 de Setembro de 2027",
        day: "12",
        month: "09",
        year: "2027",
      },
      customMessage: "estão convidados para celebrar o dia",
    },
  });

  console.log("Save The Date created:", std.id, std.slug);
  console.log(`\nView at: http://localhost:3000/s/${std.slug}`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
