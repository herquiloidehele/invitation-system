-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "activeRevisionId" TEXT,
ADD COLUMN     "renderMode" TEXT NOT NULL DEFAULT 'standard';

-- CreateTable
CREATE TABLE "AiBuild" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "agentSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiBuild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRevision" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "prompt" TEXT,
    "sourceFiles" JSONB NOT NULL,
    "bundleKey" TEXT,
    "publishedAt" TIMESTAMP(3),
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiBuild_invitationId_idx" ON "AiBuild"("invitationId");

-- CreateIndex
CREATE INDEX "AiRevision_buildId_idx" ON "AiRevision"("buildId");

-- CreateIndex
CREATE INDEX "AiRevision_invitationId_idx" ON "AiRevision"("invitationId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_activeRevisionId_key" ON "Invitation"("activeRevisionId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_activeRevisionId_fkey" FOREIGN KEY ("activeRevisionId") REFERENCES "AiRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiBuild" ADD CONSTRAINT "AiBuild_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRevision" ADD CONSTRAINT "AiRevision_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "AiBuild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

