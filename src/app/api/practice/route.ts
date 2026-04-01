import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const MCQ_PROMPT = `You are a pharmaceutical sciences lecturer. Generate exactly 10 multiple choice questions from the provided document.

CRITICAL: You MUST respond with ONLY a valid JSON array. No markdown, no explanation, no extra text. Just the JSON array.

Each object in the array must have this exact structure:
{
  "id": 1,
  "question": "the question text",
  "options": ["option A text", "option B text", "option C text", "option D text"],
  "correctIndex": 0,
  "explanation": "why this answer is correct"
}

Rules:
- correctIndex is 0-based (0=A, 1=B, 2=C, 3=D)
- Mix difficulty levels: 4 recall, 3 application, 3 analysis
- Use proper pharmaceutical terminology
- Questions should be based ONLY on the document content
- Explanations should be educational and reference the document`;

const FLASHCARD_PROMPT = `You are a pharmaceutical sciences lecturer. Generate exactly 10 flashcards from the provided document.

CRITICAL: You MUST respond with ONLY a valid JSON array. No markdown, no explanation, no extra text. Just the JSON array.

Each object in the array must have this exact structure:
{
  "id": 1,
  "front": "the question or term",
  "back": "the answer or definition",
  "category": "one of: Definition, Mechanism, Classification, Clinical, Calculation"
}

Rules:
- Cover key concepts, definitions, mechanisms, drug classifications
- Use proper pharmaceutical terminology
- Progress from basic recall to deeper understanding
- Content must be based on the document`;

export async function POST(req: NextRequest) {
  try {
    const { context, type = 'mcq', topicFocus } = await req.json();

    const apiKey = process.env['DEEPSEEK_API-KEY'];
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const systemPrompt = type === 'flashcard' ? FLASHCARD_PROMPT : MCQ_PROMPT;

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
          { role: 'user', content: `Generate 10 ${type === 'flashcard' ? 'flashcards' : 'MCQs'} now. Respond with ONLY the JSON array.` },
        ],
        temperature: 0.7,
        max_tokens: 3000,
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
      return NextResponse.json({ items: parsed });
    } catch {
      console.error('Failed to parse AI response as JSON:', content.slice(0, 200));
      return NextResponse.json({ error: 'AI returned invalid format. Please try again.' }, { status: 422 });
    }
  } catch (error) {
    console.error('Practice API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
