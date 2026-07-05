ALTER TABLE "Invitation"
ADD COLUMN "landingCustomizationLevel" TEXT NOT NULL DEFAULT 'fully_customizable';

ALTER TABLE "SaveTheDate"
ADD COLUMN "landingCustomizationLevel" TEXT NOT NULL DEFAULT 'fully_customizable';
