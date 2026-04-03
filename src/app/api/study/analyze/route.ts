import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const SYSTEM_PROMPT = `You are a hyper-efficient pharmaceutical science tutor.
Your goal is to provide high-impact, extremely concise explanations for medical students.

STRICT CONSTRAINTS:
- Answer in MAX 3 short sentences or clear bullet points.
- NEVER use filler words or introductory phrases like "Sure, here is..." or "As a tutor...".
- Focus solely on the highlighted text provided.
- Use proper pharmaceutical terminology but keep it understandable.
- Be extremely token-efficient to conserve resources.

FORMAT:
Direct answer only. No pleasantries.`;

export async function POST(req: NextRequest) {
  try {
    const { action, text, context } = await req.json();
    
    const apiKey = process.env['DEEPSEEK_API_KEY'];
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY is not set in environment');
      return NextResponse.json({ error: 'Our analysis service is temporarily unavailable.' }, { status: 500 });
    }

    let userPrompt = "";
    if (action === 'explain') userPrompt = `Explain this pharmaceutical concept succinctly: "${text}"`;
    else if (action === 'summarize') userPrompt = `Summarize this text in 1-2 punchy bullets: "${text}"`;
    else if (action === 'quiz') userPrompt = `Give me one high-yield practice question about this: "${text}"`;
    else if (action === 'key_concepts') userPrompt = `What is the single most important high-yield fact here?: "${text}"`;
    else userPrompt = `Analyze this: "${text}"`;

    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ];

    // Optional: Add surrounding context to the prompt if it helps accuracy without bloating tokens
    if (context) {
      const truncatedContext = context.length > 2000 ? context.slice(0, 2000) : context;
      apiMessages[0].content += `\n\nCONTEXT FOR REFERENCE:\n${truncatedContext}`;
    }

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: apiMessages,
        temperature: 0.3, // Lower temperature for more factual, concise responses
        max_tokens: 200,   // Strict limit for token conservation
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
    console.error('Quick Analyze API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
