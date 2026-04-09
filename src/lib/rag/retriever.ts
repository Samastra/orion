/**
 * Universal RAG Retriever — Single entry point for all context retrieval.
 * 
 * Used by chat, practice, and study analyze routes.
 * Always retrieves from the Supabase vector DB — never stuffs raw documents.
 * 
 * Cost: 1 embedding API call ($0) + 1 DB query ($0) per retrieval.
 */

import { searchContent } from '@/lib/google/embeddings';

export interface RetrievalOptions {
  query: string;
  noteId?: string;
  courseId?: string;
  chunkCount?: number;
  targetDepth?: number;
}

export interface RetrievedContext {
  text: string;
  chunkCount: number;
  totalChars: number;
}

/**
 * Retrieve relevant context from the vector DB.
 * Returns a formatted string of the most relevant chunks, ready to inject into an LLM prompt.
 */
export async function getRelevantContext(options: RetrievalOptions): Promise<RetrievedContext> {
  const {
    query,
    noteId,
    courseId,
    chunkCount = 6,
    targetDepth = 5,
  } = options;

  if (!noteId && !courseId) {
    return { text: '', chunkCount: 0, totalChars: 0 };
  }

  try {
    const chunks = await searchContent(query, noteId, courseId, chunkCount, targetDepth);

    if (chunks && chunks.length > 0) {
      const text = chunks
        .map((c: any, i: number) => `[Section ${i + 1}]\n${c.content}`)
        .join('\n\n---\n\n');

      return {
        text,
        chunkCount: chunks.length,
        totalChars: text.length,
      };
    }
  } catch (err) {
    console.error('❌ [Retriever] Semantic search failed:', err);
  }

  return { text: '', chunkCount: 0, totalChars: 0 };
}

/**
 * Multi-query retrieval for practice generation.
 * Decomposes a broad request into multiple searches for better coverage.
 */
export async function getMultiQueryContext(options: RetrievalOptions & {
  additionalQueries?: string[];
}): Promise<RetrievedContext> {
  const { query, noteId, courseId, chunkCount = 8, targetDepth = 5, additionalQueries = [] } = options;

  // Build diverse query set
  const queries = [query, ...additionalQueries].filter(q => q.trim());

  if (!noteId && !courseId) {
    return { text: '', chunkCount: 0, totalChars: 0 };
  }

  try {
    // Run all searches in parallel
    const allResults = await Promise.all(
      queries.map(q => searchContent(q, noteId, courseId, Math.ceil(chunkCount / queries.length) + 2, targetDepth))
    );

    // Deduplicate by chunk ID
    const seen = new Set<string>();
    const uniqueChunks: any[] = [];

    for (const results of allResults) {
      if (!results) continue;
      for (const chunk of results) {
        if (!seen.has(chunk.id)) {
          seen.add(chunk.id);
          uniqueChunks.push(chunk);
        }
      }
    }

    // Sort by similarity (highest first) and take the top N
    uniqueChunks.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    const topChunks = uniqueChunks.slice(0, chunkCount);

    if (topChunks.length > 0) {
      const text = topChunks
        .map((c: any, i: number) => `[Section ${i + 1}]\n${c.content}`)
        .join('\n\n---\n\n');

      return {
        text,
        chunkCount: topChunks.length,
        totalChars: text.length,
      };
    }
  } catch (err) {
    console.error('❌ [Multi-Retriever] Search failed:', err);
  }

  return { text: '', chunkCount: 0, totalChars: 0 };
}
