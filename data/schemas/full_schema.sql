-- ============================================
-- 10X Accountability Coach - Full Schema
-- ============================================
-- Run this complete file in Supabase SQL Editor
-- to set up all tables with proper RLS policies
-- ============================================

-- =====================
-- 000: Initial Setup
-- =====================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================
-- Profiles Auth Link
-- =====================
-- Links Supabase auth users to app profiles

CREATE TABLE IF NOT EXISTS profiles_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  is_owner BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(auth_user_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON profiles_auth(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_profile ON profiles_auth(profile_id);

ALTER TABLE profiles_auth ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_auth_select" ON profiles_auth;
DROP POLICY IF EXISTS "profiles_auth_insert" ON profiles_auth;
DROP POLICY IF EXISTS "profiles_auth_service" ON profiles_auth;

CREATE POLICY "profiles_auth_select" ON profiles_auth
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "profiles_auth_insert" ON profiles_auth
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "profiles_auth_service" ON profiles_auth
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');

-- =====================
-- 001: Profiles
-- =====================

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  timezone TEXT DEFAULT 'UTC',
  persona TEXT,
  resolution TEXT,
  daily_hours INTEGER,
  available_slots TEXT[],
  accountability_style TEXT DEFAULT 'balanced',
  -- Onboarding fields (added in migration 006)
  productive_time TEXT, -- 'early_morning', 'morning', 'afternoon', 'evening', 'night'
  available_days TEXT[], -- Array of day names
  big_goal TEXT,
  motivation TEXT, -- 'progress', 'deadlines', 'accountability', 'rewards'
  check_in_frequency TEXT DEFAULT 'daily',
  reminder_tone TEXT,
  daily_checkin_time TIME,
  streak_alerts BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  is_owner BOOLEAN DEFAULT false,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_service" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = profiles.id
      AND profiles_auth.auth_user_id = auth.uid()
    )
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  );

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (
    current_setting('request.jwt.claim.role', true) = 'service_role'
    OR auth.uid() IS NOT NULL
  );

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = profiles.id
      AND profiles_auth.auth_user_id = auth.uid()
      AND profiles_auth.is_owner = true
    )
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  );

CREATE POLICY "profiles_service" ON profiles
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');

-- =====================
-- 002: Todos
-- =====================

CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  due_time TIME,
  category TEXT,
  tags TEXT[],
  challenge_id TEXT,
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_from_local BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_todos_profile ON todos(profile_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_challenge ON todos(challenge_id);

DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;
CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todos_select" ON todos;
DROP POLICY IF EXISTS "todos_insert" ON todos;
DROP POLICY IF EXISTS "todos_update" ON todos;
DROP POLICY IF EXISTS "todos_delete" ON todos;
DROP POLICY IF EXISTS "todos_service" ON todos;

CREATE POLICY "todos_select" ON todos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = todos.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "todos_insert" ON todos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = todos.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "todos_update" ON todos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = todos.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "todos_delete" ON todos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = todos.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "todos_service" ON todos
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');

-- =====================
-- 003: Challenges
-- =====================

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

CREATE INDEX IF NOT EXISTS idx_challenges_profile ON challenges(profile_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);

DROP TRIGGER IF EXISTS update_challenges_updated_at ON challenges;
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "challenges_select" ON challenges;
DROP POLICY IF EXISTS "challenges_insert" ON challenges;
DROP POLICY IF EXISTS "challenges_update" ON challenges;
DROP POLICY IF EXISTS "challenges_delete" ON challenges;
DROP POLICY IF EXISTS "challenges_service" ON challenges;

CREATE POLICY "challenges_select" ON challenges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = challenges.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "challenges_insert" ON challenges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = challenges.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "challenges_update" ON challenges
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = challenges.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "challenges_delete" ON challenges
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = challenges.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "challenges_service" ON challenges
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');

-- =====================
-- 004: Check-ins
-- =====================

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
  UNIQUE(challenge_id, date)
);

