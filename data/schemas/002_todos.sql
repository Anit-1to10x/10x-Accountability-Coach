-- 10X Accountability Coach - Todos/Tasks Schema
-- This table stores active tasks for cross-device sync

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
  challenge_id TEXT, -- Optional link to a challenge
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_from_local BOOLEAN DEFAULT true
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_todos_profile ON todos(profile_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_challenge ON todos(challenge_id);

-- Updated at trigger
CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own todos" ON todos;
DROP POLICY IF EXISTS "Users can insert own todos" ON todos;
DROP POLICY IF EXISTS "Users can update own todos" ON todos;
DROP POLICY IF EXISTS "Users can delete own todos" ON todos;
DROP POLICY IF EXISTS "Service role has full access to todos" ON todos;

-- Secure RLS Policies - Users can only access their own todos
CREATE POLICY "Users can view own todos" ON todos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = todos.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own todos" ON todos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = todos.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own todos" ON todos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = todos.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own todos" ON todos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles_auth
      WHERE profiles_auth.profile_id = todos.profile_id
      AND profiles_auth.auth_user_id = auth.uid()
    )
  );

-- Service role bypass for API operations
CREATE POLICY "Service role has full access to todos" ON todos
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');
