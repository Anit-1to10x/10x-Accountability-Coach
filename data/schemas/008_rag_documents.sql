-- ============================================
-- 10X Accountability Coach - RAG Documents Schema
-- ============================================
-- Enables vector search for RAG (Retrieval Augmented Generation)
-- ============================================

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================
-- RAG Documents Table
-- =====================

CREATE TABLE IF NOT EXISTS rag_documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN (
    'productivity', 'accountability', 'habits', 'mindset',
    'goal-setting', 'time-management', 'motivation', 'general'
  )),
  tags TEXT[],
  source TEXT, -- e.g., 'blog', 'article', 'documentation', 'custom'
  source_url TEXT,
  author TEXT,
  -- Vector embedding for semantic search (1536 dimensions for OpenAI embeddings)
  embedding vector(1536),
  -- Metadata for filtering and ranking
  metadata JSONB DEFAULT '{}',
  relevance_score FLOAT DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_rag_documents_category ON rag_documents(category);
CREATE INDEX IF NOT EXISTS idx_rag_documents_tags ON rag_documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_rag_documents_active ON rag_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_rag_documents_created ON rag_documents(created_at);

-- Vector similarity search index (IVFFlat for faster approximate search)
CREATE INDEX IF NOT EXISTS idx_rag_documents_embedding ON rag_documents
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_rag_documents_fts ON rag_documents
  USING GIN (to_tsvector('english', title || ' ' || content));

-- Update timestamp trigger
DROP TRIGGER IF EXISTS update_rag_documents_updated_at ON rag_documents;
CREATE TRIGGER update_rag_documents_updated_at
  BEFORE UPDATE ON rag_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- RLS Policies
-- =====================

ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users and service role
DROP POLICY IF EXISTS "rag_documents_select" ON rag_documents;
CREATE POLICY "rag_documents_select" ON rag_documents
  FOR SELECT USING (
    is_active = true
    OR current_setting('request.jwt.claim.role', true) = 'service_role'
  );

-- Only service role can insert/update/delete
DROP POLICY IF EXISTS "rag_documents_service" ON rag_documents;
CREATE POLICY "rag_documents_service" ON rag_documents
  FOR ALL USING (current_setting('request.jwt.claim.role', true) = 'service_role');

-- =====================
-- RAG Search Functions
-- =====================

-- Function to search documents by semantic similarity (vector search)
CREATE OR REPLACE FUNCTION search_rag_documents(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  content TEXT,
  summary TEXT,
  category TEXT,
  tags TEXT[],
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.content,
    d.summary,
    d.category,
    d.tags,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM rag_documents d
  WHERE d.is_active = true
    AND (filter_category IS NULL OR d.category = filter_category)
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function to search documents by keyword (full-text search)
CREATE OR REPLACE FUNCTION search_rag_documents_keyword(
  search_query TEXT,
  match_count INT DEFAULT 5,
  filter_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  content TEXT,
  summary TEXT,
  category TEXT,
  tags TEXT[],
  rank FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.content,
    d.summary,
    d.category,
    d.tags,
    ts_rank(to_tsvector('english', d.title || ' ' || d.content), plainto_tsquery('english', search_query)) AS rank
  FROM rag_documents d
  WHERE d.is_active = true
    AND (filter_category IS NULL OR d.category = filter_category)
    AND to_tsvector('english', d.title || ' ' || d.content) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get documents by tags
CREATE OR REPLACE FUNCTION get_rag_documents_by_tags(
  search_tags TEXT[],
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  content TEXT,
  summary TEXT,
  category TEXT,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.content,
    d.summary,
    d.category,
    d.tags
  FROM rag_documents d
  WHERE d.is_active = true
    AND d.tags && search_tags
  ORDER BY array_length(d.tags & search_tags, 1) DESC NULLS LAST, d.created_at DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- Verification
-- =====================
SELECT 'RAG Documents table created successfully' AS status;
