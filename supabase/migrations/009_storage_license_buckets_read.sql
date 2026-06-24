-- Private license buckets + authenticated read (signed/public URLs need SELECT on objects).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('contacts-licenses', 'contacts-licenses', false, NULL, NULL),
  ('drivers-licenses', 'drivers-licenses', false, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "license_files_select_authenticated" ON storage.objects;

CREATE POLICY "license_files_select_authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id IN ('contacts-licenses', 'drivers-licenses'));
