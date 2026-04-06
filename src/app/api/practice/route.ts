import { NextRequest, NextResponse } from 'next/server';
import { searchContent } from '@/lib/google/embeddings';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Removed DeepSeek URL as we are migrating to Gemini 3.1 Flash-Lite

const GET_DIFFICULTY_INSTRUCTION = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy':
      return "DIFFICULTY: EASY. Focus on core concepts, basic recall, and fundamental definitions. Questions should be straightforward and test primary document facts.";
    case 'Hard':
      return "DIFFICULTY: HARD. Focus on complex clinical reasoning, integrated mechanisms of action, and rare but critical adverse effects. Require the student to connect multiple facts from the document.";
    case 'Exam-style':
      return "DIFFICULTY: EXAM-STYLE (NAPLEX/FPGEC). Use high-stakes pharmacy exam formatting. Focus on clinical prioritization, complex calculations, and safety-critical decisions. Distractors should be highly plausible.";
    default:
      return "DIFFICULTY: MEDIUM. Use a balanced mix of recall, application (clinical scenarios), and analysis questions.";
  }
};

/**
 * RETRY UTILITY WITH EXPONENTIAL BACKOFF
 * Standardizes error recovery across the generation stack.
 */
async function withRetry<T>(fn: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    console.warn(`⚠️ [AI Practice Retry] Request failed, retrying in ${delay}ms... (${retries} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

const GET_MCQ_PROMPT = (count: number, difficulty: string) => `You are a pharmaceutical sciences lecturer. Generate exactly ${count} multiple choice questions from the provided document.

CRITICAL: You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no extra text. Just the JSON object.

The object must have this exact structure:
{
  "title": "A concise, categorical name for this set (e.g., 'Gram Stain & Bacterial Morphology')",
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
- ANSWER POSITION RANDOMIZATION IS MANDATORY: You MUST distribute the correct answers roughly evenly across all four positions (0, 1, 2, 3). Do NOT put the correct answer in the same position repeatedly. Aim for approximately 25% of correct answers at each index position across the ${count} questions.
- Use proper pharmaceutical terminology. You MUST use LaTeX/KaTeX (e.g. $H_2O$, $CO_2$) for ALL chemical formulas and scientific notation.
- JSON INTEGRITY: Since you are responding with a JSON string, you MUST double-escape all backslashes in your scientific notations (e.g., use \\\\Delta for \Delta, or \\\\frac for \frac). 
- Questions should be based ONLY on the document content 
- Explanations should be educational and reference the document. Use LaTeX for any scientific terms mentioned.
- Make distractors (wrong options) plausible — they should be related concepts that a student might confuse with the correct answer`;

const GET_FLASHCARD_PROMPT = (count: number, difficulty: string) => `You are a pharmaceutical sciences lecturer. Generate exactly ${count} flashcards from the provided document.

CRITICAL: You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no extra text. Just the JSON object.

The object must have this exact structure:
{
  "title": "A concise, categorical name for this set (e.g., 'Clinical Microbiology Terms')",
  "items": [
    {
      "id": 1,
      "front": "the question or term",
      "back": "the answer or definition",
      "category": "one of: Definition, Mechanism, Classification, Clinical, Calculation"
    },
    ... (exactly ${count} items)
  ]
}

Rules:
- ${GET_DIFFICULTY_INSTRUCTION(difficulty)}
- Cover key concepts, definitions, mechanisms, drug classifications
- Use proper pharmaceutical terminology. You MUST use LaTeX/KaTeX for ALL chemical formulas and scientific notation (e.g. $K_m$, $\Delta G$).
- JSON INTEGRITY: Since you are responding with a JSON string, you MUST double-escape all backslashes in your scientific notations (e.g., use \\\\Delta for \Delta).
- Content must be based on the document`;

export async function POST(req: NextRequest) {
  try {
    const { 
      context, 
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

    let processedContext = context;
    if (context) {
      const docText = Array.isArray(context)
        ? context.join('\n\n--- Page Break ---\n\n')
        : context;
      
      // --- SEMANTIC RAG LOGIC ---
      // If the document is large (>12k chars), we perform a search instead of truncation
      if (docText.length > 12000) {
        console.log("🔍 [RAG] Large document detected:", docText.length, "characters.");
        const searchQuery = topicFocus || "Key concepts, definitions, clinical scenarios, and mechanisms of action for a comprehensive review.";
        console.log("🔍 [RAG] Generating search vector for topic:", searchQuery);
        
        try {
          const relevantChunks = await searchContent(searchQuery, noteId, courseId, 10, technicalDepth);
          if (relevantChunks && relevantChunks.length > 0) {
            console.log(`✅ [RAG] Successfully retrieved ${relevantChunks.length} high-yield chunks.`);
            processedContext = relevantChunks.map((c: any) => c.content).join('\n\n--- Relevant Section ---\n\n');
          } else {
            console.log("⚠️ [RAG] No relevant chunks found. Falling back to head truncation.");
            processedContext = docText.slice(0, 12000) + '\n\n[Document truncated for efficiency...]';
          }
        } catch (searchErr) {
          console.error("❌ [RAG] Semantic search failed:", searchErr);
          processedContext = docText.slice(0, 12000) + '\n\n[Document truncated for efficiency...]';
        }
      } else {
        processedContext = docText;
      }
    }

    let systemContent = `Generate ${count} ${type === 'flashcard' ? 'flashcards' : 'MCQs'} now with ${difficulty} difficulty.`;

    // Multi-Note Awareness: If no noteId is provided, we are in Course-Wide mode
    if (!noteId) {
      systemContent = `You are performing a COMPREHENSIVE COURSE REVIEW. Generate ${count} ${type === 'flashcard' ? 'flashcards' : 'MCQs'} across the entire curriculum provided below. 
      Ensure you distribute the questions RANDOMLY and EVENLY across all the different topics, notes, and sections found in the DOCUMENT CONTENT. Do not focus on just one chapter; variety is critical for a full course exam.`;
    }

    if (topicFocus && topicFocus.trim()) {
      systemContent += `\n\nIMPORTANT: Focus ALL questions specifically on this topic: "${topicFocus.trim()}". Only generate questions directly related to this topic from the document content. Do not generate questions about unrelated sections.`;
    }

    // Intelligence Upgrade: Technical Depth Bias
    if (technicalDepth > 7) {
      systemContent += `\n\n🎯 HIGH-TECHNICALITY MODE (Level ${technicalDepth}): Prioritize intricate details, numerical ranges, specific drug names, physicochemical attributes (pKa, logP, etc.), and complex clinical data found in the provided snippets. Avoid general or 'common sense' questions. Focus on the data points that a professional or advanced student must know.`;
    } else if (technicalDepth < 4) {
      systemContent += `\n\n🎯 CONCEPTUAL MODE (Level ${technicalDepth}): Focus on core concepts, fundamental definitions, and high-level mechanisms. Ideal for initial learning and memory anchoring.`;
    }

    // Reliability hint for large requests
    if (count >= 100) {
      systemContent += `\n\nCRITICAL PERFORMANCE HINT: You are generating 100 items. To ensure valid JSON and prevent timeouts, keep explanations succinct and ensure the JSON syntax is perfectly closed.`;
    }

    // Include the document context
    systemContent += `\n\n--- DOCUMENT CONTENT ---\n${processedContext}\n--- END DOCUMENT ---`;

    const result = await withRetry(async () => {
      return await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemContent }] }],
        generationConfig: {
          temperature: 0.7, // Slightly lower for more stable long-form JSON
          responseMimeType: "application/json",
          maxOutputTokens: 8192, // MAX CAPACITY for 100+ item sessions
        }
      });
    });

    const content = result.response.text();

    // Gemini 3.1 Flash-Lite in JSON mode is very clean, but we still handle extraction for safety
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    let jsonContent = jsonMatch ? jsonMatch[0] : content;

    // Resilience helper: Tries to extract valid JSON blocks from malformed/truncated output.
    const extractItems = (str: string): any[] => {
      const items: any[] = [];
      // Look for objects that look like questions/cards using a non-greedy block match
      // This is a "best-effort" recovery for truncated JSON.
      const pattern = /\{\s*"id"\s*:\s*\d+,\s*[^}]*\}/g;
      const matches = str.match(pattern);
      
      if (matches) {
        matches.forEach(m => {
          try {
            // Repair backslashes and attempt to parse individual item
            const item = JSON.parse(m.replace(/\\(?![bfnrtu\/"])/g, "\\\\"));
            // Basic validation
            if (type === 'mcq' && item.question && item.options) items.push(item);
            if (type === 'flashcard' && item.front && item.back) items.push(item);
          } catch (e) {
            // Skip unrecoverable fragments
          }
        });
      }
      return items;
    };

    const repairJSON = (str: string) => {
      // Look for backslashes that aren't followed by valid escape chars
      return str.replace(/\\(?![bfnrtu\/"])/g, "\\\\");
    };

    try {
      let items: any[] = [];
      let title = type === 'mcq' ? 'MCQ Practice' : 'Flashcard Practice';

      try {
        const parsed = JSON.parse(repairJSON(jsonContent));
        items = parsed.items || [];
        if (parsed.title) title = parsed.title;
      } catch (e) {
        // Fallback: Resilience Recovery for truncated or malformed JSON
        console.warn("⚠️ [Resilience] Standard parse failed. Attempting item recovery...");
        items = extractItems(jsonContent);
        
        // Try to recover a title if possible
        const titleMatch = jsonContent.match(/"title"\s*:\s*"([^"]+)"/);
        if (titleMatch) title = titleMatch[1];
      }

      // Ensure we have something to show
      if (items.length === 0) {
        throw new Error("Zero valid items could be recovered from the AI response.");
      }

      console.log(`✅ [Self-Healing] Successfully rendered ${items.length} recovered items.`);
      return NextResponse.json({ items, title });

    } catch (error) {
      console.error('Failed to parse AI response as JSON:', jsonContent.slice(0, 500));
      return NextResponse.json({
        error: 'The AI output was incompatible. This usually happens with complex formulas or extreme volume. Please try again.',
        details: error instanceof Error ? error.message : "Unknown error"
      }, { status: 422 });
    }
  } catch (error) {
    console.error('Practice API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
