import { NextRequest, NextResponse } from 'next/server';
import { getRelevantContext, getMultiQueryContext } from '@/lib/rag';
import { GoogleGenerativeAI } from "@google/generative-ai";

import { 
  getMCQSystemPrompt, 
  getFlashcardSystemPrompt, 
  getPracticeInstructionPrompt 
} from '@/constants/prompts';

async function withRetry<T>(fn: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    console.warn(`⚠️ [Retry] Failed, retrying in ${delay}ms... (${retries} left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

/**
 * Proactively cleans AI responses before parsing.
 * Removes markdown formatting, trailing commas, and unprintable characters.
 */
function sanitizeJSON(str: string): string {
  let cleaned = str.trim();
  
  // Remove markdown code blocks if present
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '');
  if (cleaned.endsWith('```')) cleaned = cleaned.replace(/\s*```$/, '');
  
  // Fix escaped backslashes if the AI messed up (common in LaTeX)
  // We want to ensure backslashes used for scientific notation are double-escaped
  // but we don't want to over-escape already-clean JSON.
  
  // Fix trailing commas in objects and arrays
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  
  return cleaned.trim();
}

/**
 * Attempts to repair truncated JSON responses by finding the last complete item in the 'items' array.
 */
function autoCloseJSON(str: string): string {
  // If it's already a valid object, leave it
  try { JSON.parse(str); return str; } catch (e) { /* continue to repair */ }

  // Seek the last complete question object (ends with "}")
  const lastBrace = str.lastIndexOf('}');
  if (lastBrace === -1) return str;

  // Take everything up to that brace and close the structure
  // Note: We assume the structure is { "title": "...", "items": [...] }
  return str.substring(0, lastBrace + 1) + ']}';
}

const MAX_PRACTICE_COUNT = 60;



export async function POST(req: NextRequest) {
  try {
    const { 
      type = 'mcq', 
      topicFocus, 
      count = 20, 
      difficulty = 'Medium',
      technicalDepth = 5,
      noteId,
      courseId 
    } = await req.json();

    const finalizedCount = Math.min(count, MAX_PRACTICE_COUNT);

    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: type === 'flashcard'
        ? getFlashcardSystemPrompt(finalizedCount, difficulty)
        : getMCQSystemPrompt(finalizedCount, difficulty)
    });

    // ─── RAG RETRIEVAL (always from DB, never from frontend) ────
    const baseQuery = topicFocus || "Key concepts, definitions, and important facts for a comprehensive review.";
    
    // Build additional queries for topic diversity
    const additionalQueries: string[] = [];
    if (!topicFocus) {
      additionalQueries.push(
        "Important mechanisms, processes, and how things work",
        "Classifications, categories, and types",
        "Practical applications, examples, and case scenarios"
      );
    }

    // Dynamic Context Scaling (Surgical Retrieval)
    // 1 chunk per 4 questions, minimum 3, maximum 20 to avoid dilution.
    const dynamicChunkCount = Math.min(20, Math.max(3, Math.ceil(count / 4)));

    const retrieved = await getMultiQueryContext({
      query: baseQuery,
      noteId,
      courseId,
      chunkCount: dynamicChunkCount,
      targetDepth: technicalDepth,
      additionalQueries,
    });

    if (!retrieved.text) {
      console.warn(`🛑 [Practice API] Retrieval returned 0 content for Note:${noteId || 'all'} Course:${courseId || 'all'}.`);
      return NextResponse.json({ 
        error: topicFocus 
          ? `Could not find any content in this document related to your focus topic: "${topicFocus}". Try a broader topic or check your spelling.`
          : 'Could not retrieve content for this document. It may need to be re-indexed, or it might be completely empty.' 
      }, { status: 422 });
    }

    console.log(`📚 [Practice RAG] Retrieved ${retrieved.chunkCount} chunks (${retrieved.totalChars} chars)`);

    // ─── BUILD PROMPT ───────────────────────────────────────────
    let systemContent = getPracticeInstructionPrompt({
      count: finalizedCount,
      type,
      difficulty,
      isCourseReview: !noteId,
      topicFocus,
      technicalDepth
    });

    systemContent += `\n\n--- DOCUMENT SECTIONS ---\n${retrieved.text}\n--- END SECTIONS ---`;

    // ─── GENERATE ───────────────────────────────────────────────
    const result = await withRetry(async () => {
      return await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemContent }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
        }
      });
    });

    const content = result.response.text();
    // ─── PARSE & RECOVER ────────────────────────────────────────
    const jsonContent = sanitizeJSON(content);

    /**
     * Surgical regex extraction for stranded items.
     * Uses a multi-stage fallback to ensure we get as many valid questions as possible.
     */
    const extractItems = (str: string): any[] => {
      const items: any[] = [];
      // Regex looks for "id": N through various structures until the end of the object
      const pattern = /\{\s*"id"\s*:\s*\d+[\s\S]*?\}/g;
      const matches = str.match(pattern);
      
      if (matches) {
        matches.forEach(m => {
          try {
            // Clean up backslashes for this specific chunk
            const cleanChunk = m.replace(/\\(?![bfnrtu\/"])/g, "\\\\");
            const item = JSON.parse(cleanChunk);
            
            if (type === 'mcq') {
              if (item.question && Array.isArray(item.options) && item.options.length >= 2) {
                // Ensure field integrity
                if (!item.optionExplanations || !Array.isArray(item.optionExplanations)) {
                  item.optionExplanations = new Array(item.options.length).fill("Contextual explanation provided above.");
                }
                items.push(item);
              }
            } else if (type === 'flashcard') {
              if (item.front && item.back) items.push(item);
            }
          } catch (e) { /* skip unparseable chunk */ }
        });
      }
      return items;
    };

    try {
      let items: any[] = [];
      let title = type === 'mcq' ? 'MCQ Practice' : 'Flashcard Practice';

      // Stage 1: Standard Parse
      try {
        const parsed = JSON.parse(jsonContent);
        items = parsed.items || [];
        if (parsed.title) title = parsed.title;
      } catch (e) {
        // Stage 2: Attempt Auto-Closure Repair (for truncated output)
        try {
          console.warn("⚠️ [Recovery] JSON truncated. Attempting auto-closure repair...");
          const repaired = JSON.parse(autoCloseJSON(jsonContent));
          items = repaired.items || [];
          if (repaired.title) title = repaired.title;
        } catch (e2) {
          // Stage 3: Surgical Item Extraction (Regex)
          console.warn("⚠️ [Recovery] Parse failed. Falling back to surgical item extraction...");
          items = extractItems(jsonContent);
          const titleMatch = jsonContent.match(/"title"\s*:\s*"([^"]+)"/);
          if (titleMatch) title = titleMatch[1];
        }
      }

      if (items.length === 0) {
        throw new Error("Zero valid items recovered from AI response.");
      }

      console.log(`✅ [Practice] Generated ${items.length} items.`);
      return NextResponse.json({ items, title });

    } catch (error) {
      console.error('Failed to parse AI response:', jsonContent.slice(0, 500));
      return NextResponse.json({
        error: 'The AI output was incompatible. Please try again.',
        details: error instanceof Error ? error.message : "Unknown error"
      }, { status: 422 });
    }
  } catch (error) {
    console.error('Practice API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
