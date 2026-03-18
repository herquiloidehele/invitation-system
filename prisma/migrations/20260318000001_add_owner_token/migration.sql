-- Add ownerToken column as nullable first, populate with gen_random_uuid(), then make it required + unique

ALTER TABLE "Invitation" ADD COLUMN "ownerToken" TEXT;

UPDATE "Invitation" SET "ownerToken" = gen_random_uuid()::TEXT WHERE "ownerToken" IS NULL;

ALTER TABLE "Invitation" ALTER COLUMN "ownerToken" SET NOT NULL;

CREATE UNIQUE INDEX "Invitation_ownerToken_key" ON "Invitation"("ownerToken");
