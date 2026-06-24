-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: users manage own" ON profiles
  FOR ALL USING (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- CONTACTS
-- ============================================================
CREATE TABLE contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id          UUID REFERENCES profiles(id) ON DELETE CASCADE,
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  type              TEXT NOT NULL DEFAULT 'prospective_tenant'
                      CHECK (type IN ('prospective_tenant','tenant','owner','vendor','realtor')),
  status            TEXT NOT NULL DEFAULT 'new_lead'
                      CHECK (status IN (
                        'new_lead','contacted','showing_scheduled',
                        'application_submitted','under_review',
                        'approved','rejected','lease_signed'
                      )),
  identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at       TIMESTAMPTZ,
  notes             TEXT,
  source            TEXT DEFAULT 'manual',
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts: agents own their contacts" ON contacts
  FOR ALL USING (agent_id = auth.uid());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- UNITS
-- ============================================================
CREATE TABLE units (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  address      TEXT NOT NULL,
  unit_number  TEXT,
  city         TEXT,
  state        TEXT,
  zip          TEXT,
  bedrooms     INTEGER,
  bathrooms    NUMERIC(3,1),
  rent_amount  NUMERIC(10,2),
  status       TEXT NOT NULL DEFAULT 'available'
                 CHECK (status IN ('available','occupied','maintenance')),
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "units: agents own their units" ON units
  FOR ALL USING (agent_id = auth.uid());

-- ============================================================
-- CONTACT_UNITS (junction)
-- ============================================================
CREATE TABLE contact_units (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  unit_id     UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'applicant',
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
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

-- ============================================================
-- COMMUNICATIONS
-- ============================================================
CREATE TABLE communications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id   UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  agent_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('email','sms','phone')),
  direction    TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  subject      TEXT,
  body         TEXT,
  duration_sec INTEGER,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
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
-- AI_CONVERSATIONS
-- ============================================================
CREATE TABLE ai_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id  UUID REFERENCES contacts(id) ON DELETE SET NULL,
  messages    JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_conversations: agents own their conversations" ON ai_conversations
  FOR ALL USING (agent_id = auth.uid());

CREATE TRIGGER ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE contact_units;
ALTER PUBLICATION supabase_realtime ADD TABLE communications;
