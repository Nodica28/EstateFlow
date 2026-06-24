-- Tour check-in: unit geofence + audit log (public check-in via service-role API).

ALTER TABLE units
  ADD COLUMN IF NOT EXISTS tour_checkin_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS tour_checkin_longitude DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS tour_checkins (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leasing_opportunity_id  UUID NOT NULL REFERENCES leasing_opportunities(id) ON DELETE CASCADE,
  latitude                DOUBLE PRECISION NOT NULL,
  longitude               DOUBLE PRECISION NOT NULL,
  accuracy_meters         DOUBLE PRECISION,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tour_checkins_lo_id_idx
  ON tour_checkins (leasing_opportunity_id);

CREATE INDEX IF NOT EXISTS tour_checkins_created_at_idx
  ON tour_checkins (created_at DESC);

ALTER TABLE tour_checkins ENABLE ROW LEVEL SECURITY;

-- Agents can read check-ins for opportunities on their contacts (dashboard / future UI).
CREATE POLICY "tour_checkins: agents select own"
  ON tour_checkins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM leasing_opportunities lo
      JOIN contacts c ON c.id = lo.contact_id
      WHERE lo.id = tour_checkins.leasing_opportunity_id
        AND c.agent_id = auth.uid()
    )
  );

-- Inserts are performed by the Next.js API using the service role (bypasses RLS).
-- No INSERT policy for authenticated/anon.
