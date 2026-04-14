-- DropColumn: Remove defaultStyles from Model table
-- Default styles now live in component code (components/models/*/defaults.ts)
-- Existing invitations already have their styles stored in the `styles` JSON column

ALTER TABLE "Model" DROP COLUMN IF EXISTS "defaultStyles";
