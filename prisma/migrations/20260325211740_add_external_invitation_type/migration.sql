-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "externalLink" TEXT,
ADD COLUMN     "invitationType" TEXT NOT NULL DEFAULT 'standard';
