-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "arrivedCount" INTEGER,
ADD COLUMN     "checkedInAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "checkInEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scannerToken" TEXT;

-- AlterTable
ALTER TABLE "RsvpResponse" ADD COLUMN     "arrivedCount" INTEGER,
ADD COLUMN     "checkInToken" TEXT,
ADD COLUMN     "checkedInAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_scannerToken_key" ON "Invitation"("scannerToken");

-- CreateIndex
CREATE UNIQUE INDEX "RsvpResponse_checkInToken_key" ON "RsvpResponse"("checkInToken");

