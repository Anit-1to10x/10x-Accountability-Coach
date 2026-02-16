-- 10X Accountability Coach - Profiles Schema
-- This table stores user profile information for cross-device sync

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  timezone TEXT DEFAULT 'UTC',
  persona TEXT,
  resolution TEXT,
  daily_hours INTEGER,
  available_slots TEXT[], -- Array of time slots
  accountability_style TEXT DEFAULT 'balanced',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Updated at trigger
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role has full access to profiles" ON profiles;

-- Policy: Users can only access profiles they own via profiles_auth
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = profiles.id
      AND profiles_auth.auth_user_id = auth.uid()
    )
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  );

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (
    current_setting('request.jwt.claim.role', true) = 'service_role'
    OR auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = profiles.id
      AND profiles_auth.auth_user_id = auth.uid()
      AND profiles_auth.is_owner = true
    )
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  );

-- Service role bypass for API operations
CREATE POLICY "Service role has full access to profiles" ON profiles
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');
