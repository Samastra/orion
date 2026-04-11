import { NextRequest, NextResponse } from 'next/server';
import { getRelevantContext, getMultiQueryContext } from '@/lib/rag';
import { GoogleGenerativeAI } from "@google/generative-ai";

const GET_DIFFICULTY_INSTRUCTION = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy':
      return "DIFFICULTY: EASY. Focus on core concepts, basic recall, and fundamental definitions. Questions should be straightforward and test primary document facts.";
    case 'Hard':
      return "DIFFICULTY: HARD. Focus on complex reasoning, integrated mechanisms, and rare but critical details. Require the student to connect multiple facts from the document.";
    case 'Exam-style':
      return "DIFFICULTY: EXAM-STYLE. Use high-stakes exam formatting. Focus on clinical prioritization, complex calculations, and safety-critical decisions. Distractors should be highly plausible.";
    default:
      return "DIFFICULTY: MEDIUM. Use a balanced mix of recall, application, and analysis questions.";
  }
};

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

const GET_MCQ_PROMPT = (count: number, difficulty: string) => `You are an academic lecturer. Generate exactly ${count} multiple choice questions from the provided document sections.

CRITICAL: You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no extra text. Just the JSON object.

The object must have this exact structure:
{
  "title": "A concise, categorical name for this set",
  "items": [
    {
      "id": 1,
      "question": "the question text",
      "options": ["option A text", "option B text", "option C text", "option D text"],
      "correctIndex": 2,
      "optionExplanations": [
        "Specifically explains why Option A is incorrect or correct.",
        "Specifically explains why Option B is incorrect or correct.",
        "Specifically explains why Option C is incorrect or correct.",
        "Specifically explains why Option D is incorrect or correct."
      ]
    },
    ... (exactly ${count} items)
  ]
}

Rules:
- ${GET_DIFFICULTY_INSTRUCTION(difficulty)}
- correctIndex is 0-based (0=A, 1=B, 2=C, 3=D)
- ANSWER POSITION RANDOMIZATION IS MANDATORY: Distribute correct answers roughly evenly across all four positions.
- Use proper academic terminology. Use LaTeX/KaTeX for formulas and scientific notation.
- JSON INTEGRITY: Double-escape backslashes in scientific notations.
- Questions should be based ONLY on the provided document sections.
- INDIVIDUAL OPTION FEEDBACK: You MUST provide exactly 4 strings in 'optionExplanations'.
- For the CORRECT option, explain exactly why it is definitively right based on the text.
- For WRONG options, explain the specific physiological/conceptual reason why they are distractors.
- Make distractors plausible — related concepts a student might confuse with the correct answer.`;

const GET_FLASHCARD_PROMPT = (count: number, difficulty: string) => `You are an academic lecturer. Generate exactly ${count} flashcards from the provided document sections.

CRITICAL: You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no extra text. Just the JSON object.

The object must have this exact structure:
{
  "title": "A concise, categorical name for this set",
  "items": [
    {
      "id": 1,
      "front": "the question or term",
      "back": "the answer or definition",
      "category": "one of: Definition, Mechanism, Classification, Clinical, Calculation, Concept"
    },
    ... (exactly ${count} items)
  ]
}

Rules:
- ${GET_DIFFICULTY_INSTRUCTION(difficulty)}
- Cover key concepts, definitions, mechanisms, and classifications from the document.
- Use proper academic terminology. Use LaTeX/KaTeX for formulas and scientific notation.
- JSON INTEGRITY: Double-escape backslashes in scientific notations.
- Content must be based ONLY on the provided document sections.`;

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
        ? GET_FLASHCARD_PROMPT(finalizedCount, difficulty)
        : GET_MCQ_PROMPT(finalizedCount, difficulty)
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
      console.warn(`🛑 [Practice API] Retrieval returned 0 content for Note:${noteId || 'all'} Course:${courseId || 'all'}. Either the table is empty or RLS is blocking the query.`);
      return NextResponse.json({ 
        error: 'No indexed content found. Please ensure the document has been indexed first.' 
      }, { status: 422 });
    }

    console.log(`📚 [Practice RAG] Retrieved ${retrieved.chunkCount} chunks (${retrieved.totalChars} chars)`);

    // ─── BUILD PROMPT ───────────────────────────────────────────
    let systemContent = `Generate ${finalizedCount} ${type === 'flashcard' ? 'flashcards' : 'MCQs'} now with ${difficulty} difficulty.`;

    if (!noteId) {
      systemContent = `You are performing a COMPREHENSIVE COURSE REVIEW. Generate ${finalizedCount} ${type === 'flashcard' ? 'flashcards' : 'MCQs'} across all the topics in the provided sections. Distribute questions evenly across different topics.`;
    }

    if (topicFocus && topicFocus.trim()) {
      systemContent += `\n\nIMPORTANT: Focus ALL questions specifically on this topic: "${topicFocus.trim()}". Only generate questions directly related to this topic.`;
    }

    if (technicalDepth > 7) {
      systemContent += `\n\n🎯 HIGH-TECHNICALITY MODE (Level ${technicalDepth}): Prioritize intricate details, numerical data, specific terms, and complex scenarios. Avoid general or 'common sense' questions.`;
    } else if (technicalDepth < 4) {
      systemContent += `\n\n🎯 CONCEPTUAL MODE (Level ${technicalDepth}): Focus on core concepts, fundamental definitions, and high-level understanding.`;
    }

    if (count >= 100) {
      systemContent += `\n\nCRITICAL: Generating ${count} items. Keep explanations succinct and ensure valid JSON.`;
    }

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
