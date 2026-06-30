-- Run these in your Supabase SQL editor

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  uid UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT '',
  date TEXT DEFAULT '',
  "desc" TEXT DEFAULT '',
  file TEXT DEFAULT '',
  security_deposit BIGINT DEFAULT 0,
  rent BIGINT DEFAULT 0,
  security_deposit_received BOOLEAN DEFAULT false,
  rent_received BOOLEAN DEFAULT false,
  deposit_returned BOOLEAN DEFAULT false,
  booked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kassa (cash register) table
CREATE TABLE IF NOT EXISTS kassa (
  id BIGSERIAL PRIMARY KEY,
  uid UUID REFERENCES profiles(id) ON DELETE CASCADE,
  opened_by TEXT NOT NULL DEFAULT '',
  closed_by TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  sub_category TEXT DEFAULT '',
  date TEXT DEFAULT '',
  opening_amount JSONB DEFAULT '{}',
  opening_total BIGINT DEFAULT 0,
  closing_amount JSONB DEFAULT NULL,
  closing_total BIGINT DEFAULT NULL,
  is_open BOOLEAN DEFAULT true,
  booked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ DEFAULT NULL
);

-- Email whitelist table
CREATE TABLE IF NOT EXISTS email_whitelist (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kassa ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_whitelist ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (used by admin client)
-- These policies grant access via the service_role key which your API routes use
CREATE POLICY "Service role can do everything on contracts"
  ON contracts FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on kassa"
  ON kassa FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on email_whitelist"
  ON email_whitelist FOR ALL USING (true) WITH CHECK (true);
