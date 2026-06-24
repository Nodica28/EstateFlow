-- ============================================================
-- 002_domain_schema.sql
-- Rebuilds contacts, units, and adds leasing_opportunities.
-- Drops tables in reverse-dependency order before recreating.
-- ============================================================

-- Drop dependent tables first
DROP TABLE IF EXISTS ai_conversations  CASCADE;
DROP TABLE IF EXISTS communications    CASCADE;
DROP TABLE IF EXISTS contact_units     CASCADE;
DROP TABLE IF EXISTS leasing_opportunities CASCADE;
DROP TABLE IF EXISTS units             CASCADE;
DROP TABLE IF EXISTS contacts          CASCADE;


-- ============================================================
-- CONTACTS
-- ============================================================
CREATE TABLE contacts (
  id                                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id                            UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  first_name                          TEXT        NOT NULL,
  last_name                           TEXT        NOT NULL,
  type                                TEXT        NOT NULL DEFAULT 'prospect'
                                                    CHECK (type IN ('prospect', 'tenant')),
  -- BIGINT required: 10-digit US numbers exceed INTEGER max (2,147,483,647)
  phone                               BIGINT,
  email                               TEXT,
  -- Path/URL to file in Supabase Storage; binary cannot live in a column
  drivers_license                     TEXT,
  drivers_license_human_verified_date TIMESTAMPTZ,
  qualified_date                      TIMESTAMPTZ,
  monthly_income                      INTEGER,
  has_evictions                       BOOLEAN     NOT NULL DEFAULT FALSE,
  preferred_move_in_date              TIMESTAMPTZ,
  created_at                          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts: agents own their contacts" ON contacts
  FOR ALL USING (agent_id = auth.uid());

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- UNITS
-- ============================================================
CREATE TABLE units (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id   UUID         REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT         NOT NULL,
  stage      TEXT         NOT NULL DEFAULT 'vacant'
                            CHECK (stage IN ('occupied', 'notice', 'vacant', 'terminated')),
  rent       NUMERIC(10,2),
  beds       INTEGER,
  baths      NUMERIC(3,1),
  -- Square footage
  size       INTEGER,
  ttlock_id  INTEGER,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "units: agents own their units" ON units
  FOR ALL USING (agent_id = auth.uid());

CREATE TRIGGER units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- LEASING_OPPORTUNITIES
-- stage is GENERATED from date fields (furthest milestone wins).
-- Priority order: inquired → qualified → scheduled → toured → applied
-- ============================================================
CREATE TABLE leasing_opportunities (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id     UUID        NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  unit_id        UUID        NOT NULL REFERENCES units(id)    ON DELETE CASCADE,

  -- Automatically reflects the furthest completed milestone.
  -- Set the corresponding _date column; this field updates itself.
  stage          TEXT        GENERATED ALWAYS AS (
                               CASE
                                 WHEN applied_date    IS NOT NULL THEN 'applied'
                                 WHEN toured_date     IS NOT NULL THEN 'toured'
                                 WHEN scheduled_date  IS NOT NULL THEN 'scheduled'
                                 WHEN qualified_date  IS NOT NULL THEN 'qualified'
                                 ELSE                                  'inquired'
                               END
                             ) STORED,

  inquired_date  TIMESTAMPTZ,
  qualified_date TIMESTAMPTZ,
  -- When the showing appointment was booked
  scheduled_date TIMESTAMPTZ,
  -- When the showing was set to occur
  showing_date   TIMESTAMPTZ,
  -- When the prospect confirmed they completed the tour
  toured_date    TIMESTAMPTZ,
  applied_date   TIMESTAMPTZ,
  feedback_date  TIMESTAMPTZ,
  feedback       TEXT,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE leasing_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leasing_opportunities: via contacts ownership" ON leasing_opportunities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = leasing_opportunities.contact_id
        AND contacts.agent_id = auth.uid()
    )
  );

CREATE TRIGGER leasing_opportunities_updated_at
  BEFORE UPDATE ON leasing_opportunities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- COMMUNICATIONS (restored, references updated contacts)
-- ============================================================
CREATE TABLE communications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id   UUID        NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  agent_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL CHECK (type IN ('email', 'sms', 'phone')),
  direction    TEXT        NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  subject      TEXT,
  body         TEXT,
  duration_sec INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "communications: via contacts ownership" ON communications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = communications.contact_id
        AND contacts.agent_id = auth.uid()
    )
  );


-- ============================================================
-- AI_CONVERSATIONS (restored, references updated contacts)
-- ============================================================
CREATE TABLE ai_conversations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id UUID        REFERENCES contacts(id) ON DELETE SET NULL,
  messages   JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_conversations: agents own their conversations" ON ai_conversations
  FOR ALL USING (agent_id = auth.uid());

CREATE TRIGGER ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- REALTIME subscriptions
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE units;
ALTER PUBLICATION supabase_realtime ADD TABLE leasing_opportunities;
ALTER PUBLICATION supabase_realtime ADD TABLE communications;
