-- AlterTable: Convert dressCode from TEXT to JSONB
-- First convert existing string values to JSON objects with { enabled: true, text: <old_value> }
-- Empty strings become { enabled: false, text: "" }

-- Step 1: Add a temporary JSONB column
ALTER TABLE "Invitation" ADD COLUMN "dressCode_new" JSONB;

-- Step 2: Migrate existing data
UPDATE "Invitation"
SET "dressCode_new" = CASE
  WHEN "dressCode" = '' THEN '{"enabled": false, "text": ""}'::jsonb
  ELSE jsonb_build_object('enabled', true, 'text', "dressCode")
END;

-- Step 3: Drop old column and rename new one
ALTER TABLE "Invitation" DROP COLUMN "dressCode";
ALTER TABLE "Invitation" RENAME COLUMN "dressCode_new" TO "dressCode";

-- Step 4: Set NOT NULL constraint
ALTER TABLE "Invitation" ALTER COLUMN "dressCode" SET NOT NULL;
