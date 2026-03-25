-- CTF Geolocation Research Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Research sessions table (tracks unique visitors via cookie)
CREATE TABLE IF NOT EXISTS research_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cookie_id TEXT UNIQUE NOT NULL,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  visit_count INTEGER DEFAULT 1,
  permission_granted BOOLEAN DEFAULT FALSE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location entries table
CREATE TABLE IF NOT EXISTS location_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES research_sessions(id) ON DELETE CASCADE,
  cookie_id TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  ip_address TEXT,
  user_agent TEXT,
  permission_state TEXT CHECK (permission_state IN ('granted', 'denied', 'prompt')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  country TEXT,
  city TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CTF challenge flags table (for academic CTF use)
CREATE TABLE IF NOT EXISTS ctf_flags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flag_name TEXT NOT NULL,
  flag_value TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 100,
  category TEXT DEFAULT 'web',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flag submissions table
CREATE TABLE IF NOT EXISTS flag_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES research_sessions(id),
  cookie_id TEXT NOT NULL,
  flag_attempted TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Research notes / admin annotations
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES research_sessions(id),
  note TEXT NOT NULL,
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_location_entries_cookie ON location_entries(cookie_id);
CREATE INDEX idx_location_entries_session ON location_entries(session_id);
CREATE INDEX idx_location_entries_timestamp ON location_entries(timestamp DESC);
CREATE INDEX idx_sessions_cookie ON research_sessions(cookie_id);
CREATE INDEX idx_sessions_last_seen ON research_sessions(last_seen DESC);

-- Row Level Security (RLS)
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctf_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE flag_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- Public can insert their own session data
CREATE POLICY "Allow public insert sessions" ON research_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read own session" ON research_sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow public update own session" ON research_sessions
  FOR UPDATE USING (true);

CREATE POLICY "Allow public insert locations" ON location_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read own locations" ON location_entries
  FOR SELECT USING (true);

-- CTF flags are public read
CREATE POLICY "Allow public read active flags" ON ctf_flags
  FOR SELECT USING (is_active = true);

-- Flag submissions are public insert
CREATE POLICY "Allow public submit flags" ON flag_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read own submissions" ON flag_submissions
  FOR SELECT USING (true);

-- Insert some sample CTF flags for the research challenge
INSERT INTO ctf_flags (flag_name, flag_value, description, points, category) VALUES
  ('permission_bypass_theory', 'CTF{br0ws3r_p3rm1ss10ns_c4nn0t_b3_byp4ss3d}', 'Understanding that browser geolocation permissions cannot be bypassed via JavaScript', 100, 'web'),
  ('cookie_tracking', 'CTF{c00k13s_p3rs1st_4cr0ss_s3ss10ns}', 'Understanding persistent cookie-based tracking', 150, 'web'),
  ('ip_geolocation', 'CTF{1P_g3010c4t10n_1s_4ppr0x1m4t3}', 'IP-based geolocation vs GPS precision analysis', 200, 'network'),
  ('consent_model', 'CTF{1nf0rm3d_c0ns3nt_1s_3th1c4l_b4s3l1n3}', 'Ethical consent framework for location tracking', 250, 'compliance');
