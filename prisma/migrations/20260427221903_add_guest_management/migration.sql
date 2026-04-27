-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "guestManagementEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "guestMessageTemplate" TEXT;

-- AlterTable
ALTER TABLE "RsvpResponse" ADD COLUMN     "guestId" TEXT;

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "invitationSlug" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slugifiedName" TEXT NOT NULL,
    "companion" TEXT,
    "phoneCountryCode" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "tableLabel" TEXT NOT NULL,
    "canInviteOthers" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_token_key" ON "Guest"("token");

-- CreateIndex
CREATE INDEX "Guest_invitationSlug_idx" ON "Guest"("invitationSlug");

-- CreateIndex
CREATE INDEX "Guest_token_idx" ON "Guest"("token");

-- CreateIndex
CREATE INDEX "RsvpResponse_guestId_idx" ON "RsvpResponse"("guestId");

-- AddForeignKey
ALTER TABLE "RsvpResponse" ADD CONSTRAINT "RsvpResponse_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_invitationSlug_fkey" FOREIGN KEY ("invitationSlug") REFERENCES "Invitation"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
