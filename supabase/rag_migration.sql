-- =============================================================================
-- MIGRATION: Production RAG Pipeline Upgrade
-- Run this SQL in your Supabase SQL Editor
-- =============================================================================

-- 1. Add user_id column to document_sections for RLS
ALTER TABLE document_sections 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Enable RLS
ALTER TABLE document_sections ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Users can view own sections" ON document_sections;
CREATE POLICY "Users can view own sections" ON document_sections 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own sections" ON document_sections;
CREATE POLICY "Users can manage own sections" ON document_sections 
  FOR ALL USING (auth.uid() = user_id);

-- 4. Backfill user_id from notes table for existing rows
UPDATE document_sections ds
SET user_id = n.user_id
FROM notes n
WHERE ds.note_id = n.id
AND ds.user_id IS NULL;

-- 5. DROP the old function first (return type changed, Postgres requires this)
DROP FUNCTION IF EXISTS match_document_sections(vector, double precision, integer, uuid, uuid);

-- 6. Recreate with improved version that returns similarity score explicitly.
CREATE OR REPLACE FUNCTION match_document_sections(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.1,
  match_count int DEFAULT 10,
  p_course_id uuid DEFAULT NULL,
  p_note_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  note_id uuid,
  course_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ds.id,
    ds.note_id,
    ds.course_id,
    ds.content,
    ds.metadata,
    1 - (ds.embedding <=> query_embedding) AS similarity
  FROM document_sections ds
  WHERE
    -- RLS handles user scoping automatically
    (p_course_id IS NULL OR ds.course_id = p_course_id)
    AND (p_note_id IS NULL OR ds.note_id = p_note_id)
    AND 1 - (ds.embedding <=> query_embedding) > match_threshold
  ORDER BY ds.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6. Create an index for faster vector search (if not already present)
CREATE INDEX IF NOT EXISTS idx_document_sections_embedding 
ON document_sections 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 7. Create indexes for common filter columns
CREATE INDEX IF NOT EXISTS idx_document_sections_note_id ON document_sections (note_id);
CREATE INDEX IF NOT EXISTS idx_document_sections_course_id ON document_sections (course_id);
CREATE INDEX IF NOT EXISTS idx_document_sections_user_id ON document_sections (user_id);
