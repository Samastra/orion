'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

/**
 * MCQ PERFORMANCE TRACKING
 */

export async function saveMCQAttempt(courseId: string, questionText: string, isCorrect: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // Create a unique hash for the question to identify it across sessions
  const questionHash = crypto.createHash('sha256').update(questionText).digest('hex');

  // Check if this user has attempted this exact question before in this course
  const { data: existingAttempt, error: checkError } = await supabase
    .from('practice_attempts')
    .select('id, attempt_number')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('question_hash', questionHash)
    .order('attempt_number', { ascending: false })
    .limit(1);

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error('Error checking attempts:', checkError);
  }

  const nextAttemptNumber = existingAttempt && existingAttempt.length > 0 
    ? existingAttempt[0].attempt_number + 1 
    : 1;

  const { data, error } = await supabase
    .from('practice_attempts')
    .insert([
      {
        user_id: user.id,
        course_id: courseId,
        question_hash: questionHash,
        is_correct: isCorrect,
        attempt_number: nextAttemptNumber,
      }
    ])
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getPerformanceData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // 1. Fetch ALL courses for this user
  const { data: allCourses, error: courseError } = await supabase
    .from('courses')
    .select('id, name')
    .eq('user_id', user.id);

  if (courseError) return { error: courseError.message };

  // 2. Fetch only FIRST attempts for all courses
  const { data: attempts, error: attemptError } = await supabase
    .from('practice_attempts')
    .select('is_correct, course_id')
    .eq('user_id', user.id)
    .eq('attempt_number', 1);

  if (attemptError) return { error: attemptError.message };

  // Initialize stats with all courses (starting at 0)
  const stats: Record<string, { name: string; correct: number; total: number }> = {};
  allCourses.forEach(c => {
    stats[c.id] = { name: c.name, correct: 0, total: 0 };
  });

  // Aggregate stats per course
  attempts.forEach((attempt: any) => {
    if (stats[attempt.course_id]) {
      stats[attempt.course_id].total += 1;
      if (attempt.is_correct) {
        stats[attempt.course_id].correct += 1;
      }
    }
  });

  // Format for the chart
  const chartData = Object.values(stats).map(s => ({
    name: s.name,
    score: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    totalQuestions: s.total
  }));

  return { data: chartData };
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = (await headers()).get('origin');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Google sign in error:', error);
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const nickname = formData.get('nickname') as string;
  const major = formData.get('major') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        nickname: nickname,
        major: major,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function createCourse(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const description = formData.get('description') as string;

  const { data, error } = await supabase
    .from('courses')
    .insert([
      { name, type, description, user_id: user.id }
    ])
    .select()
    .single();

  if (error) return { error: error.message };
  
  revalidatePath('/dashboard/courses');
  return { data };
}

export async function deleteCourse(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/courses');
  return { success: true };
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const nickname = formData.get('nickname') as string;
  const major = formData.get('major') as string;
  const university = formData.get('university') as string;
  const aiFeedbackTone = formData.get('aiFeedbackTone') as string;

  // Update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      nickname, 
      major, 
      university, 
      ai_feedback_tone: aiFeedbackTone 
    })
    .eq('id', user.id);

  if (profileError) {
    console.error('Profile update error:', profileError);
    // If profiles table update fails (e.g. missing columns), we still try to update user metadata
  }

  // Update auth metadata for consistency and immediate UI updates
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      nickname,
      major,
      university,
      ai_feedback_tone: aiFeedbackTone
    }
  });

  if (authError) return { error: authError.message };

  revalidatePath('/dashboard', 'layout');
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };
  return { success: true };
}

