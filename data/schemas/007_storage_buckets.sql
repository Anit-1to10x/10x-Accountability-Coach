-- =====================================================
-- Migration 007: Storage Buckets
-- =====================================================
-- Creates Supabase storage buckets for assets
-- Run this after configuring Supabase storage
-- =====================================================

-- =====================
-- Create Storage Buckets
-- =====================

-- Avatars bucket - user profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Vision boards bucket - generated vision board images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visionboards',
  'visionboards',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Chat uploads bucket - images uploaded in chat
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-uploads',
  'chat-uploads',
  false, -- private by default
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- General assets bucket - misc uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav']
)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- Storage Policies
-- =====================

-- Avatars: Users can read all, upload their own
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_auth_upload" ON storage.objects;
CREATE POLICY "avatars_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    (auth.uid() IS NOT NULL OR current_setting('request.jwt.claim.role', true) = 'service_role')
  );

DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    (auth.uid() IS NOT NULL OR current_setting('request.jwt.claim.role', true) = 'service_role')
  );

DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    (auth.uid() IS NOT NULL OR current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- Vision boards: Public read, authenticated write
DROP POLICY IF EXISTS "visionboards_public_read" ON storage.objects;
CREATE POLICY "visionboards_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'visionboards');

DROP POLICY IF EXISTS "visionboards_auth_write" ON storage.objects;
CREATE POLICY "visionboards_auth_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'visionboards' AND
    (auth.uid() IS NOT NULL OR current_setting('request.jwt.claim.role', true) = 'service_role')
  );

DROP POLICY IF EXISTS "visionboards_auth_update" ON storage.objects;
CREATE POLICY "visionboards_auth_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'visionboards' AND
    (auth.uid() IS NOT NULL OR current_setting('request.jwt.claim.role', true) = 'service_role')
  );

DROP POLICY IF EXISTS "visionboards_auth_delete" ON storage.objects;
CREATE POLICY "visionboards_auth_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'visionboards' AND
    (auth.uid() IS NOT NULL OR current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- Chat uploads: Only owner can access
DROP POLICY IF EXISTS "chat_uploads_owner_read" ON storage.objects;
CREATE POLICY "chat_uploads_owner_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-uploads' AND
    (auth.uid() IS NOT NULL OR current_setting('request.jwt.claim.role', true) = 'service_role')
  );

