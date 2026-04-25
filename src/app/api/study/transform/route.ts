import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

import { TRANSFORM_PROMPT as CENTRAL_TRANSFORM_PROMPT } from '@/constants/prompts';

const TRANSFORM_PROMPT = CENTRAL_TRANSFORM_PROMPT;

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    const apiKey = process.env['DEEPSEEK_API_KEY'];
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY is not set in environment');
      return NextResponse.json({ error: 'The tutor is temporarily unavailable. Please try again later.' }, { status: 500 });
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
          { role: 'system', content: TRANSFORM_PROMPT },
          { role: 'user', content: `Refine this note into a high-quality study guide:\n\n${content}` },
        ],
        temperature: 0.5, // Lower temperature for more structured output
        max_tokens: 4000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return NextResponse.json({ error: `AI service error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    let transformedResult = data.choices?.[0]?.message?.content || '';

    // Strip markdown code fences if the AI wrapped the entire response
    transformedResult = transformedResult.replace(/^```markdown\n/, '').replace(/\n```$/, '').trim();

    return NextResponse.json({ transformed: transformedResult });
  } catch (error) {
    console.error('Study Transform error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
