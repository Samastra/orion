import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const TRANSFORM_PROMPT = `You are a professional educational expert and structural specialist.
Your task is to take a raw study note and transform it into a "Structured Study Guide" for any academic discipline.

CORE OBJECTIVE:
- Create a document that is BEAUTIFUL, SPHERE-LIKE (balanced), and EXTREMELY EASY TO READ.
- Avoid walls of text. Use spacing and structural elements to create a professional feel.

FORMATTING RULES:
1. **Visual Hierarchy**: 
   - Use # (H1) for the main document title. This must be in **TITLE CASE** and centered (optional, use #).
   - Use ## (H2) for major sections (Overview, Mechanism, etc.). These must also be in **TITLE CASE**.
   - Use ### (H3) for sub-points and specific details.
   - Strictly follow this hierarchy (H1 -> H2 -> H3) to ensure a professional academic structure.
2. **Scientific Formulas**: YOU MUST USE LaTeX format for ALL scientific formulas, chemical notations, or mathematical expressions. Use single $ for inline (e.g., $C_{60}$) and double $$ for block equations.
3. **Structured Tables**: If the material compares items or lists properties, YOU MUST use a standard Markdown Table. 
   Example:
   | Property | Description |
   | :--- | :--- |
   | Solubility | Highly insoluble in water |
   
   Ensure you use the | and --- separators correctly. If a table is missing these, it is a FAILURE.
4. **Paragraph Spacing**: ALWAYS add empty lines between headers and paragraphs, and between two paragraphs. Do not "dump" text in one big block. Use white space to your advantage.
5. **Key Takeaways**: Use blockquotes (>) for important clinical pearls or "Must-Know" facts.
5. **Bold & Lists**: Use bolding for key terms and bullet points for lists to break up text.

DOCUMENT STRUCTURE:
- **Title**: Professional and catchy.
- **Executive Summary**: 2-3 sentences max.
- **Detailed Breakdown**: Use logical sectioning relevant to the topic.
- **Quick Reference Table**: If applicable.

DO NOT add internal commentary. Respond ONLY with the transformed Markdown guide.`;

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    const apiKey = process.env['DEEPSEEK_API-KEY'];
    if (!apiKey) {
      return NextResponse.json({ error: 'DeepSeek API key not configured' }, { status: 500 });
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
