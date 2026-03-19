-- CreateTable
CREATE TABLE "InvitationEvent" (
    "id" TEXT NOT NULL,
    "invitationSlug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "device" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvitationEvent_invitationSlug_idx" ON "InvitationEvent"("invitationSlug");

-- CreateIndex
CREATE INDEX "InvitationEvent_invitationSlug_type_idx" ON "InvitationEvent"("invitationSlug", "type");

-- CreateIndex
CREATE INDEX "InvitationEvent_createdAt_idx" ON "InvitationEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "InvitationEvent" ADD CONSTRAINT "InvitationEvent_invitationSlug_fkey" FOREIGN KEY ("invitationSlug") REFERENCES "Invitation"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
