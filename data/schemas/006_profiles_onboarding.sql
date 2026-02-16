-- 10X Accountability Coach - Enhanced Profiles Schema
-- Migration 006: Add comprehensive onboarding data fields
-- Run this migration to add all onboarding-related fields to profiles

-- =====================
-- Add new onboarding columns to profiles table
-- =====================

-- Productivity & Schedule fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS productive_time TEXT;
-- Values: 'early_morning', 'morning', 'afternoon', 'evening', 'night'

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS available_days TEXT[];
-- Values: Array of day names, e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

-- Goals & Motivation fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS big_goal TEXT;
-- User's primary goal

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS motivation TEXT;
-- What motivates the user: 'progress', 'deadlines', 'accountability', 'rewards'

-- Preferences fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS check_in_frequency TEXT DEFAULT 'daily';
-- Values: 'daily', 'weekly', 'custom'

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_tone TEXT;
-- Values: 'direct', 'encouraging', 'supportive'

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_checkin_time TIME;
-- Preferred check-in time

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_alerts BOOLEAN DEFAULT true;
-- Whether to enable streak alerts

-- Onboarding status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Owner flag for multi-profile support
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;

-- Profile visibility for sharing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================
-- Create preferences table for detailed settings
-- =====================

CREATE TABLE IF NOT EXISTS profile_preferences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Notification preferences
  notifications_enabled BOOLEAN DEFAULT true,
  email_reminders BOOLEAN DEFAULT true,
  push_reminders BOOLEAN DEFAULT true,

  -- Check-in preferences
  morning_checkin BOOLEAN DEFAULT false,
  evening_checkin BOOLEAN DEFAULT true,
  weekend_checkins BOOLEAN DEFAULT true,

  -- Streak preferences
  streak_notifications BOOLEAN DEFAULT true,
  streak_recovery_grace_days INTEGER DEFAULT 1,

  -- Theme preferences
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'en',

  -- Accountability preferences
  punishment_type TEXT; -- 'mild', 'moderate', 'severe'
  custom_punishment TEXT;
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
-- Create schedule table for weekly availability
-- =====================

CREATE TABLE IF NOT EXISTS profile_schedule (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  -- 0 = Sunday, 1 = Monday, ... 6 = Saturday
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
-- Create contracts table for accountability contracts
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
-- Run this to verify changes were applied

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profile_preferences', 'profile_schedule', 'contracts');