export async function getCourse(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getNotes(courseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function createNote(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const courseId = formData.get('courseId') as string;
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  const { data, error } = await supabase
    .from('notes')
    .insert([
      { course_id: courseId, user_id: user.id, title, content }
    ])
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/courses/${courseId}`);
  return { data };
}

export async function updateNote(id: string, title: string, content: string, courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('notes')
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/courses/${courseId}`);
  return { data };
}

export async function deleteNote(id: string, courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/courses/${courseId}`);
  return { success: true };
}

export async function getSavedQuestions(courseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('saved_questions')
    .select('*')
    .eq('course_id', courseId)
    .is('session_id', null) // Only legacy/loose questions
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getQuestionSessions(courseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('question_sessions')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };

  // Check for orphan questions (session_id = null)
  const { data: orphans, error: countError } = await supabase
    .from('saved_questions')
    .select('id, question_type')
    .eq('course_id', courseId)
    .is('session_id', null);

  if (!countError && orphans && orphans.length > 0) {
    // Split orphans into separate legacy sessions by type
    const legacySessions: any[] = [];

    const mcqOrphans = orphans.filter((q: any) => q.question_type === 'mcq');
    const flashcardOrphans = orphans.filter((q: any) => q.question_type !== 'mcq');

    if (flashcardOrphans.length > 0) {
      legacySessions.push({
        id: 'legacy-flashcard',
        title: `General Study Set (${flashcardOrphans.length} cards)`,
        type: 'flashcard',
        created_at: new Date().toISOString(),
        is_legacy: true
      });
    }

    if (mcqOrphans.length > 0) {
      legacySessions.push({
        id: 'legacy-mcq',
        title: `General Study Set (${mcqOrphans.length} questions)`,
        type: 'mcq',
        created_at: new Date().toISOString(),
        is_legacy: true
      });
    }

    return { data: [...legacySessions, ...(data || [])] };
  }

  return { data };
}

export async function getSessionQuestions(sessionId: string, courseId: string) {
  const supabase = await createClient();
  
  if (!courseId) return { error: 'courseId is required', data: [] };

  // Handle legacy sessions split by type — ALWAYS filter by course_id
  if (sessionId === 'legacy-flashcard' || sessionId === 'legacy') {
    const { data, error } = await supabase
      .from('saved_questions')
      .select('*')
      .eq('course_id', courseId)
      .is('session_id', null)
      .in('question_type', ['flashcard'])
      .order('created_at', { ascending: true });
    if (error) return { error: error.message };
    return { data };
  }

  if (sessionId === 'legacy-mcq') {
    const { data, error } = await supabase
      .from('saved_questions')
      .select('*')
      .eq('course_id', courseId)
      .is('session_id', null)
      .eq('question_type', 'mcq')
      .order('created_at', { ascending: true });
    if (error) return { error: error.message };
    return { data };
  }

  // Regular sessions — filter by BOTH session_id AND course_id for safety
  const { data, error } = await supabase
    .from('saved_questions')
    .select('*')
    .eq('session_id', sessionId)
    .eq('course_id', courseId)
    .order('created_at', { ascending: true });

  if (error) return { error: error.message };
  return { data };
}

export async function createQuestionSession(courseId: string, title: string, type: 'mcq' | 'flashcard', items: any[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // 1. Create the session
  const { data: session, error: sessionError } = await supabase
    .from('question_sessions')
    .insert([{ 
      course_id: courseId, 
      user_id: user.id, 
      title, 
      type 
    }])
    .select()
    .single();

  if (sessionError) return { error: sessionError.message };

  // 2. Bulk insert the questions
  const questionsToInsert = items.map(item => ({
    course_id: courseId,
    user_id: user.id,
    session_id: session.id,
    question_type: type,
    question_data: item
  }));

  const { error: questionsError } = await supabase
    .from('saved_questions')
    .insert(questionsToInsert);

  if (questionsError) return { error: questionsError.message };

  revalidatePath(`/dashboard/courses/${courseId}`);
  return { success: true, sessionId: session.id };
}

export async function createSavedQuestion(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const courseId = formData.get('courseId') as string;
  const question = formData.get('question') as string;
  const answer = formData.get('answer') as string;

  const { data, error } = await supabase
    .from('saved_questions')
    .insert([
      { 
        course_id: courseId, 
        user_id: user.id, 
        question_type: 'flashcard',
        question_data: { question, answer }
      }
    ])
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/courses/${courseId}`);
  return { data };
}

export async function deleteSavedQuestion(id: string, courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('saved_questions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/courses/${courseId}`);
  return { success: true };
}


export async function saveAnnotation(noteId: string, highlightedText: string, content: string, type: 'ai' | 'manual') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('annotations')
    .insert([
      { 
        note_id: noteId, 
        user_id: user.id, 
        highlighted_text: highlightedText, 
        content, 
        type 
      }
    ])
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getAnnotations(noteId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('annotations')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: true });

  if (error) return { error: error.message };
  return { data };
}

export async function deleteAnnotation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('annotations')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };
  return { success: true };
}
