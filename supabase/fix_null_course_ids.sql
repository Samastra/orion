-- =============================================================================
-- FIX: Backfill NULL course_id in document_sections
-- 
-- ROOT CAUSE: Some notes were indexed without passing course_id, resulting in
-- document_sections rows with course_id=NULL. This caused the RPC search filter
-- (p_course_id IS NULL OR ds.course_id = p_course_id) to exclude ALL those rows
-- when a course_id was provided in the search.
--
-- Run this in your Supabase SQL Editor.
-- =============================================================================

-- 1. Preview: See how many rows have NULL course_id
SELECT count(*) AS null_course_count 
FROM document_sections 
WHERE course_id IS NULL AND note_id IS NOT NULL;

-- 2. Backfill: Set course_id from the parent notes table
UPDATE document_sections ds
SET course_id = n.course_id
FROM notes n
WHERE ds.note_id = n.id
  AND ds.course_id IS NULL;

-- 3. Verify: Should return 0 now
SELECT count(*) AS remaining_nulls 
FROM document_sections 
WHERE course_id IS NULL AND note_id IS NOT NULL;
