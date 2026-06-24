-- Align units.stage CHECK with app enums (occupied | notice | vacant | terminated).
-- 002_domain_schema already defines this; this migration is idempotent for older
-- databases where the constraint name or definition may differ.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'units'
      AND column_name = 'stage'
  ) THEN
    ALTER TABLE units DROP CONSTRAINT IF EXISTS units_stage_check;
    ALTER TABLE units
      ADD CONSTRAINT units_stage_check
      CHECK (stage IN ('occupied', 'notice', 'vacant', 'terminated'));
  END IF;
END $$;
