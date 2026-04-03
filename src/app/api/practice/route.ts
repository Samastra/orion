import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

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
- Use proper pharmaceutical terminology
- Questions should be based ONLY on the document content
- Explanations should be educational and reference the document
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
- Use proper pharmaceutical terminology
- Content must be based on the document`;

export async function POST(req: NextRequest) {
  try {
    const { context, type = 'mcq', topicFocus, count = 10, difficulty = 'Medium' } = await req.json();

    const apiKey = process.env['DEEPSEEK_API-KEY'];
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const systemPrompt = type === 'flashcard'
      ? GET_FLASHCARD_PROMPT(count, difficulty)
      : GET_MCQ_PROMPT(count, difficulty);

    let systemContent = systemPrompt;
    if (context) {
      const docText = Array.isArray(context)
        ? context.join('\n\n--- Page Break ---\n\n')
        : context;
      const truncated = docText.length > 12000
        ? docText.slice(0, 12000) + '\n\n[Document truncated...]'
        : docText;
      systemContent += `\n\n--- DOCUMENT CONTENT ---\n${truncated}\n--- END DOCUMENT ---`;
    }

    if (topicFocus && topicFocus.trim()) {
      systemContent += `\n\nIMPORTANT: Focus ALL questions specifically on this topic: "${topicFocus.trim()}". Only generate questions directly related to this topic from the document content. Do not generate questions about unrelated sections.`;
    }

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: `Generate ${count} ${type === 'flashcard' ? 'flashcards' : 'MCQs'} now with ${difficulty} difficulty. Respond with ONLY the JSON object containing 'title' and 'items'.` },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';

    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    try {
      const parsed = JSON.parse(content);
      // Ensure we have the structure we expect
      if (!parsed.items || !Array.isArray(parsed.items)) {
        throw new Error("Invalid structure returned");
      }
      return NextResponse.json({
        items: parsed.items,
        title: parsed.title || (type === 'mcq' ? 'MCQ Practice' : 'Flashcard Practice')
      });
    } catch {
      console.error('Failed to parse AI response as JSON:', content.slice(0, 200));
      return NextResponse.json({ error: 'AI returned invalid format. Please try again.' }, { status: 422 });
    }
  } catch (error) {
    console.error('Practice API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
