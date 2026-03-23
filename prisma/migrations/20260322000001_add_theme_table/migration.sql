-- CreateTable: Theme
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "envelope" JSONB NOT NULL,
    "bg" TEXT NOT NULL,
    "cardBg" TEXT NOT NULL,
    "cardBorder" TEXT NOT NULL,
    "primary" TEXT NOT NULL,
    "secondary" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "textPrimary" TEXT NOT NULL,
    "textSecondary" TEXT NOT NULL,
    "textMuted" TEXT NOT NULL,
    "displayFont" TEXT NOT NULL,
    "bodyFont" TEXT NOT NULL,
    "scriptFont" TEXT,
    "uiFont" TEXT NOT NULL,
    "ctaPrimaryBg" TEXT NOT NULL,
    "ctaPrimaryText" TEXT NOT NULL,
    "ctaSecondaryBorder" TEXT NOT NULL,
    "ctaSecondaryText" TEXT NOT NULL,
    "ctaRadius" TEXT NOT NULL,
    "monogramColor" TEXT NOT NULL,
    "tapTextColor" TEXT NOT NULL,
    "bgGradient" TEXT,
    "decorativeColor" TEXT NOT NULL,
    "ctaGlow" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Theme_name_key" ON "Theme"("name");

-- Seed the 4 built-in themes
INSERT INTO "Theme" (
  "id", "name", "label", "description",
  "envelope",
  "bg", "cardBg", "cardBorder",
  "primary", "secondary", "accent",
  "textPrimary", "textSecondary", "textMuted",
  "displayFont", "bodyFont", "scriptFont", "uiFont",
  "ctaPrimaryBg", "ctaPrimaryText", "ctaSecondaryBorder", "ctaSecondaryText", "ctaRadius",
  "monogramColor", "tapTextColor",
  "bgGradient", "decorativeColor", "ctaGlow",
  "updatedAt"
) VALUES
(
  'theme_pink_floral', 'pink-floral', 'Pink Floral', 'Romântico & Elegante',
  '{"base":"#f4f1e9","topFlap":"/images/top.png","bottomFlap":"/images/bottom.png"}',
  '#FEF7F2', 'rgba(255,255,255,0.65)', 'rgba(201,169,98,0.08)',
  '#8B1A4A', '#8B5E6B', '#C4A050',
  '#8B1A4A', '#8B5E6B', 'rgba(139,94,107,0.45)',
  '''Great Vibes'', cursive', '''Cormorant Garamond'', serif', '''Great Vibes'', cursive', '''Outfit'', sans-serif',
  '#C4A050', '#FFFFFF', '#8B1A4A', '#8B1A4A', '9999px',
  'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.7)',
  'radial-gradient(ellipse at 50% 30%, rgba(196,160,80,0.06) 0%, transparent 70%)',
  'rgba(196,160,80,0.18)', 'rgba(196,160,80,0.25)',
  CURRENT_TIMESTAMP
),
(
  'theme_modern_minimal', 'modern-minimal', 'Modern Minimal', 'Limpo & Sofisticado',
  '{"base":"#F7F0E8","topFlap":"/images/top.png","bottomFlap":"/images/bottom.png"}',
  '#FAFAF7', 'rgba(255,255,255,0.5)', 'rgba(44,44,44,0.06)',
  '#2C2C2C', '#666666', '#D4AF37',
  '#2C2C2C', '#888888', 'rgba(136,136,136,0.5)',
  '''Playfair Display'', serif', '''Cormorant Garamond'', serif', NULL, '''Outfit'', sans-serif',
  '#2C2C2C', '#FAFAF7', '#D4AF37', '#D4AF37', '0px',
  'rgba(44,44,44,0.6)', 'rgba(44,44,44,0.5)',
  'radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.04) 0%, transparent 60%)',
  'rgba(212,175,55,0.2)', 'rgba(44,44,44,0.12)',
  CURRENT_TIMESTAMP
),
(
  'theme_boho_chic', 'boho-chic', 'Boho Chic', 'Rústico & Natural',
  '{"base":"#F7F0E8","topFlap":"/images/top.png","bottomFlap":"/images/bottom.png"}',
  '#F3EBE1', 'rgba(255,255,255,0.42)', 'rgba(160,113,90,0.08)',
  '#A0715A', '#8B7355', '#8B9A7A',
  '#A0715A', '#8B7355', 'rgba(139,115,85,0.35)',
  '''Homemade Apple'', cursive', '''Libre Baskerville'', serif', '''Homemade Apple'', cursive', '''Outfit'', sans-serif',
  '#A0715A', '#FFFFFF', '#A0715A', '#A0715A', '9999px',
  'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.65)',
  'radial-gradient(ellipse at 50% 35%, rgba(139,154,122,0.06) 0%, transparent 65%)',
  'rgba(139,154,122,0.22)', 'rgba(160,113,90,0.2)',
  CURRENT_TIMESTAMP
),
(
  'theme_midnight_elegance', 'midnight-elegance', 'Midnight Elegance', 'Luxuoso & Dramático',
  '{"base":"#F7F0E8","topFlap":"/images/top.png","bottomFlap":"/images/bottom.png"}',
  '#080C16', 'rgba(255,255,255,0.025)', 'rgba(255,215,0,0.08)',
  '#FFFFFF', 'rgba(255,215,0,0.38)', '#FFD700',
  '#FFFFFF', 'rgba(255,255,255,0.42)', 'rgba(255,255,255,0.19)',
  '''Cinzel'', serif', '''Lora'', serif', NULL, '''Outfit'', sans-serif',
  '#FFD700', '#080C16', '#FFD700', '#FFD700', '0px',
  'rgba(255,215,0,0.6)', 'rgba(255,215,0,0.5)',
  'radial-gradient(ellipse at 50% 30%, rgba(255,215,0,0.03) 0%, transparent 60%)',
  'rgba(255,215,0,0.15)', 'rgba(255,215,0,0.18)',
  CURRENT_TIMESTAMP
);

-- Add themeId column as nullable first so existing rows aren't blocked
ALTER TABLE "Invitation" ADD COLUMN "themeId" TEXT;

-- Populate themeId based on the old template column
UPDATE "Invitation" SET "themeId" = 'theme_pink_floral'       WHERE "template" = 'pink-floral';
UPDATE "Invitation" SET "themeId" = 'theme_modern_minimal'    WHERE "template" = 'modern-minimal';
UPDATE "Invitation" SET "themeId" = 'theme_boho_chic'         WHERE "template" = 'boho-chic';
UPDATE "Invitation" SET "themeId" = 'theme_midnight_elegance' WHERE "template" = 'midnight-elegance';

-- Default any remaining (safety) to pink-floral
UPDATE "Invitation" SET "themeId" = 'theme_pink_floral' WHERE "themeId" IS NULL;

-- Now make it required and add FK
ALTER TABLE "Invitation" ALTER COLUMN "themeId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_themeId_fkey"
  FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old template column
ALTER TABLE "Invitation" DROP COLUMN "template";
