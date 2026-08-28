-- DropIndex
DROP INDEX IF EXISTS "Invitation_scannerToken_key";

-- AlterTable
ALTER TABLE "Invitation" DROP COLUMN IF EXISTS "scannerToken";
