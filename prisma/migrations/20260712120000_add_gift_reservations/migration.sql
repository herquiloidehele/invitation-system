CREATE TABLE "GiftReservation" (
  "id" TEXT NOT NULL,
  "invitationSlug" TEXT NOT NULL,
  "giftItemId" TEXT NOT NULL,
  "giftName" TEXT NOT NULL,
  "guestName" TEXT NOT NULL,
  "guestId" TEXT,
  "managementToken" TEXT,
  "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GiftReservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GiftReservation_guestId_key"
  ON "GiftReservation"("guestId");

CREATE UNIQUE INDEX "GiftReservation_managementToken_key"
  ON "GiftReservation"("managementToken");

CREATE UNIQUE INDEX "GiftReservation_invitationSlug_giftItemId_key"
  ON "GiftReservation"("invitationSlug", "giftItemId");

CREATE INDEX "GiftReservation_invitationSlug_idx"
  ON "GiftReservation"("invitationSlug");

ALTER TABLE "GiftReservation"
  ADD CONSTRAINT "GiftReservation_invitationSlug_fkey"
  FOREIGN KEY ("invitationSlug") REFERENCES "Invitation"("slug")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GiftReservation"
  ADD CONSTRAINT "GiftReservation_guestId_fkey"
  FOREIGN KEY ("guestId") REFERENCES "Guest"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
