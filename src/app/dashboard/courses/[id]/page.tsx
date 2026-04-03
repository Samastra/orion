'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  getCourse, 
  getNotes, 
  createNote, 
  deleteNote, 
  getSavedQuestions, 
  deleteSavedQuestion, 
  getQuestionSessions, 
  getSessionQuestions 
} from '@/lib/supabase/actions';
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
  Upload,
  ChevronRight,
  Calendar,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
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
  session_id?: string;
  question_data: any;
  question_type: 'mcq' | 'flashcard';
  created_at: string;
}

interface QuestionSession {
  id: string;
  title: string;
  type: 'mcq' | 'flashcard';
  created_at: string;
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [sessions, setSessions] = useState<QuestionSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<QuestionSession | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<SavedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    const [courseRes, notesRes, sessionsRes] = await Promise.all([
      getCourse(id as string),
      getNotes(id as string),
      getQuestionSessions(id as string)
    ]);

    if (!courseRes.error) setCourse(courseRes.data);
    if (!notesRes.error) setNotes(notesRes.data || []);
    if (!sessionsRes.error) setSessions(sessionsRes.data || []);
    setLoading(false);
  };

  const handleSelectSession = async (session: QuestionSession) => {
    setLoadingSession(true);
    const res = await getSessionQuestions(session.id, id as string);
    if (!res.error) {
      setSessionQuestions(res.data || []);
      setSelectedSession(session);
    }
    setLoadingSession(false);
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
      setSessionQuestions(sessionQuestions.filter((q: SavedQuestion) => q.id !== questionId));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { content, type } = await parseDocument(file);
      const textContent = Array.isArray(content) ? content.join('\n\n') : content;

      if (!textContent || textContent.trim().length < 5) {
        alert(`We identified this as a ${type.toUpperCase()} file, but no readable text was found inside. (Note: Scanned images cannot be read yet).`);
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('courseId', id as string);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ""));
      formData.append('content', textContent);

      const result = await createNote(formData);
      if (result.data) {
        setNotes([result.data, ...notes]);
      } else {
        alert("Failed to save the note to the database. Please check your connection.");
      }
    } catch (error: any) {
      console.error('Extraction failed:', error);
      alert(error.message || "An unexpected error occurred while reading the file.");
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
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 mt-1 bg-indigo-500/10 text-indigo-400 border border-white/5">
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
                accept=".pdf,.docx,.pptx,*"
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
              <Card 
                key={note.id} 
                onClick={() => setViewingNote(note)}
                className="bg-white/[0.02] border-white/5 rounded-3xl overflow-hidden hover:border-indigo-500/30 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{note.title}</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-muted-foreground/40">{new Date(note.created_at).toLocaleDateString()}</CardDescription>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="p-2 text-muted-foreground/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground/60 line-clamp-6 leading-relaxed whitespace-pre-wrap">{note.content}</p>
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
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {selectedSession ? (
                  <button onClick={() => setSelectedSession(null)} className="hover:text-indigo-400 transition-colors">Question Bank</button>
                ) : "Question Bank"}
                {selectedSession && <span className="text-muted-foreground/30 flex items-center gap-2 italic font-normal text-lg"><ChevronRight className="w-4 h-4" /> {selectedSession.title}</span>}
              </h2>
            </div>
            {!selectedSession && <AddQuestionModal courseId={id as string} onSuccess={fetchData} />}
            {selectedSession && (
              <Button 
                onClick={() => router.push(`/dashboard/practice?course=${id}`)}
                className="bg-indigo-600/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl h-10 gap-2 font-bold px-5"
              >
                <Target className="w-4 h-4" />
                Practice this Set
              </Button>
            )}
          </div>

          {loadingSession ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : selectedSession ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {sessionQuestions.map((q) => {
                    const isMcq = selectedSession?.type === 'mcq' || q.question_type === 'mcq';

                    if (isMcq) {
                      const d = q.question_data || {};
                      const options: string[] = d.options || [];
                      const correctIdx: number = d.correctIndex ?? -1;

                      return (
                        <motion.div
                          key={q.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4 hover:border-indigo-500/20 transition-all group relative">
                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="absolute top-4 right-4 p-1 text-muted-foreground/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>

                            {/* Type badge */}
                            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
                              MCQ
                            </span>

                            {/* Question */}
                            <p className="text-[14px] font-medium text-foreground/90 leading-relaxed pr-6">
                              {d.question || ''}
                            </p>

                            {/* Options */}
                            <div className="space-y-1.5">
                              {options.map((opt: string, i: number) => (
                                <div
                                  key={i}
                                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] border transition-all ${
                                    i === correctIdx
                                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300 font-medium'
                                      : 'border-white/[0.04] bg-white/[0.01] text-muted-foreground/60'
                                  }`}
                                >
                                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    i === correctIdx
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-white/[0.04] text-muted-foreground/40'
                                  }`}>
                                    {['A', 'B', 'C', 'D'][i]}
                                  </span>
                                  {opt}
                                </div>
                              ))}
                            </div>

                            {/* Explanation */}
                            {d.explanation && (
                              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg px-3 py-2.5">
                                <span className="text-[9px] font-semibold text-indigo-400/50 uppercase tracking-widest">Explanation</span>
                                <p className="text-[11px] text-foreground/60 leading-relaxed mt-0.5">{d.explanation}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    }

                    // Flashcard rendering
                    return (
                      <motion.div
                        key={q.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <FlashCard
                          card={{
                            id: q.id,
                            front: q.question_data?.question || q.question_data?.front || '',
                            back: q.question_data?.answer || q.question_data?.back || '',
                            category: q.question_data?.category || selectedSession?.title || 'Study'
                          }}
                          onDelete={handleDeleteQuestion}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
             </div>
          ) : sessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <Card 
                  key={session.id} 
                  onClick={() => handleSelectSession(session)}
                  className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all cursor-pointer group relative overflow-hidden"
                >
                   <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                         <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                           {session.type === 'mcq' ? 'Multiple Choice' : 'Flashcard Set'}
                         </div>
                         <Calendar className="w-3.5 h-3.5 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-foreground/90 group-hover:text-indigo-400 transition-colors leading-tight">{session.title || "Untitled Session"}</h3>
                        <p className="text-[12px] text-muted-foreground/50">{new Date(session.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-1 text-indigo-400/60 font-bold text-[11px] uppercase tracking-widest pt-2 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                         View Questions <ChevronRight className="w-3 h-3" />
                      </div>
                   </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white/[0.01] border border-dashed border-white/5 rounded-3xl py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Empty Bank</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">Click "Add Question" or generate quizzes in Practice Mode to build your study library.</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Note Viewer Modal */}
      <Dialog open={!!viewingNote} onOpenChange={(open) => !open && setViewingNote(null)}>
        <DialogContent className="sm:max-w-4xl bg-[#0a0a0b] border-white/10 p-0 overflow-hidden shadow-2xl rounded-3xl">
          <div className="flex flex-col h-[85vh]">
            <DialogHeader className="px-8 py-5 border-b border-white/5 bg-white/[0.01] shrink-0">
              <div className="flex items-center justify-between mx-auto w-full">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Study Note</span>
                       <span className="text-[10px] font-semibold text-muted-foreground/30 uppercase tracking-widest">• Last updated {viewingNote ? new Date(viewingNote.created_at).toLocaleDateString() : ''}</span>
                    </div>
                    <DialogTitle className="text-xl font-bold uppercase tracking-tight text-white line-clamp-1">
                      {viewingNote?.title}
                    </DialogTitle>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingNote(null)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground/40 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-8 py-10 custom-scrollbar">
              <div className="max-w-3xl mx-auto">
                <div className="prose prose-invert max-w-none">
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-[18px] font-medium selection:bg-indigo-500/30">
                    {viewingNote?.content}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-8 py-4 border-t border-white/5 bg-white/[0.01] flex justify-end shrink-0">
              <div className="mx-auto w-full flex justify-end">
                <Button 
                  onClick={() => setViewingNote(null)}
                  className="bg-white/5 hover:bg-white/10 text-white rounded-xl h-10 px-8 text-sm font-bold border border-white/10 transition-all"
                >
                  Close Reader
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
