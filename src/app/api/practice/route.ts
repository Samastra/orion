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
      "explanation": "why this answer is correct"
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
- Explanations should be educational and reference the document content.
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
      count = 10, 
      difficulty = 'Medium',
      technicalDepth = 5,
      noteId,
      courseId 
    } = await req.json();

    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: type === 'flashcard'
        ? GET_FLASHCARD_PROMPT(count, difficulty)
        : GET_MCQ_PROMPT(count, difficulty)
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

    const retrieved = await getMultiQueryContext({
      query: baseQuery,
      noteId,
      courseId,
      chunkCount: Math.min(count, 12), // Scale retrieval with question count
      targetDepth: technicalDepth,
      additionalQueries,
    });

    if (!retrieved.text) {
      return NextResponse.json({ 
        error: 'No indexed content found. Please ensure the document has been indexed first.' 
      }, { status: 422 });
    }

    console.log(`📚 [Practice RAG] Retrieved ${retrieved.chunkCount} chunks (${retrieved.totalChars} chars)`);

    // ─── BUILD PROMPT ───────────────────────────────────────────
    let systemContent = `Generate ${count} ${type === 'flashcard' ? 'flashcards' : 'MCQs'} now with ${difficulty} difficulty.`;

    if (!noteId) {
      systemContent = `You are performing a COMPREHENSIVE COURSE REVIEW. Generate ${count} ${type === 'flashcard' ? 'flashcards' : 'MCQs'} across all the topics in the provided sections. Distribute questions evenly across different topics.`;
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
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    let jsonContent = jsonMatch ? jsonMatch[0] : content;

    // ─── PARSE & RECOVER ────────────────────────────────────────
    const extractItems = (str: string): any[] => {
      const items: any[] = [];
      const pattern = /\{\s*"id"\s*:\s*\d+,\s*[^}]*\}/g;
      const matches = str.match(pattern);
      if (matches) {
        matches.forEach(m => {
          try {
            const item = JSON.parse(m.replace(/\\(?![bfnrtu\/"])/g, "\\\\"));
            if (type === 'mcq' && item.question && item.options) items.push(item);
            if (type === 'flashcard' && item.front && item.back) items.push(item);
          } catch (e) { /* skip */ }
        });
      }
      return items;
    };

    const repairJSON = (str: string) => str.replace(/\\(?![bfnrtu\/"])/g, "\\\\");

    try {
      let items: any[] = [];
      let title = type === 'mcq' ? 'MCQ Practice' : 'Flashcard Practice';

      try {
        const parsed = JSON.parse(repairJSON(jsonContent));
        items = parsed.items || [];
        if (parsed.title) title = parsed.title;
      } catch (e) {
        console.warn("⚠️ [Recovery] Standard parse failed. Attempting item recovery...");
        items = extractItems(jsonContent);
        const titleMatch = jsonContent.match(/"title"\s*:\s*"([^"]+)"/);
        if (titleMatch) title = titleMatch[1];
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
