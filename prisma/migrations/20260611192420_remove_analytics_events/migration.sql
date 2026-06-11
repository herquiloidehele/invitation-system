-- DropForeignKey
ALTER TABLE "InvitationEvent" DROP CONSTRAINT "InvitationEvent_invitationSlug_fkey";

-- DropForeignKey
ALTER TABLE "SaveTheDateEvent" DROP CONSTRAINT "SaveTheDateEvent_slug_fkey";

-- DropTable
DROP TABLE "InvitationEvent";

-- DropTable
DROP TABLE "SaveTheDateEvent";

