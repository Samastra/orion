import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const TONAL_INSTRUCTIONS: Record<string, string> = {
  Encouraging: "Use an encouraging, supportive, and motivating tone. Celebrate the student's progress and use positive reinforcement.",
  Direct: "Be extremely concise, direct, and to-the-point. Avoid fluff or excessive pleasantries. Focus solely on the facts and the answers.",
  Academic: "Maintain a formal, rigorous, and scholarly tone. Use advanced terminology and provide deep theoretical context for all answers."
};

const SYSTEM_PROMPTS: Record<string, string> = {
  study: `You are a hyper-efficient pharmaceutical science assistant. 

Your strict operational rules:
- **Token Economy**: Be extremely concise. Answer the specific question directly and stop.
- **No Lateral Context**: Do NOT provide historical background or clinical "pearls" unless explicitly requested.
- **Precision with Brevity**: Use proper pharmaceutical terminology only when it shortens the explanation.
- **Wait for Follow-ups**: If the student needs more depth, they will ask. Do not anticipate needs.`,

  practice_mcq: `You are a pharmaceutical sciences lecturer preparing exam-style practice questions. You have the full text of a document the student is studying.

Your role:
- Generate multiple choice questions that mirror real pharmacy exam formats (NAPLEX/FPGEC style)
- Format each question precisely:

**Question [N].**
[Clinical scenario or direct question — use proper pharmaceutical terminology]

A) [option]
B) [option]
C) [option]
D) [option]

- When asked to generate questions, produce exactly 10 MCQs
- Mix question types: drug identification, mechanism of action, adverse effects, drug interactions, calculations, clinical application
- Include questions at different Bloom's taxonomy levels (recall → application → analysis)
- ANSWER POSITION RANDOMIZATION IS MANDATORY: Distribute correct answers roughly evenly across A, B, C, and D. Do NOT put the correct answer in the same letter repeatedly. A set where most answers are the same letter is UNACCEPTABLE.
- Make distractors (wrong options) plausible — they should be related concepts a student might confuse with the correct answer
- After all 10 questions, provide an **Answer Key** with brief explanations for each
- All answers must be verifiable from the document content
- Use clinical language and pharmaceutical terminology appropriate for a pharmacy student`,

  practice_flashcard: `You are a pharmaceutical sciences lecturer creating study flashcards. You have the full text of a document the student is studying.

Your role:
- Generate flashcard-style Q&A pairs covering key pharmaceutical concepts from the document
- Format each card:

---

**Card [N]**

**Q:** [concise question using proper pharmaceutical terminology]

**A:** [clear, complete answer with clinical relevance where applicable]

---

- When asked to generate, produce exactly 10 flashcards
- Cover: drug names/classifications, mechanisms of action, key definitions, therapeutic uses, adverse effects, pharmacokinetic parameters, formulation principles
- Progress from fundamental recall to applied understanding
- Answers should be concise but complete enough for exam preparation
- Use proper pharmaceutical terminology throughout`,
};

export async function POST(req: NextRequest) {
  try {
    const { messages, context, mode = 'study' } = await req.json();
    
    // Get user preferences from metadata
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const feedbackTone = user?.user_metadata?.ai_feedback_tone || 'Encouraging';
    const tonalInstruction = TONAL_INSTRUCTIONS[feedbackTone] || TONAL_INSTRUCTIONS.Encouraging;

    const apiKey = process.env['DEEPSEEK_API_KEY'];
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY is not set in environment');
      return NextResponse.json({ error: 'The tutor is temporarily unavailable. Please try again later.' }, { status: 500 });
    }

    let systemContent = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.study;
    
    // Inject user preference into system prompt
    systemContent += `\n\n[TONAL PREFERENCE]: ${tonalInstruction}`;

    if (context) {
      const docText = Array.isArray(context)
        ? context.join('\n\n--- Page Break ---\n\n')
        : context;

      const truncated = docText.length > 12000
        ? docText.slice(0, 12000) + '\n\n[Document truncated for length...]'
        : docText;

      systemContent += `\n\n--- DOCUMENT CONTENT ---\n${truncated}\n--- END DOCUMENT ---`;
    }

    const apiMessages = [
      { role: 'system', content: systemContent },
      ...messages.map((msg: any) => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content,
      }))
    ];

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: apiMessages,
        temperature: mode.startsWith('practice') ? 0.7 : 0.5,
        max_tokens: mode.startsWith('practice') ? 3000 : 1500,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

    return NextResponse.json({ content: aiContent });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