CREATE INDEX IF NOT EXISTS idx_checkins_profile ON checkins(profile_id);
CREATE INDEX IF NOT EXISTS idx_checkins_challenge ON checkins(challenge_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(date);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checkins_select" ON checkins;
DROP POLICY IF EXISTS "checkins_insert" ON checkins;
DROP POLICY IF EXISTS "checkins_update" ON checkins;
DROP POLICY IF EXISTS "checkins_delete" ON checkins;
DROP POLICY IF EXISTS "checkins_service" ON checkins;

CREATE POLICY "checkins_select" ON checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = checkins.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "checkins_insert" ON checkins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = checkins.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "checkins_update" ON checkins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = checkins.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "checkins_delete" ON checkins
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = checkins.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "checkins_service" ON checkins
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');

-- =====================
-- 005: Activities
-- =====================

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'task_created', 'task_completed', 'task_updated', 'task_deleted',
    'challenge_created', 'challenge_completed', 'challenge_updated',
    'checkin_completed', 'checkin_missed',
    'streak_milestone', 'streak_broken',
    'chat_message', 'skill_used',
    'session_start', 'session_end'
  )),
  entity_type TEXT,
  entity_id TEXT,
  title TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_from_local BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_activities_profile ON activities(profile_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities_select" ON activities;
DROP POLICY IF EXISTS "activities_insert" ON activities;
DROP POLICY IF EXISTS "activities_service" ON activities;

CREATE POLICY "activities_select" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = activities.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "activities_insert" ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = activities.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "activities_service" ON activities
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');

-- =====================
-- 006: Profile Preferences
-- =====================

CREATE TABLE IF NOT EXISTS profile_preferences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  email_reminders BOOLEAN DEFAULT true,
  push_reminders BOOLEAN DEFAULT true,
  morning_checkin BOOLEAN DEFAULT false,
  evening_checkin BOOLEAN DEFAULT true,
  weekend_checkins BOOLEAN DEFAULT true,
  streak_notifications BOOLEAN DEFAULT true,
  streak_recovery_grace_days INTEGER DEFAULT 1,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'en',
  punishment_type TEXT,
  custom_punishment TEXT,
  grace_period_days INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_preferences_profile ON profile_preferences(profile_id);

DROP TRIGGER IF EXISTS update_profile_preferences_updated_at ON profile_preferences;
CREATE TRIGGER update_profile_preferences_updated_at
  BEFORE UPDATE ON profile_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE profile_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_preferences_select" ON profile_preferences;
DROP POLICY IF EXISTS "profile_preferences_insert" ON profile_preferences;
DROP POLICY IF EXISTS "profile_preferences_update" ON profile_preferences;
DROP POLICY IF EXISTS "profile_preferences_delete" ON profile_preferences;
DROP POLICY IF EXISTS "profile_preferences_service" ON profile_preferences;

CREATE POLICY "profile_preferences_select" ON profile_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = profile_preferences.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "profile_preferences_insert" ON profile_preferences
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = profile_preferences.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "profile_preferences_update" ON profile_preferences
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = profile_preferences.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "profile_preferences_delete" ON profile_preferences
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = profile_preferences.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "profile_preferences_service" ON profile_preferences
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');

-- =====================
-- 007: Profile Schedule
-- =====================

CREATE TABLE IF NOT EXISTS profile_schedule (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_available BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_profile_schedule_profile ON profile_schedule(profile_id);

DROP TRIGGER IF EXISTS update_profile_schedule_updated_at ON profile_schedule;
CREATE TRIGGER update_profile_schedule_updated_at
  BEFORE UPDATE ON profile_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE profile_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_schedule_select" ON profile_schedule;
DROP POLICY IF EXISTS "profile_schedule_insert" ON profile_schedule;
DROP POLICY IF EXISTS "profile_schedule_update" ON profile_schedule;
DROP POLICY IF EXISTS "profile_schedule_delete" ON profile_schedule;
DROP POLICY IF EXISTS "profile_schedule_service" ON profile_schedule;

CREATE POLICY "profile_schedule_select" ON profile_schedule
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = profile_schedule.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "profile_schedule_insert" ON profile_schedule
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = profile_schedule.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "profile_schedule_update" ON profile_schedule
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = profile_schedule.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "profile_schedule_delete" ON profile_schedule
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = profile_schedule.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "profile_schedule_service" ON profile_schedule
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');

-- =====================
-- 008: Contracts
-- =====================

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  commitment TEXT NOT NULL,
  consequence TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'broken', 'cancelled')),
  witness_email TEXT,
  witness_name TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_profile ON contracts(profile_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contracts_select" ON contracts;
DROP POLICY IF EXISTS "contracts_insert" ON contracts;
DROP POLICY IF EXISTS "contracts_update" ON contracts;
DROP POLICY IF EXISTS "contracts_delete" ON contracts;
DROP POLICY IF EXISTS "contracts_service" ON contracts;

CREATE POLICY "contracts_select" ON contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = contracts.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "contracts_insert" ON contracts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = contracts.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "contracts_update" ON contracts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = contracts.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "contracts_delete" ON contracts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = contracts.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "contracts_service" ON contracts
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');

-- =====================
-- Verification
-- =====================
-- Run this to verify tables were created

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'profiles_auth', 'todos', 'challenges', 'checkins', 'activities', 'profile_preferences', 'profile_schedule', 'contracts');
