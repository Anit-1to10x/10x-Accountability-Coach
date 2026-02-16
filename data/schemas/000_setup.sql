-- 10X Accountability Coach - Initial Setup
-- Run this first to set up required extensions and functions

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

-- Helper function to get current user's profile ID
-- This maps Supabase auth.uid() to our profile system
CREATE OR REPLACE FUNCTION get_current_profile_id()
RETURNS TEXT AS $$
BEGIN
  -- For API key access (service role), allow all
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NULL;
  END IF;

  -- For authenticated users, return their profile ID from JWT
  RETURN current_setting('request.jwt.claim.profile_id', true);
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create a profiles_auth table to link Supabase auth users to profiles
CREATE TABLE IF NOT EXISTS profiles_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  is_owner BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(auth_user_id, profile_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON profiles_auth(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_profile ON profiles_auth(profile_id);

-- RLS for profiles_auth
ALTER TABLE profiles_auth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own auth links" ON profiles_auth
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can create their own auth links" ON profiles_auth
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Service role has full access" ON profiles_auth
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');
