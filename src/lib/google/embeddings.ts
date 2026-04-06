import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

// --- CHUNKING STRATEGY ---
// Split text into overlapping segments of ~2000 characters for pharmaceutical context
// This ensures mechanisms of action (which are often long) aren't cut in half
function chunkText(text: string, size: number = 2000, overlap: number = 400): string[] {
  if (!text) return [];
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end).trim());
    
    // If we're at the end, stop
    if (end === text.length) break;
    
    start += size - overlap;
  }

  return chunks;
}

/**
 * RETRY UTILITY WITH EXPONENTIAL BACKOFF
 * Handles transient network errors and 'fetch failed' by retrying.
 */
async function withRetry<T>(fn: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    console.warn(`⚠️ [AI Retry] Request failed, retrying in ${delay}ms... (${retries} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

/**
 * AI GRADER: Assigns a technical complexity score (1-10) to segments of text.
 * Used to power the 'Technical Depth' slider in the UI.
 */
async function gradeComplexity(chunks: string[]): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return chunks.map(() => 5);

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using Flash-Lite for high-speed, low-cost grading
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

  const prompt = `You are a pharmaceutical sciences professor. Classify the technical complexity of these document chunks.
  
  SCORING SCALE (1-10):
  1-3: Basic introductions, general definitions, or history.
  4-6: Standard mechanisms, common classifications, and basic properties.
  7-10: High technicality: specific chemical formulas, precise dosage ranges (e.g. 0.5mg/kg), intricate physicochemical attributes (lipophilicity, pKa, etc.), or complex clinical scenarios.
  
  CHUNKS TO GRADE:
  ${chunks.map((c, i) => `[ID ${i}]: "${c.slice(0, 400)}..."`).join('\n\n')}
  
  CRITICAL: Respond ONLY with a JSON array of integers representing the scores for each ID in order. Example: [2, 8, 5]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\d,\s]*\]/);
    if (jsonMatch) {
      const scores = JSON.parse(jsonMatch[0]);
      if (Array.isArray(scores) && scores.length === chunks.length) return scores;
    }
  } catch (e) {
    console.warn("⚠️ [AI Grader] Complexity grading failed, defaulting to 5.", e);
  }
  return chunks.map(() => 5);
}

/**
 * GENERATE AND STORE EMBEDDINGS
 * Takes a document (identified by noteId or courseId) and indexes it for search.
 */
export async function indexDocument(content: string, noteId?: string, courseId?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in environment.");

  const supabase = await createClient();
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Back to gemini-embedding-001 as text-004 is not available in v1beta here
  const model = genAI.getGenerativeModel({ 
    model: "gemini-embedding-001"
  });

  const chunks = chunkText(content);
  console.log(`📡 [Gemini Indexer] Splitting document into ${chunks.length} chunks...`);
  
  // First, clear any existing chunks for this specific note to prevent duplicates
  if (noteId) {
    console.log(`📡 [Gemini Indexer] Cleaning up old index for noteId: ${noteId}`);
    await supabase.from('document_sections').delete().eq('note_id', noteId);
  }

  // Process chunks in larger batches for the Paid Tier
  const BATCH_SIZE = 20;
  let totalChunks = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const end = Math.min(i + BATCH_SIZE, chunks.length);
    console.log(`🚀 [Gemini Indexer] Rapid Indexing: chunks ${i + 1} to ${end}...`);
    const batch = chunks.slice(i, end);
    
    try {
      // 1. Generate embeddings for the batch
      const result = await withRetry(async () => {
        return await model.batchEmbedContents({
          requests: batch.map(text => ({
            content: { parts: [{ text }], role: 'user' },
            taskType: "RETRIEVAL_DOCUMENT" as any,
            outputDimensionality: 768
          }))
        });
      });

      const embeddingsResults = result.embeddings.map(e => e.values);

      // 2. AI Complexity Grading (NEW: Powers the Intelligence Upgrade)
      console.log(`📡 [AI Grader] Evaluating technical depth of batch...`);
      const complexityScores = await gradeComplexity(batch);

      // Prepare for Supabase
      const toInsert = batch.map((text, idx) => ({
        note_id: noteId,
        course_id: courseId,
        content: text,
        embedding: embeddingsResults[idx],
        metadata: { 
          chunkIndex: i + idx, 
          totalChunks: chunks.length,
          sourceLength: content.length,
          technicalScore: complexityScores[idx] || 5
        }
      }));

      // Upsert into Supabase
      const { error } = await supabase
        .from('document_sections')
        .insert(toInsert);

      if (error) throw error;
      totalChunks += batch.length;
    } catch (err) {
      console.error(`Error in chunk batch ${i}:`, err);
      throw err;
    }
  }

  return { success: true, chunksCount: totalChunks };
}

/**
 * SEMANTIC RETRIEVAL
 * Finds the most relevant chunks with optional 'Technical Depth' biasing.
 */
export async function searchContent(query: string, noteId?: string, courseId?: string, count: number = 8, targetDepth: number = 5) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-embedding-001"
  });

  // 1. Convert search query to a vector
  const result = await withRetry(async () => {
    return await model.embedContent({
      content: { parts: [{ text: query }], role: 'user' },
      taskType: "RETRIEVAL_QUERY" as any,
      outputDimensionality: 768
    } as any);
  });

  const queryEmbedding = result.embedding.values;
  const supabase = await createClient();
  
  // 2. Diverse Search (Course-wide)
  if (!noteId && courseId) {
    const { data: noteRecords } = await supabase.from('document_sections').select('note_id').eq('course_id', courseId);
    const uniqueNoteIds = Array.from(new Set(noteRecords?.map(n => n.note_id).filter(id => !!id)));

    if (uniqueNoteIds.length > 1) {
      const results = await Promise.all(uniqueNoteIds.map(async (nId) => {
        const { data } = await supabase.rpc('match_document_sections', {
          query_embedding: queryEmbedding,
          match_threshold: 0.05,
          match_count: 5, // Fetch extra for depth filtering
          p_course_id: courseId,
          p_note_id: nId
        });
        return (data || []) as any[];
      }));

      // Apply Depth Filtering (Rank by proximity to targetDepth)
      const allChunks = results.flat().map((c: any) => {
        const score = c.metadata?.technicalScore || 5;
        return { ...c, depthDiff: Math.abs(score - targetDepth) };
      });
      
      // Sort by similarity first, then prune by depth if needed
      return allChunks
        .sort((a: any, b: any) => a.depthDiff - b.depthDiff)
        .slice(0, count * 2); // Return a slightly larger set for AI to pick from
    }
  }

  // 3. Precise Search (Specific Note)
  console.log(`🔮 [Intelligence Search] Target Depth: ${targetDepth}/10`);
  const { data, error } = await supabase.rpc('match_document_sections', {
    query_embedding: queryEmbedding,
    match_threshold: 0.1,
    match_count: count * 2, // Fetch double for filtering
    p_course_id: courseId || null,
    p_note_id: noteId || null
  });

  if (error || !data) return null;

  // Refine by Depth
  const filtered = data
    .map((c: any) => ({
      ...c,
      depthDiff: Math.abs((c.metadata?.technicalScore || 5) - targetDepth)
    }))
    .sort((a: any, b: any) => a.depthDiff - b.depthDiff)
    .slice(0, count);

  return filtered;
}

/**
 * RELAXED CACHING: Checks if a course or note has ANY presence in the index.
 * Only re-indexes if 'force' is true (manual refresh).
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

  if (error || !data || data.length === 0) {
    return { indexed: false };
  }

  // If ANY records exist for this ID, we consider it indexed
  return { indexed: true, hasChanged: false };
}
