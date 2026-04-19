-- CreateTable
CREATE TABLE "SaveTheDateTheme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "heartColor" TEXT NOT NULL,
    "heartGlitterColors" JSONB NOT NULL,
    "heartTextureUrl" TEXT,
    "bgColor" TEXT NOT NULL,
    "titleFont" TEXT NOT NULL,
    "coupleFont" TEXT NOT NULL,
    "dateFont" TEXT NOT NULL,
    "textColor" TEXT NOT NULL,
    "confettiColors" JSONB NOT NULL,
    "envelope" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaveTheDateTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaveTheDate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "couple" JSONB NOT NULL,
    "date" JSONB NOT NULL,
    "customMessage" TEXT,
    "envelope" JSONB,
    "textStyles" JSONB,
    "rsvp" JSONB,
    "ownerToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaveTheDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaveTheDateEvent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "device" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaveTheDateEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaveTheDateRsvpResponse" (
    "id" TEXT NOT NULL,
    "saveTheDateSlug" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "email" TEXT,
    "attending" BOOLEAN NOT NULL,
    "dietaryRestrictions" TEXT,
    "message" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaveTheDateRsvpResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SaveTheDateTheme_name_key" ON "SaveTheDateTheme"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SaveTheDate_slug_key" ON "SaveTheDate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SaveTheDate_ownerToken_key" ON "SaveTheDate"("ownerToken");

-- CreateIndex
CREATE INDEX "SaveTheDateEvent_slug_idx" ON "SaveTheDateEvent"("slug");

-- CreateIndex
CREATE INDEX "SaveTheDateEvent_slug_type_idx" ON "SaveTheDateEvent"("slug", "type");

-- CreateIndex
CREATE INDEX "SaveTheDateEvent_createdAt_idx" ON "SaveTheDateEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SaveTheDateRsvpResponse_saveTheDateSlug_idx" ON "SaveTheDateRsvpResponse"("saveTheDateSlug");

-- AddForeignKey
ALTER TABLE "SaveTheDate" ADD CONSTRAINT "SaveTheDate_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "SaveTheDateTheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaveTheDateEvent" ADD CONSTRAINT "SaveTheDateEvent_slug_fkey" FOREIGN KEY ("slug") REFERENCES "SaveTheDate"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaveTheDateRsvpResponse" ADD CONSTRAINT "SaveTheDateRsvpResponse_saveTheDateSlug_fkey" FOREIGN KEY ("saveTheDateSlug") REFERENCES "SaveTheDate"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
