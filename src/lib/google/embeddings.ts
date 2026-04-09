/**
 * Embeddings Engine — Handles document indexing and vector search.
 * 
 * Uses Gemini embedding-001 for vector generation and Supabase pgvector
 * for storage and cosine similarity search.
 * 
 * The AI grader has been replaced with a $0 heuristic (see rag/scoring.ts).
 * Chunking uses semantic boundaries (see rag/chunker.ts).
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { smartChunk } from "@/lib/rag/chunker";
import { estimateComplexity } from "@/lib/rag/scoring";

// ─── Constants ──────────────────────────────────────────────────

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;
const BATCH_SIZE = 20;

// ─── Retry Utility ──────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    console.warn(`⚠️ [Retry] Request failed, retrying in ${delay}ms... (${retries} left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

// ─── Index Document ─────────────────────────────────────────────

/**
 * Index a document for semantic search.
 * Chunks the text, generates embeddings, scores complexity, and stores in Supabase.
 */
export async function indexDocument(
  content: string,
  noteId?: string,
  courseId?: string,
  userId?: string
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const supabase = await createClient();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  // Smart chunking (semantic boundaries)
  const chunks = smartChunk(content);
  console.log(`📡 [Indexer] Document split into ${chunks.length} semantic chunks.`);

  // Clear existing chunks for this note
  if (noteId) {
    await supabase.from('document_sections').delete().eq('note_id', noteId);
  }

  let totalChunks = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const end = Math.min(i + BATCH_SIZE, chunks.length);
    const batch = chunks.slice(i, end);

    try {
      // 1. Generate embeddings
      const result = await withRetry(async () => {
        return await model.batchEmbedContents({
          requests: batch.map(text => ({
            content: { parts: [{ text }], role: 'user' },
            taskType: "RETRIEVAL_DOCUMENT" as any,
            outputDimensionality: EMBEDDING_DIMENSIONS
          }))
        });
      });

      const embeddings = result.embeddings.map(e => e.values);

      // 2. Score complexity with $0 heuristic
      const complexityScores = batch.map(text => estimateComplexity(text));

      // 3. Prepare rows
      const rows = batch.map((text, idx) => ({
        note_id: noteId,
        course_id: courseId,
        user_id: userId,
        content: text,
        embedding: embeddings[idx],
        metadata: {
          chunkIndex: i + idx,
          totalChunks: chunks.length,
          technicalScore: complexityScores[idx],
        }
      }));

      const { error } = await supabase.from('document_sections').insert(rows);
      if (error) throw error;
      totalChunks += batch.length;
    } catch (err) {
      console.error(`❌ [Indexer] Batch ${i} failed:`, err);
      throw err;
    }
  }

  console.log(`✅ [Indexer] Indexed ${totalChunks} chunks.`);
  return { success: true, chunksCount: totalChunks };
}

// ─── Search Content ─────────────────────────────────────────────

/**
 * Semantic search over indexed document chunks.
 * Returns chunks ranked by similarity, with depth as a tiebreaker.
 */
export async function searchContent(
  query: string,
  noteId?: string,
  courseId?: string,
  count: number = 8,
  targetDepth: number = 5
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  // 1. Embed the query
  const result = await withRetry(async () => {
    return await model.embedContent({
      content: { parts: [{ text: query }], role: 'user' },
      taskType: "RETRIEVAL_QUERY" as any,
      outputDimensionality: EMBEDDING_DIMENSIONS
    } as any);
  });

  const queryEmbedding = result.embedding.values;
  const supabase = await createClient();

  // 2. Course-wide diverse search (when no specific note is targeted)
  if (!noteId && courseId) {
    return await courseWideSearch(supabase, queryEmbedding, courseId, count, targetDepth);
  }

  // 3. Standard search (specific note or general)
  const { data, error } = await supabase.rpc('match_document_sections', {
    query_embedding: queryEmbedding,
    match_threshold: 0.1,
    match_count: count * 2, // Fetch extra for ranking
    p_course_id: courseId || null,
    p_note_id: noteId || null
  });

  if (error || !data) return null;

  // Rank: similarity first, depth as tiebreaker
  return rankChunks(data, targetDepth, count);
}

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Rank chunks by combined similarity + depth score.
 * Similarity is the primary factor; depth is a gentle tiebreaker.
 */
function rankChunks(chunks: any[], targetDepth: number, limit: number) {
  const DEPTH_WEIGHT = 0.03; // Small — depth nudges but never overrides

  return chunks
    .map((c: any) => {
      const similarity = c.similarity || 0;
      const depthDiff = Math.abs((c.metadata?.technicalScore || 5) - targetDepth);
      const combinedScore = similarity - (depthDiff * DEPTH_WEIGHT);
      return { ...c, combinedScore };
    })
    .sort((a: any, b: any) => b.combinedScore - a.combinedScore)
    .slice(0, limit);
}

/**
 * Search across all notes in a course, sampling from each note
 * to ensure diversity in practice questions.
 */
async function courseWideSearch(
  supabase: any,
  queryEmbedding: number[],
  courseId: string,
  count: number,
  targetDepth: number
) {
  const { data: noteRecords } = await supabase
    .from('document_sections')
    .select('note_id')
    .eq('course_id', courseId);

  const uniqueNoteIds = Array.from(
    new Set((noteRecords || []).map((n: any) => n.note_id).filter((id: any) => !!id))
  ) as string[];

  if (uniqueNoteIds.length <= 1) {
    // Single note — fall back to standard search
    const { data } = await supabase.rpc('match_document_sections', {
      query_embedding: queryEmbedding,
      match_threshold: 0.05,
      match_count: count * 2,
      p_course_id: courseId,
      p_note_id: uniqueNoteIds[0] || null
    });
    return rankChunks(data || [], targetDepth, count);
  }

  // Multi-note: sample from each note
  const perNote = Math.max(3, Math.ceil(count / uniqueNoteIds.length) + 1);
  const results = await Promise.all(
    uniqueNoteIds.map(async (nId) => {
      const { data } = await supabase.rpc('match_document_sections', {
        query_embedding: queryEmbedding,
        match_threshold: 0.05,
        match_count: perNote,
        p_course_id: courseId,
        p_note_id: nId
      });
      return (data || []) as any[];
    })
  );

  return rankChunks(results.flat(), targetDepth, count);
}

// ─── Cache Check ────────────────────────────────────────────────

/**
 * Check if a note or course is already indexed.
 */
export async function checkIfIndexed(courseId?: string, noteId?: string) {
  const supabase = await createClient();

  let query = supabase.from('document_sections').select('id').limit(1);

  if (noteId) {
    query = query.eq('note_id', noteId);
  } else if (courseId) {
    query = query.eq('course_id', courseId);
  } else {
    return { indexed: false };
  }

  const { data, error } = await query;
  return { indexed: !error && !!data && data.length > 0 };
}
