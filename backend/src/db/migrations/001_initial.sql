-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'soft_block' CHECK (status IN ('soft_block', 'confirmed')),
  city TEXT NOT NULL DEFAULT 'Delhi' CHECK (city IN ('Delhi', 'Mumbai', 'Nagpur', 'Hyderabad')),
  event_date DATE,
  client_name TEXT,
  venue TEXT,
  timing_from TIME,
  timing_to TIME,
  poc_name TEXT,
  poc_number TEXT,
  photobooth_type TEXT,
  package TEXT,
  num_prints INTEGER,
  template_status TEXT DEFAULT 'not_started' CHECK (template_status IN ('not_started', 'in_progress', 'done')),
  invoice_raised BOOLEAN DEFAULT FALSE,
  payment_received BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Team members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone_number TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Event ↔ Team join table
CREATE TABLE event_team (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE RESTRICT,
  PRIMARY KEY (event_id, team_member_id)
);

-- Persistent dropdown options (photobooth_type, package)
CREATE TABLE dropdown_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL,
  value TEXT NOT NULL,
  UNIQUE (field_name, value)
);

-- App settings (key-value)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Auto-update updated_at on events
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed default dropdown options
INSERT INTO dropdown_options (field_name, value) VALUES
  ('photobooth_type', 'Open Booth'),
  ('photobooth_type', 'Enclosed Booth'),
  ('photobooth_type', '360 Booth'),
  ('photobooth_type', 'Mirror Booth'),
  ('package', 'Basic'),
  ('package', 'Standard'),
  ('package', 'Premium');

-- Seed default settings
INSERT INTO settings (key, value) VALUES
  ('briefing_time', '09:00'),
  ('user_telegram_chat_id', ''),
  ('boss_telegram_chat_id', '');
