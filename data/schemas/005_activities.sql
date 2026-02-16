-- 10X Accountability Coach - Activities Schema
-- This table tracks all user activities for analytics and sync

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
  entity_type TEXT, -- 'todo', 'challenge', 'checkin', etc.
  entity_id TEXT,
  title TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  points INTEGER DEFAULT 0, -- Gamification points
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_from_local BOOLEAN DEFAULT true
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_activities_profile ON activities(profile_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);

-- Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON activities;
DROP POLICY IF EXISTS "Service role has full access to activities" ON activities;

-- Secure RLS Policies
CREATE POLICY "Users can view own activities" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = activities.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = activities.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

-- Service role bypass
CREATE POLICY "Service role has full access to activities" ON activities
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');
