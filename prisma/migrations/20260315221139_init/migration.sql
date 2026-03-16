-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "couple" JSONB NOT NULL,
    "date" JSONB NOT NULL,
    "quote" TEXT NOT NULL,
    "location" JSONB NOT NULL,
    "rsvp" JSONB NOT NULL,
    "schedule" JSONB NOT NULL,
    "dressCode" TEXT NOT NULL,
    "giftRegistry" JSONB NOT NULL,
    "audio" JSONB NOT NULL,
    "heroImage" TEXT NOT NULL,
    "videoUrl" TEXT,
    "faqs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RsvpResponse" (
    "id" TEXT NOT NULL,
    "invitationSlug" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "email" TEXT,
    "attending" BOOLEAN NOT NULL,
    "guestsCount" INTEGER NOT NULL DEFAULT 1,
    "dietaryRestrictions" TEXT,
    "message" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RsvpResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_slug_key" ON "Invitation"("slug");

-- CreateIndex
CREATE INDEX "RsvpResponse_invitationSlug_idx" ON "RsvpResponse"("invitationSlug");

-- AddForeignKey
ALTER TABLE "RsvpResponse" ADD CONSTRAINT "RsvpResponse_invitationSlug_fkey" FOREIGN KEY ("invitationSlug") REFERENCES "Invitation"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
