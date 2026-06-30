-- AlterTable
ALTER TABLE "RsvpResponse" ADD COLUMN     "numAdults" INTEGER,
ADD COLUMN     "numChildren" INTEGER;

-- AlterTable
ALTER TABLE "SaveTheDateRsvpResponse" ADD COLUMN     "numAdults" INTEGER,
ADD COLUMN     "numChildren" INTEGER;
