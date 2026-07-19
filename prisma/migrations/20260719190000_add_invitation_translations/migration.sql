ALTER TABLE "Invitation"
ADD COLUMN "languageSwitcherEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "enabledLocales" TEXT[] NOT NULL DEFAULT ARRAY['pt']::TEXT[],
ADD COLUMN "translations" JSONB;
