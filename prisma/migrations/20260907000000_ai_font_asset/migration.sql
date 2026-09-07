-- CreateTable
CREATE TABLE "AiFontAsset" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "messageId" TEXT,
    "customFontFamilyId" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "cssFamily" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiFontAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiFontAsset_buildId_idx" ON "AiFontAsset"("buildId");

-- CreateIndex
CREATE INDEX "AiFontAsset_invitationId_idx" ON "AiFontAsset"("invitationId");

-- AddForeignKey
ALTER TABLE "AiFontAsset" ADD CONSTRAINT "AiFontAsset_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "AiBuild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiFontAsset" ADD CONSTRAINT "AiFontAsset_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AiMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
