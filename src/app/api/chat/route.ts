import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRelevantContext } from '@/lib/rag';
import { canSendChatMessage, trackChatMessage } from '@/lib/shards';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const TONAL_INSTRUCTIONS: Record<string, string> = {
  Encouraging: "Be warm, supportive, and motivating. Celebrate progress and use positive reinforcement to keep the student engaged.",
  Direct: "Be clear and efficient. Skip pleasantries and get straight to the substance, but still explain things thoroughly when needed.",
  Academic: "Adopt a scholarly, rigorous tone. Use proper academic terminology and provide theoretical depth where it adds value."
};

import { getChatSystemPrompt } from '@/constants/prompts';


export async function POST(req: NextRequest) {
  try {
    const { messages, noteId, courseId, mode = 'study' } = await req.json();
    console.log(`📨 [Chat Route] Raw IDs received — noteId: "${noteId}" (len:${noteId?.length}), courseId: "${courseId}" (len:${courseId?.length})`);
    
    // Get user preferences & persona info
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch profile for most up-to-date major/nickname
    const { data: profile } = await supabase
      .from('profiles')
      .select('major, ai_feedback_tone')
      .eq('id', user?.id)
      .single();

    const major = profile?.major || user?.user_metadata?.major || 'General Studies';
    const feedbackTone = profile?.ai_feedback_tone || user?.user_metadata?.ai_feedback_tone || 'Encouraging';
    const tonalInstruction = TONAL_INSTRUCTIONS[feedbackTone] || TONAL_INSTRUCTIONS.Encouraging;

    // ─── SHARD CHECK (before AI call) ────────────────────────────
    const chatCheck = await canSendChatMessage(user.id);
    if (!chatCheck.allowed) {
      return NextResponse.json({ 
        error: 'INSUFFICIENT_SHARDS',
        balance: chatCheck.balance 
      }, { status: 402 });
    }

    const apiKey = process.env['DEEPSEEK_API_KEY'];
    if (!apiKey) {
      return NextResponse.json({ error: 'The tutor is temporarily unavailable.' }, { status: 500 });
    }

    let systemContent = getChatSystemPrompt(major);
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

    if (!retrieved.text && noteId) {
      console.error(`🛑 [Chat RAG] 0 chunks retrieved for note:${noteId}. The note may not be indexed or course_id is missing.`);
      return NextResponse.json({ 
        error: 'No indexed content found for this note. It may need to be re-indexed — try reopening the note or uploading it again.' 
      }, { status: 422 });
    }

    if (retrieved.text) {
      systemContent += `\n\n--- RELEVANT DOCUMENT SECTIONS ---\n${retrieved.text}\n--- END SECTIONS ---`;
      console.log(`📚 [Chat RAG] Retrieved ${retrieved.chunkCount} chunks (${retrieved.totalChars} chars) for query: "${query.slice(0, 80)}..."`);
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
        temperature: 0.7,
        max_tokens: 4000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status });
    }

    // ─── TRACK CHAT MESSAGE (deducts every 5th message) ──────────
    // Safe to call here — canSendChatMessage already verified balance.
    // We track BEFORE streaming so the deduction is guaranteed even if
    // the client disconnects mid-stream.
    await trackChatMessage(user.id);

    // Stream the SSE response back to the client as plain text chunks
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            // Parse SSE lines: "data: {...}\n\n"
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

            for (const line of lines) {
              const data = line.slice(6); // Remove "data: " prefix
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        } catch (err) {
          console.error('Stream reading error:', err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
