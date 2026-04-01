'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  BookOpen,
  ArrowLeft,
  Plus,
  Trash2,
  Target,
  FileText,
  Save,
  Loader2,
  MoreVertical,
  MessageSquare,
  GraduationCap,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCourse, getNotes, createNote, deleteNote, getSavedQuestions, deleteSavedQuestion } from '@/lib/supabase/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { parseDocument } from '@/lib/document-parser';
import { AddQuestionModal } from '@/components/practice/AddQuestionModal';
import { FlashCard } from '@/components/practice/FlashCard';

interface Course {
  id: string;
  name: string;
  type: string;
  description: string;
  created_at: string;
}

interface Note {
  id: string;
  course_id: string;
  title: string;
  content: string;
  created_at: string;
}

interface SavedQuestion {
  id: string;
  course_id: string;
  question_data: any;
  question_type: 'mcq' | 'flashcard';
  created_at: string;
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [questions, setQuestions] = useState<SavedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    const [courseRes, notesRes, questionsRes] = await Promise.all([
      getCourse(id as string),
      getNotes(id as string),
      getSavedQuestions(id as string)
    ]);

    if (!courseRes.error) setCourse(courseRes.data);
    if (!notesRes.error) setNotes(notesRes.data || []);
    if (!questionsRes.error) setQuestions(questionsRes.data || []);
    setLoading(false);
  };

  const handleAddNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingNote(true);
    const formData = new FormData(e.currentTarget);
    formData.append('courseId', id as string);

    const result = await createNote(formData);
    if (result.data) {
      setNotes([result.data, ...notes]);
      setIsCreatingNote(false);
    }
    setIsSubmittingNote(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    const result = await deleteNote(noteId, id as string);
    if (result.success) {
      setNotes(notes.filter((n: Note) => n.id !== noteId));
    }
  };

  const handleDeleteQuestion = async (questionId: string | number) => {
    const result = await deleteSavedQuestion(questionId.toString(), id as string);
    if (result.success) {
      setQuestions(questions.filter((q: SavedQuestion) => q.id !== questionId));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { content } = await parseDocument(file);
      const textContent = Array.isArray(content) ? content.join('\n\n') : content;

      const formData = new FormData();
      formData.append('courseId', id as string);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ""));
      formData.append('content', textContent);

      const result = await createNote(formData);
      if (result.data) {
        setNotes([result.data, ...notes]);
      }
    } catch (error) {
      console.error('Extraction failed:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
        <Loader2 className="w-14 h-14 animate-spin text-indigo-500/80" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Course not found</h2>
        <Button variant="link" onClick={() => router.push('/dashboard/courses')}>
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Breadcrumb / Back */}
      <button
        onClick={() => router.push('/dashboard/courses')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Courses</span>
      </button>

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 mt-1 ${course.type === 'Pharmacy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'} border border-white/5`}>
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-bold tracking-tight leading-none uppercase">{course.name}</h1>
          </div>
        </div>

        <Button
          size="lg"
          onClick={() => router.push(`/dashboard/practice?course=${id}`)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11 px-8 font-bold gap-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 transition-all hover:translate-y-[-2px] active:translate-y-[0px] mt-1 text-base"
        >
          <Target className="w-5 h-5" />
          Practice Subject
        </Button>
      </div>

      <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">
        {course.description || "Organize your study resources, review extracted notes, and master this subject through targeted practice."}
      </p>

      <Tabs defaultValue="notes" className="space-y-8 pt-4">
        <TabsList className="bg-zinc-950 border border-white/5 p-1 rounded-xl h-11 flex items-center w-fit gap-1 shadow-inner">
          <TabsTrigger value="notes" className="rounded-lg px-8 data-[state=active]:bg-zinc-800 data-[state=active]:border-white/10 data-[state=active]:text-white text-zinc-400 font-bold h-full transition-all text-sm gap-2 border border-transparent shadow-sm">
            Study Notes
          </TabsTrigger>
          <TabsTrigger value="questions" className="rounded-lg px-8 data-[state=active]:bg-zinc-800 data-[state=active]:border-white/10 data-[state=active]:text-white text-zinc-400 font-bold h-full transition-all text-sm gap-2 border border-transparent shadow-sm">
            Saved Questions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-6 outline-none">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Personal Notes</h2>
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.docx,.pptx"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-white/5 hover:bg-white/10 text-white rounded-xl h-11 px-5 font-bold gap-2 border border-white/10 text-sm"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload Doc
              </Button>
              <Button
                onClick={() => setIsCreatingNote(true)}
                className="bg-white/5 hover:bg-white/10 text-white rounded-xl h-11 px-5 font-bold gap-2 border border-white/10 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {isCreatingNote && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="bg-indigo-600/5 border-indigo-500/20 rounded-3xl overflow-hidden h-full flex flex-col border-dashed border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">New Note</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4">
                      <form onSubmit={handleAddNote} className="space-y-4 flex-1 flex flex-col">
                        <input
                          name="title"
                          required
                          placeholder="Note Title"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 h-11 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <textarea
                          name="content"
                          required
                          placeholder="Your study notes..."
                          className="w-full flex-1 bg-white/[0.03] border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none min-h-[150px]"
                        />
                        <div className="flex gap-2 pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsCreatingNote(false)}
                            className="flex-1 rounded-xl h-11 font-bold"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={isSubmittingNote}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11 font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                          >
                            {isSubmittingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save</>}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {notes.map((note) => (
              <Card key={note.id} className="bg-white/[0.02] border-white/5 rounded-3xl overflow-hidden hover:border-indigo-500/30 transition-all group h-full flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg group-hover:text-indigo-400 transition-colors">{note.title}</CardTitle>
                    <CardDescription>{new Date(note.created_at).toLocaleDateString()}</CardDescription>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-2 text-muted-foreground/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-6 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                </CardContent>
              </Card>
            ))}

            {!isCreatingNote && notes.length === 0 && (
              <div className="col-span-full py-20 bg-white/[0.01] border border-dashed border-white/5 rounded-3xl text-center space-y-4">
                <div className="w-12 h-12 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">No notes yet</h3>
                  <p className="text-sm text-muted-foreground">Start by creating your first study note for this course.</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6 outline-none">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Question Bank</h2>
            <AddQuestionModal courseId={id as string} onSuccess={fetchData} />
          </div>

          {questions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {questions.map((q) => (
                  <motion.div
                    key={q.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FlashCard
                      card={{
                        id: q.id,
                        front: q.question_data.question,
                        back: q.question_data.answer,
                        category: course?.name || 'Study'
                      }}
                      onDelete={handleDeleteQuestion}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white/[0.01] border border-dashed border-white/5 rounded-3xl py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Empty Bank</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">Click "Add Question" to start building your flashcard set for active recall.</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
