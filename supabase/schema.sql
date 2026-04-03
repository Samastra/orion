-- Master Schema for StudyBuddy Supabase Database
-- This file serves as the single source of truth for all table definitions.

-- 1. Profiles Table (User Metadata)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  full_name text NULL,
  nickname text NULL,
  major text NULL,
  avatar_url text NULL,
  updated_at timestamp WITH time zone NULL DEFAULT now(),
  university text NULL,
  ai_feedback_tone text NULL DEFAULT 'Encouraging'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  user_id uuid NULL,
  name text NOT NULL,
  type text NOT NULL,
  description text NULL,
  created_at timestamp WITH time zone NULL DEFAULT now(),
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 3. Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  course_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NULL,
  created_at timestamp WITH time zone NULL DEFAULT now(),
  updated_at timestamp WITH time zone NULL DEFAULT now(),
  CONSTRAINT notes_pkey PRIMARY KEY (id),
  CONSTRAINT notes_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 4. Question Sessions Table (Titled batches of questions)
CREATE TABLE IF NOT EXISTS public.question_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  course_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Session',
  type text NOT NULL DEFAULT 'flashcard',
  created_at timestamp WITH time zone NULL DEFAULT now(),
  CONSTRAINT question_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT question_sessions_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT question_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT question_sessions_type_check CHECK (
    (
      type = ANY (ARRAY['mcq'::text, 'flashcard'::text])
    )
  )
) TABLESPACE pg_default;

-- 5. Saved Questions Table (Flashcards & MCQs, linked to sessions)
CREATE TABLE IF NOT EXISTS public.saved_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  course_id uuid NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid NULL,
  question_data jsonb NOT NULL,
  question_type text NULL,
  created_at timestamp WITH time zone NULL DEFAULT now(),
  CONSTRAINT saved_questions_pkey PRIMARY KEY (id),
  CONSTRAINT saved_questions_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT saved_questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT saved_questions_session_id_fkey FOREIGN KEY (session_id) REFERENCES question_sessions (id) ON DELETE CASCADE,
  CONSTRAINT saved_questions_question_type_check CHECK (
    (
      question_type = ANY (ARRAY['mcq'::text, 'flashcard'::text])
    )
  )
) TABLESPACE pg_default;

-- 5. Row Level Security (RLS) Configuration

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_questions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Courses Policies
DROP POLICY IF EXISTS "Users can view own courses" ON courses;
CREATE POLICY "Users can view own courses" ON courses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own courses" ON courses;
CREATE POLICY "Users can create own courses" ON courses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own courses" ON courses;
CREATE POLICY "Users can update own courses" ON courses FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own courses" ON courses;
CREATE POLICY "Users can delete own courses" ON courses FOR DELETE USING (auth.uid() = user_id);

-- Notes Policies
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own notes" ON notes;
CREATE POLICY "Users can manage own notes" ON notes FOR ALL USING (auth.uid() = user_id);

-- Question Sessions Policies
DROP POLICY IF EXISTS "Users can view own sessions" ON question_sessions;
CREATE POLICY "Users can view own sessions" ON question_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own sessions" ON question_sessions;
CREATE POLICY "Users can manage own sessions" ON question_sessions FOR ALL USING (auth.uid() = user_id);

-- Saved Questions Policies
DROP POLICY IF EXISTS "Users can view own questions" ON saved_questions;
CREATE POLICY "Users can view own questions" ON saved_questions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own questions" ON saved_questions;
CREATE POLICY "Users can manage own questions" ON saved_questions FOR ALL USING (auth.uid() = user_id);
