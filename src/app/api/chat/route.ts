import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRelevantContext } from '@/lib/rag';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const TONAL_INSTRUCTIONS: Record<string, string> = {
  Encouraging: "Use an encouraging, supportive, and motivating tone. Celebrate the student's progress and use positive reinforcement.",
  Direct: "Be extremely concise, direct, and to-the-point. Avoid fluff or excessive pleasantries. Focus solely on the facts and the answers.",
  Academic: "Maintain a formal, rigorous, and scholarly tone. Use advanced terminology and provide deep theoretical context for all answers."
};

const SYSTEM_PROMPT = `You are a hyper-efficient academic study assistant. 

Your strict operational rules:
- **Token Economy**: Be extremely concise. Answer the specific question directly and stop.
- **No Lateral Context**: Do NOT provide historical background or tangential information unless explicitly requested.
- **Precision with Brevity**: Use proper academic terminology only when it shortens the explanation.
- **Wait for Follow-ups**: If the student needs more depth, they will ask. Do not anticipate needs.
- **Source Grounding**: Base your answers ONLY on the provided document sections. If the answer isn't in the provided content, say so.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, noteId, courseId, mode = 'study' } = await req.json();
    
    // Get user preferences
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const feedbackTone = user?.user_metadata?.ai_feedback_tone || 'Encouraging';
    const tonalInstruction = TONAL_INSTRUCTIONS[feedbackTone] || TONAL_INSTRUCTIONS.Encouraging;

    const apiKey = process.env['DEEPSEEK_API_KEY'];
    if (!apiKey) {
      return NextResponse.json({ error: 'The tutor is temporarily unavailable.' }, { status: 500 });
    }

    let systemContent = SYSTEM_PROMPT;
    systemContent += `\n\n[TONAL PREFERENCE]: ${tonalInstruction}`;

    // RAG retrieval — get only the relevant chunks for this question
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
    const query = lastUserMessage?.content || 'general overview';

    const retrieved = await getRelevantContext({
      query,
      noteId,
      courseId,
      chunkCount: 6,
    });

    if (retrieved.text) {
      systemContent += `\n\n--- RELEVANT DOCUMENT SECTIONS ---\n${retrieved.text}\n--- END SECTIONS ---`;
      console.log(`📚 [Chat RAG] Retrieved ${retrieved.chunkCount} chunks (${retrieved.totalChars} chars) for query: "${query.slice(0, 80)}..."`);
    } else {
      console.log(`⚠️ [Chat RAG] No indexed content found for noteId=${noteId}, courseId=${courseId}. Proceeding without context.`);
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
        temperature: 0.5,
        max_tokens: 1500,
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
