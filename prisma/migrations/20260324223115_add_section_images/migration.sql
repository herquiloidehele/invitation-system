-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "sectionImages" JSONB;

-- AlterTable
ALTER TABLE "Theme" ALTER COLUMN "updatedAt" DROP DEFAULT;
