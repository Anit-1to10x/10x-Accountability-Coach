-- 10X Accountability Coach - Challenges Schema
-- This table stores streak challenges for cross-device sync

CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'streak' CHECK (type IN ('streak', 'goal', 'habit')),
  target_days INTEGER DEFAULT 30,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_checkins INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  category TEXT,
  tags TEXT[],
  reward TEXT,
  punishment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_from_local BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_challenges_profile ON challenges(profile_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);

-- Updated at trigger
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own challenges" ON challenges;
DROP POLICY IF EXISTS "Users can insert own challenges" ON challenges;
DROP POLICY IF EXISTS "Users can update own challenges" ON challenges;
DROP POLICY IF EXISTS "Users can delete own challenges" ON challenges;
DROP POLICY IF EXISTS "Service role has full access to challenges" ON challenges;

-- Secure RLS Policies
CREATE POLICY "Users can view own challenges" ON challenges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = challenges.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own challenges" ON challenges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = challenges.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own challenges" ON challenges
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = challenges.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own challenges" ON challenges
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = challenges.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

-- Service role bypass
CREATE POLICY "Service role has full access to challenges" ON challenges
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');
