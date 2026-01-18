-- 10X Accountability Coach - Check-ins Schema
-- This table stores daily check-ins for challenges

CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME DEFAULT CURRENT_TIME,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'partial', 'missed', 'skipped')),
  notes TEXT,
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'bad', 'terrible')),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  obstacles TEXT[],
  wins TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_from_local BOOLEAN DEFAULT true,

  -- Ensure one check-in per challenge per day
  UNIQUE(challenge_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checkins_profile ON checkins(profile_id);
CREATE INDEX IF NOT EXISTS idx_checkins_challenge ON checkins(challenge_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(date);

-- Row Level Security
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own checkins" ON checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON checkins;
DROP POLICY IF EXISTS "Users can delete own checkins" ON checkins;
DROP POLICY IF EXISTS "Service role has full access to checkins" ON checkins;

-- Secure RLS Policies
CREATE POLICY "Users can view own checkins" ON checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = checkins.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own checkins" ON checkins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = checkins.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own checkins" ON checkins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = checkins.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own checkins" ON checkins
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = checkins.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

-- Service role bypass
CREATE POLICY "Service role has full access to checkins" ON checkins
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');
