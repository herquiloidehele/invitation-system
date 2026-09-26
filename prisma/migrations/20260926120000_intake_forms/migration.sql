-- CreateTable
CREATE TABLE "Intake" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "productKind" TEXT NOT NULL,
    "invitationId" TEXT,
    "saveTheDateId" TEXT,
    "demoSlug" TEXT NOT NULL,
    "demoName" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'pt',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "contactName" TEXT,
    "contactWhatsapp" TEXT,
    "lastStep" TEXT,
    "submittedAt" TIMESTAMP(3),
    "answersUpdatedAt" TIMESTAMP(3),
    "adminViewedAt" TIMESTAMP(3),
    "createdInvitationId" TEXT,
    "createdSaveTheDateId" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeAnswer" (
    "id" TEXT NOT NULL,
    "intakeId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Intake_token_key" ON "Intake"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Intake_createdInvitationId_key" ON "Intake"("createdInvitationId");

-- CreateIndex
CREATE UNIQUE INDEX "Intake_createdSaveTheDateId_key" ON "Intake"("createdSaveTheDateId");

-- CreateIndex
CREATE INDEX "Intake_status_createdAt_idx" ON "Intake"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Intake_invitationId_idx" ON "Intake"("invitationId");

-- CreateIndex
CREATE INDEX "Intake_saveTheDateId_idx" ON "Intake"("saveTheDateId");

-- CreateIndex
CREATE UNIQUE INDEX "IntakeAnswer_intakeId_key_key" ON "IntakeAnswer"("intakeId", "key");

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_saveTheDateId_fkey" FOREIGN KEY ("saveTheDateId") REFERENCES "SaveTheDate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_createdInvitationId_fkey" FOREIGN KEY ("createdInvitationId") REFERENCES "Invitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_createdSaveTheDateId_fkey" FOREIGN KEY ("createdSaveTheDateId") REFERENCES "SaveTheDate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeAnswer" ADD CONSTRAINT "IntakeAnswer_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "Intake"("id") ON DELETE CASCADE ON UPDATE CASCADE;
