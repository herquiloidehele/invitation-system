-- CreateTable
CREATE TABLE "AiAttachment" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "messageId" TEXT,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiAttachment_buildId_idx" ON "AiAttachment"("buildId");

-- CreateIndex
CREATE INDEX "AiAttachment_invitationId_idx" ON "AiAttachment"("invitationId");

-- AddForeignKey
ALTER TABLE "AiAttachment" ADD CONSTRAINT "AiAttachment_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "AiBuild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

