-- CreateTable
CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "revisionId" TEXT,
    "costUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiMessage_buildId_idx" ON "AiMessage"("buildId");

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "AiBuild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

