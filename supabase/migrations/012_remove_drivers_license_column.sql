-- Reset all verification timestamps so agents must re-verify using the new 3-image system.
UPDATE contacts SET drivers_license_human_verified_date = NULL;

-- Drop the old single-image column.
ALTER TABLE contacts DROP COLUMN IF EXISTS drivers_license;

-- NOTE: The contacts-licenses and drivers-licenses storage buckets cannot be deleted
-- via SQL (Supabase blocks direct DML on storage.objects). Delete them manually:
--   Supabase Dashboard → Storage → select bucket → Empty → Delete
-- Or run via the Storage API / Supabase CLI storage commands.
