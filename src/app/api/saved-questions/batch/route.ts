import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { courseId, questions, type } = await req.json();

    if (!courseId || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Missing courseId or questions array' }, { status: 400 });
    }

    if (!['flashcard', 'mcq'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "flashcard" or "mcq"' }, { status: 400 });
    }

    // Map each generated question into the saved_questions schema
    const rows = questions.map((q: any) => {
      if (type === 'flashcard') {
        return {
          course_id: courseId,
          user_id: user.id,
          question_type: 'flashcard',
          question_data: {
            question: q.front,
            answer: q.back,
            category: q.category || 'General',
          },
        };
      } else {
        // MCQ
        return {
          course_id: courseId,
          user_id: user.id,
          question_type: 'mcq',
          question_data: {
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          },
        };
      }
    });

    const { data, error } = await supabase
      .from('saved_questions')
      .insert(rows)
      .select('id');

    if (error) {
      console.error('Batch save error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      saved: data?.length ?? 0,
      message: `${data?.length ?? 0} ${type === 'flashcard' ? 'flashcards' : 'questions'} saved to course.`
    });
  } catch (err: any) {
    console.error('Batch save error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
