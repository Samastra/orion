import { NextRequest, NextResponse } from 'next/server';
import { getRelevantContext } from '@/lib/rag';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

import { ANALYZE_SYSTEM_PROMPT } from '@/constants/prompts';

const SYSTEM_PROMPT = ANALYZE_SYSTEM_PROMPT;

export async function POST(req: NextRequest) {
  try {
    const { action, text, noteId, courseId } = await req.json();
    
    const apiKey = process.env['DEEPSEEK_API_KEY'];
    if (!apiKey) {
      return NextResponse.json({ error: 'Analysis service temporarily unavailable.' }, { status: 500 });
    }

    let userPrompt = "";
    if (action === 'explain') userPrompt = `Explain this concept succinctly: "${text}"`;
    else if (action === 'summarize') userPrompt = `Summarize this text in 1-2 punchy bullets: "${text}"`;
    else if (action === 'simplify') userPrompt = `Explain this in the simplest possible terms: "${text}"`;
    else if (action === 'quiz') userPrompt = `Give me one high-yield practice question about this: "${text}"`;
    else if (action === 'key_concepts') userPrompt = `What is the single most important fact here?: "${text}"`;
    else userPrompt = `Analyze this: "${text}"`;

    // RAG: retrieve surrounding context from the DB
    let systemContent = SYSTEM_PROMPT;

    if (noteId || courseId) {
      const retrieved = await getRelevantContext({
        query: text,
        noteId,
        courseId,
        chunkCount: 3, // Small — just surrounding context
      });

      if (retrieved.text) {
        systemContent += `\n\nSURROUNDING CONTEXT FROM DOCUMENT:\n${retrieved.text}`;
      }
    }

    const apiMessages = [
      { role: 'system', content: systemContent },
      { role: 'user', content: userPrompt }
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
        temperature: 0.3,
        max_tokens: 200,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || 'No analysis available.';

    return NextResponse.json({ content: aiContent });
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