DROP POLICY IF EXISTS "chat_uploads_auth_write" ON storage.objects;
CREATE POLICY "chat_uploads_auth_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-uploads' AND
    (auth.uid() IS NOT NULL OR current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- Assets: Public read, authenticated write
DROP POLICY IF EXISTS "assets_public_read" ON storage.objects;
CREATE POLICY "assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'assets');

DROP POLICY IF EXISTS "assets_auth_write" ON storage.objects;
CREATE POLICY "assets_auth_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'assets' AND
    (auth.uid() IS NOT NULL OR current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- =====================
-- Assets Metadata Table
-- =====================
-- Track uploaded assets with metadata

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  bucket_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  category TEXT DEFAULT 'uploads', -- avatars, visionboards, chat, uploads
  public_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_profile ON assets(profile_id);
CREATE INDEX IF NOT EXISTS idx_assets_bucket ON assets(bucket_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);

DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assets_select" ON assets;
CREATE POLICY "assets_select" ON assets
  FOR SELECT USING (
    profile_id IN (
      SELECT profile_id FROM profiles_auth WHERE auth_user_id = auth.uid()
    ) OR
    current_setting('request.jwt.claim.role', true) = 'service_role'
  );

DROP POLICY IF EXISTS "assets_insert" ON assets;
CREATE POLICY "assets_insert" ON assets
  FOR INSERT WITH CHECK (
    profile_id IN (
      SELECT profile_id FROM profiles_auth WHERE auth_user_id = auth.uid()
    ) OR
    current_setting('request.jwt.claim.role', true) = 'service_role'
  );

DROP POLICY IF EXISTS "assets_update" ON assets;
CREATE POLICY "assets_update" ON assets
  FOR UPDATE USING (
    profile_id IN (
      SELECT profile_id FROM profiles_auth WHERE auth_user_id = auth.uid()
    ) OR
    current_setting('request.jwt.claim.role', true) = 'service_role'
  );

DROP POLICY IF EXISTS "assets_delete" ON assets;
CREATE POLICY "assets_delete" ON assets
  FOR DELETE USING (
    profile_id IN (
      SELECT profile_id FROM profiles_auth WHERE auth_user_id = auth.uid()
    ) OR
    current_setting('request.jwt.claim.role', true) = 'service_role'
  );

-- =====================
-- Vision Boards Table
-- =====================
-- Store vision board metadata

CREATE TABLE IF NOT EXISTS visionboards (
  id TEXT PRIMARY KEY,
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'custom', -- daily, goal, challenge, custom
  style TEXT DEFAULT 'horizontal', -- horizontal, vertical, square
  aesthetic TEXT DEFAULT 'modern', -- sketch, photorealistic, collage, modern, vintage
  goals TEXT[], -- Array of goals
  image_url TEXT,
  image_asset_id UUID REFERENCES assets(id),
  confidence_score INTEGER, -- AI evaluation score (1-10)
  generation_attempts INTEGER DEFAULT 1,
  prompt TEXT, -- The prompt used to generate
  evaluation_feedback TEXT,
  challenge_id TEXT REFERENCES challenges(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visionboards_profile ON visionboards(profile_id);
CREATE INDEX IF NOT EXISTS idx_visionboards_type ON visionboards(type);
CREATE INDEX IF NOT EXISTS idx_visionboards_challenge ON visionboards(challenge_id);

DROP TRIGGER IF EXISTS update_visionboards_updated_at ON visionboards;
CREATE TRIGGER update_visionboards_updated_at
  BEFORE UPDATE ON visionboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE visionboards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visionboards_select" ON visionboards;
CREATE POLICY "visionboards_select" ON visionboards
  FOR SELECT USING (
    profile_id IN (
      SELECT profile_id FROM profiles_auth WHERE auth_user_id = auth.uid()
    ) OR
    current_setting('request.jwt.claim.role', true) = 'service_role'
  );

DROP POLICY IF EXISTS "visionboards_insert" ON visionboards;
CREATE POLICY "visionboards_insert" ON visionboards
  FOR INSERT WITH CHECK (
    profile_id IN (
      SELECT profile_id FROM profiles_auth WHERE auth_user_id = auth.uid()
    ) OR
    current_setting('request.jwt.claim.role', true) = 'service_role'
  );

DROP POLICY IF EXISTS "visionboards_update" ON visionboards;
CREATE POLICY "visionboards_update" ON visionboards
  FOR UPDATE USING (
    profile_id IN (
      SELECT profile_id FROM profiles_auth WHERE auth_user_id = auth.uid()
    ) OR
    current_setting('request.jwt.claim.role', true) = 'service_role'
  );

DROP POLICY IF EXISTS "visionboards_delete" ON visionboards;
CREATE POLICY "visionboards_delete" ON visionboards
  FOR DELETE USING (
    profile_id IN (
      SELECT profile_id FROM profiles_auth WHERE auth_user_id = auth.uid()
    ) OR
    current_setting('request.jwt.claim.role', true) = 'service_role'
  );

-- =====================================================
-- Usage Instructions
-- =====================================================
--
-- To use Supabase Storage:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Run this migration SQL in SQL Editor
-- 3. Configure your environment:
--    DATA_SOURCE=supabase
--    SUPABASE_URL=your-project-url
--    SUPABASE_ANON_KEY=your-anon-key
--    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (for server-side uploads)
--
-- API Usage:
-- - Upload: POST /api/assets/upload with FormData
-- - Get: GET /api/assets/{bucket}/{filename}
-- - List: GET /api/assets?bucket=visionboards&profileId=xxx
-- =====================================================
