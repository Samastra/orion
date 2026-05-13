import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { checkSufficientShards, deductShards } from '@/lib/shards';
import { calculateLectureCost } from '@/constants/shards';
import { getLectureTransformPrompt } from '@/constants/prompts';

/**
 * POST /api/lecture/transform
 * 
 * Takes a full lecture transcript, transforms it into structured study notes
 * via Gemini, deducts shards (recording + transform), and saves the note 
 * to the user's course.
 * 
 * Request body:
 *   { transcript: string, courseId: string, durationSeconds: number }
 * 
 * Flow:
 *   1. Authenticate user
 *   2. Calculate shard cost from duration
 *   3. Check balance (pre-check)
 *   4. Send transcript to Gemini for transformation
 *   5. Save generated note to course
 *   6. Deduct shards (post-success)
 *   7. Return the note
 */
export async function POST(req: NextRequest) {
  try {
    // ─── AUTH ──────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ─── PARSE REQUEST ────────────────────────────────────────
    const { transcript, courseId, durationSeconds } = await req.json();

    if (!transcript || !transcript.trim()) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    if (!durationSeconds || durationSeconds <= 0) {
      return NextResponse.json({ error: 'Invalid recording duration' }, { status: 400 });
    }

    // ─── SHARD COST CALCULATION ───────────────────────────────
    const { recordingCost, transformCost, totalCost } = calculateLectureCost(durationSeconds);

    const shardCheck = await checkSufficientShards(user.id, totalCost);
    if (!shardCheck.sufficient) {
      return NextResponse.json({
        error: 'INSUFFICIENT_SHARDS',
        required: totalCost,
        balance: shardCheck.balance,
        breakdown: { recordingCost, transformCost },
      }, { status: 402 });
    }

    // ─── FETCH COURSE DETAILS ─────────────────────────────────
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('name, type')
      .eq('id', courseId)
      .eq('user_id', user.id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // ─── AI TRANSFORMATION ────────────────────────────────────
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const major = user.user_metadata?.major || course.type || 'your field of study';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: getLectureTransformPrompt(major, course.name),
    });

    console.log(`📝 [Lecture/Transform] Processing ${Math.ceil(durationSeconds / 60)}min lecture for ${course.name}...`);

    const result = await model.generateContent({
      contents: [{ 
        role: 'user', 
        parts: [{ text: `Here is the raw lecture transcript:\n\n${transcript}` }] 
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    });

    const noteContent = result.response.text();

    if (!noteContent || !noteContent.trim()) {
      return NextResponse.json({ error: 'AI returned empty notes. Please try again.' }, { status: 422 });
    }

    // ─── EXTRACT TITLE FROM GENERATED NOTES ───────────────────
    // Look for the first # heading in the generated markdown
    const titleMatch = noteContent.match(/^#\s+(.+)/m);
    const noteTitle = titleMatch 
      ? titleMatch[1].trim() 
      : `Lecture Notes – ${new Date().toLocaleDateString()}`;

    // ─── SAVE NOTE TO COURSE ──────────────────────────────────
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert([{
        course_id: courseId,
        user_id: user.id,
        title: noteTitle,
        content: noteContent,
      }])
      .select()
      .single();

    if (noteError) {
      console.error('❌ [Lecture/Transform] Failed to save note:', noteError);
      return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
    }

    // ─── DEDUCT SHARDS (post-success) ─────────────────────────
    await deductShards(user.id, totalCost, 'lecture_transform', {
      courseId,
      noteId: note.id,
      durationSeconds,
      durationMinutes: Math.ceil(durationSeconds / 60),
      recordingCost,
      transformCost,
    });

    console.log(`✅ [Lecture/Transform] Note saved (${note.id}). Deducted ${totalCost} shards.`);

    return NextResponse.json({
      noteId: note.id,
      title: noteTitle,
      content: noteContent,
      courseId,
      shardsDeducted: totalCost,
      breakdown: { recordingCost, transformCost },
    });

  } catch (error) {
    console.error('❌ [Lecture/Transform] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
