-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedReason" TEXT;
