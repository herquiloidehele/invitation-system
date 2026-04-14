-- ===========================================================================
-- Migration: Rename Theme → Model, flatten visual styling into invitation.styles
-- ===========================================================================

-- 1. Create the Model table
CREATE TABLE "Model" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "previewImage" TEXT,
    "defaultStyles" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Model_name_key" ON "Model"("name");

-- 2. Populate Model from Theme — build defaultStyles JSON from individual columns
--    Map old theme names to new model names & component names
INSERT INTO "Model" ("id", "name", "label", "description", "component", "defaultStyles", "createdAt", "updatedAt")
SELECT
    CASE t."id"
        WHEN 'theme_pink_floral'       THEN 'model_classic_floral'
        WHEN 'theme_modern_minimal'    THEN 'model_modern_minimal'
        WHEN 'theme_boho_chic'         THEN 'model_boho_natural'
        WHEN 'theme_midnight_elegance' THEN 'model_midnight_luxe'
        ELSE 'model_' || replace(t."name", '-', '_')
    END,
    CASE t."name"
        WHEN 'pink-floral'       THEN 'classic-floral'
        WHEN 'boho-chic'         THEN 'boho-natural'
        WHEN 'midnight-elegance' THEN 'midnight-luxe'
        ELSE t."name"
    END,
    CASE t."label"
        WHEN 'Pink Floral'       THEN 'Classic Floral'
        WHEN 'Boho Chic'         THEN 'Boho Natural'
        WHEN 'Midnight Elegance' THEN 'Midnight Luxe'
        ELSE t."label"
    END,
    t."description",
    CASE t."name"
        WHEN 'pink-floral'       THEN 'ClassicFloral'
        WHEN 'modern-minimal'    THEN 'ModernMinimal'
        WHEN 'boho-chic'         THEN 'BohoNatural'
        WHEN 'midnight-elegance' THEN 'MidnightLuxe'
        ELSE 'ClassicFloral'
    END,
    jsonb_build_object(
        'envelope', t."envelope",
        'bg', t."bg",
        'cardBg', t."cardBg",
        'cardBorder', t."cardBorder",
        'primary', t."primary",
        'secondary', t."secondary",
        'accent', t."accent",
        'textPrimary', t."textPrimary",
        'textSecondary', t."textSecondary",
        'textMuted', t."textMuted",
        'displayFont', t."displayFont",
        'bodyFont', t."bodyFont",
        'scriptFont', t."scriptFont",
        'uiFont', t."uiFont",
        'sectionTitleFont', t."sectionTitleFont",
        'sectionTitleFontSize', t."sectionTitleFontSize",
        'sectionTitleFontWeight', t."sectionTitleFontWeight",
        'ctaPrimaryBg', t."ctaPrimaryBg",
        'ctaPrimaryText', t."ctaPrimaryText",
        'ctaSecondaryBorder', t."ctaSecondaryBorder",
        'ctaSecondaryText', t."ctaSecondaryText",
        'ctaRadius', t."ctaRadius",
        'monogramColor', t."monogramColor",
        'tapTextColor', t."tapTextColor",
        'bgGradient', t."bgGradient",
        'decorativeColor', t."decorativeColor",
        'ctaGlow', t."ctaGlow"
    ),
    t."createdAt",
    t."updatedAt"
FROM "Theme" t;

-- 3. Add modelId and styles columns to Invitation (nullable first)
ALTER TABLE "Invitation" ADD COLUMN "modelId" TEXT;
ALTER TABLE "Invitation" ADD COLUMN "styles" JSONB;

-- 4. Populate modelId from themeId mapping
UPDATE "Invitation" SET "modelId" = CASE "themeId"
    WHEN 'theme_pink_floral'       THEN 'model_classic_floral'
    WHEN 'theme_modern_minimal'    THEN 'model_modern_minimal'
    WHEN 'theme_boho_chic'         THEN 'model_boho_natural'
    WHEN 'theme_midnight_elegance' THEN 'model_midnight_luxe'
    ELSE 'model_classic_floral'
END;

-- 5. Populate styles by merging model defaultStyles with any per-invitation overrides
--    Start with the model's defaultStyles, then overlay:
--    - invitation.envelope (if set)
--    - invitation.saveDateStyle
--    - invitation.textStyles → textOverrides
--    - invitation.cardStyles → cardOverrides
UPDATE "Invitation" i SET "styles" = (
    SELECT
        m."defaultStyles"
        -- Overlay envelope if the invitation had a custom one
        || CASE WHEN i."envelope" IS NOT NULL AND i."envelope" != 'null'::jsonb
            THEN jsonb_build_object('envelope', i."envelope")
            ELSE '{}'::jsonb
        END
        -- Overlay saveDateStyle
        || CASE WHEN i."saveDateStyle" IS NOT NULL
            THEN jsonb_build_object('saveDateStyle', to_jsonb(i."saveDateStyle"))
            ELSE '{}'::jsonb
        END
        -- Overlay textOverrides from textStyles
        || CASE WHEN i."textStyles" IS NOT NULL AND i."textStyles" != 'null'::jsonb
            THEN jsonb_build_object('textOverrides', i."textStyles")
            ELSE '{}'::jsonb
        END
        -- Overlay cardOverrides from cardStyles
        || CASE WHEN i."cardStyles" IS NOT NULL AND i."cardStyles" != 'null'::jsonb
            THEN jsonb_build_object('cardOverrides', i."cardStyles")
            ELSE '{}'::jsonb
        END
    FROM "Model" m
    WHERE m."id" = i."modelId"
);

-- Safety: any invitation without styles gets a minimal default
UPDATE "Invitation" SET "styles" = '{}'::jsonb WHERE "styles" IS NULL;

-- 6. Make modelId and styles required
ALTER TABLE "Invitation" ALTER COLUMN "modelId" SET NOT NULL;
ALTER TABLE "Invitation" ALTER COLUMN "styles" SET NOT NULL;

-- 7. Add FK from Invitation.modelId → Model.id
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_modelId_fkey"
    FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 8. Drop old FK and columns
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_themeId_fkey";
ALTER TABLE "Invitation" DROP COLUMN "themeId";
ALTER TABLE "Invitation" DROP COLUMN "envelope";
ALTER TABLE "Invitation" DROP COLUMN "saveDateStyle";
ALTER TABLE "Invitation" DROP COLUMN "textStyles";
ALTER TABLE "Invitation" DROP COLUMN "cardStyles";

-- 9. Drop the old Theme table
DROP TABLE "Theme";
