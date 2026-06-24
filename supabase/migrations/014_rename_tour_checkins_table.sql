-- Upgrade path: earlier 013 drafts created leasing_opportunity_tour_checkins.
-- Rename to tour_checkins when that legacy table exists and tour_checkins does not.
DO $$
BEGIN
  IF to_regclass('public.leasing_opportunity_tour_checkins') IS NOT NULL
     AND to_regclass('public.tour_checkins') IS NULL THEN
    ALTER TABLE leasing_opportunity_tour_checkins RENAME TO tour_checkins;
  END IF;
END $$;
