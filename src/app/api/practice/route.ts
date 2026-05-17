import { NextRequest, NextResponse } from 'next/server';
import { getRelevantContext, getMultiQueryContext } from '@/lib/rag';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@/lib/supabase/server';
import { checkSufficientShards, deductShards } from '@/lib/shards';
import { calculatePracticeCost } from '@/constants/shards';

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

    // ─── AUTH & SHARD CHECK ───────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const practiceType = type === 'flashcard' ? 'flashcard' : 'mcq';
    const shardCost = calculatePracticeCost(practiceType as 'mcq' | 'flashcard', finalizedCount);
    const shardCheck = await checkSufficientShards(user.id, shardCost);

    if (!shardCheck.sufficient) {
      return NextResponse.json({ 
        error: 'INSUFFICIENT_SHARDS',
        required: shardCost,
        balance: shardCheck.balance 
      }, { status: 402 });
    }

    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const baseQuery = topicFocus || "Key concepts, definitions, and important facts for a comprehensive review.";
    const additionalQueries: string[] = [];
    if (!topicFocus) {
      additionalQueries.push(
        "Important mechanisms, processes, and how things work",
        "Classifications, categories, and types",
        "Practical applications, examples, and case scenarios"
      );
    }

    // ─── HELPER: GENERATE FOR SPECIFIC SCOPE ────────────────────
    const generateForScope = async (targetNoteId: string | null, targetCount: number) => {
      const dynamicChunkCount = Math.min(20, Math.max(3, Math.ceil(targetCount / 4)));

      const retrieved = await getMultiQueryContext({
        query: baseQuery,
        noteId: targetNoteId || undefined,
        courseId,
        chunkCount: dynamicChunkCount,
        targetDepth: technicalDepth,
        additionalQueries,
      });

      if (!retrieved.text) return { items: [], title: null };

      let systemContent = getPracticeInstructionPrompt({
        count: targetCount,
        type,
        difficulty,
        isCourseReview: !targetNoteId,
        topicFocus,
        technicalDepth
      });

      systemContent += `\n\n--- DOCUMENT SECTIONS ---\n${retrieved.text}\n--- END SECTIONS ---`;

      const model = genAI.getGenerativeModel({ 
        model: "gemini-3.1-flash-lite-preview",
        systemInstruction: type === 'flashcard'
          ? getFlashcardSystemPrompt(targetCount, difficulty)
          : getMCQSystemPrompt(targetCount, difficulty)
      });

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
      const jsonContent = sanitizeJSON(content);

      const extractItems = (str: string): any[] => {
        const items: any[] = [];
        const pattern = /\{\s*"id"\s*:\s*\d+[\s\S]*?\}/g;
        const matches = str.match(pattern);
        if (matches) {
          matches.forEach(m => {
            try {
              const cleanChunk = m.replace(/\\(?![bfnrtu\/"])/g, "\\\\");
              const item = JSON.parse(cleanChunk);
              if (type === 'mcq') {
                if (item.question && Array.isArray(item.options) && item.options.length >= 2) {
                  if (!item.optionExplanations || !Array.isArray(item.optionExplanations)) {
                    item.optionExplanations = new Array(item.options.length).fill("Contextual explanation provided above.");
                  }
                  items.push(item);
                }
              } else if (type === 'flashcard') {
                if (item.front && item.back) items.push(item);
              }
            } catch (e) { }
          });
        }
        return items;
      };

      let items: any[] = [];
      let title = type === 'mcq' ? 'MCQ Practice' : 'Flashcard Practice';

      try {
        const parsed = JSON.parse(jsonContent);
        items = parsed.items || [];
        if (parsed.title) title = parsed.title;
      } catch (e) {
        try {
          const repaired = JSON.parse(autoCloseJSON(jsonContent));
          items = repaired.items || [];
          if (repaired.title) title = repaired.title;
        } catch (e2) {
          items = extractItems(jsonContent);
          const titleMatch = jsonContent.match(/"title"\s*:\s*"([^"]+)"/);
          if (titleMatch) title = titleMatch[1];
        }
      }
      return { items, title };
    };

    // ─── EXECUTE PARALLEL OR SINGLE ─────────────────────────────
    let finalItems: any[] = [];
    let finalTitle = type === 'mcq' ? 'MCQ Practice' : 'Flashcard Practice';

    if (!noteId && courseId) {
      // Parallel Note Processing Architecture
      console.log(`[Practice API] Running parallel generation for course: ${courseId}`);
      const { data: notes } = await supabase.from('notes').select('id').eq('course_id', courseId);
      
      if (!notes || notes.length === 0) {
        return NextResponse.json({ error: 'No notes found in this course to generate practice from.' }, { status: 422 });
      }

      const numNotes = notes.length;
      const baseCount = Math.floor(finalizedCount / numNotes);
      let remainder = finalizedCount % numNotes;
      
      const promises = notes.map(note => {
        let countForThisNote = baseCount;
        if (remainder > 0) {
          countForThisNote += 1;
          remainder -= 1;
        }
        if (countForThisNote === 0) return Promise.resolve({ items: [], title: null });
        return generateForScope(note.id, countForThisNote);
      });

      const results = await Promise.allSettled(promises);
      for (const res of results) {
        if (res.status === 'fulfilled' && res.value.items) {
          finalItems.push(...res.value.items);
        }
      }
      finalTitle = 'Comprehensive Course Review';
    } else {
      // Single Note
      const res = await generateForScope(noteId, finalizedCount);
      finalItems = res.items;
      if (res.title) finalTitle = res.title;
    }

    if (finalItems.length === 0) {
      return NextResponse.json({ error: 'Could not generate any valid items. The course might be empty or missing context.' }, { status: 422 });
    }

    // Shuffle and Cap
    finalItems.sort(() => Math.random() - 0.5);
    finalItems = finalItems.slice(0, finalizedCount);

    console.log(`✅ [Practice] Generated ${finalItems.length} items successfully.`);

    // ─── DEDUCT SHARDS ──────────────────────────────────────────
    const actualCost = calculatePracticeCost(practiceType as 'mcq' | 'flashcard', finalItems.length);
    await deductShards(user.id, actualCost, `practice_${practiceType}`, {
      count: finalItems.length,
      difficulty,
      noteId: noteId || null,
      courseId: courseId || null,
    });

    return NextResponse.json({ items: finalItems, title: finalTitle, shardsDeducted: actualCost });

  } catch (error) {
    console.error('Practice API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
