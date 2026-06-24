-- Three new private buckets for the three-part ID upload flow.
-- 5 MB file size cap. JPEG, PNG, and WebP only.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('front_of_id',    'front_of_id',    false, 20971520, ARRAY['image/jpeg','image/png','image/webp']),
  ('back_of_id',     'back_of_id',     false, 20971520, ARRAY['image/jpeg','image/png','image/webp']),
  ('selfie_with_id', 'selfie_with_id', false, 20971520, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public             = false,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Authenticated agents can read objects for signed URL generation (license review flow).
DROP POLICY IF EXISTS "id_upload_files_select_authenticated" ON storage.objects;

CREATE POLICY "id_upload_files_select_authenticated"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('front_of_id', 'back_of_id', 'selfie_with_id'));

-- No INSERT policy needed for anon/authenticated roles.
-- All uploads go through the server-side API using the service role client.

-- New columns on contacts to store each document's storage path.
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS id_front  TEXT,
  ADD COLUMN IF NOT EXISTS id_back   TEXT,
  ADD COLUMN IF NOT EXISTS id_selfie TEXT;
