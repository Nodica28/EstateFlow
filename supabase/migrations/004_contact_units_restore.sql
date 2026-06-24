-- 002_domain_schema drops contact_units but never recreates it, so nested selects
-- like units(*, contact_units(...)) fail in PostgREST ("relationship ... not found").

CREATE TABLE IF NOT EXISTS contact_units (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  unit_id     UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'applicant',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contact_id, unit_id)
);

ALTER TABLE contact_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_units: via contacts ownership" ON contact_units
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_units.contact_id
        AND contacts.agent_id = auth.uid()
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE contact_units;
