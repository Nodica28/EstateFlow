-- ============================================================
-- 010_leasing_opportunities_v2.sql
-- Updates the leasing_opportunities stage generated column to
-- include 'showing' and 'feedback' stages.
-- Drops scheduled_date (superseded by showing_date).
-- New priority order (highest wins):
--   applied > feedback > toured > showing > qualified > inquired
-- ============================================================

-- Drop the existing generated column (cannot ALTER GENERATED expression in-place)
ALTER TABLE leasing_opportunities DROP COLUMN stage;

-- Drop scheduled_date (was "when showing was booked"; showing_date covers the actual date)
ALTER TABLE leasing_opportunities DROP COLUMN IF EXISTS scheduled_date;

-- Re-add stage with corrected CASE expression
ALTER TABLE leasing_opportunities
  ADD COLUMN stage TEXT GENERATED ALWAYS AS (
    CASE
      WHEN applied_date   IS NOT NULL THEN 'applied'
      WHEN feedback_date  IS NOT NULL THEN 'feedback'
      WHEN toured_date    IS NOT NULL THEN 'toured'
      WHEN showing_date   IS NOT NULL THEN 'showing'
      WHEN qualified_date IS NOT NULL THEN 'qualified'
      ELSE                                 'inquired'
    END
  ) STORED;
