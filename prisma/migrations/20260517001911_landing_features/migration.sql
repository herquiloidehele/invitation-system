-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "landingDescription" TEXT,
ADD COLUMN     "landingImageUrl" TEXT,
ADD COLUMN     "landingSubtitle" TEXT,
ADD COLUMN     "priceFromCents" INTEGER;

-- AlterTable
ALTER TABLE "SaveTheDate" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "landingDescription" TEXT,
ADD COLUMN     "landingImageUrl" TEXT,
ADD COLUMN     "landingSubtitle" TEXT,
ADD COLUMN     "priceFromCents" INTEGER;

-- CreateTable
CREATE TABLE "LandingFeature" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "galleryCategory" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "invitationId" TEXT,
    "saveTheDateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LandingFeature_section_position_idx" ON "LandingFeature"("section", "position");

-- CreateIndex
CREATE INDEX "LandingFeature_galleryCategory_idx" ON "LandingFeature"("galleryCategory");

-- AddForeignKey
ALTER TABLE "LandingFeature" ADD CONSTRAINT "LandingFeature_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingFeature" ADD CONSTRAINT "LandingFeature_saveTheDateId_fkey" FOREIGN KEY ("saveTheDateId") REFERENCES "SaveTheDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill landing image for existing invitations
UPDATE "Invitation"
SET "landingImageUrl" = "heroImage"
WHERE "landingImageUrl" IS NULL;
