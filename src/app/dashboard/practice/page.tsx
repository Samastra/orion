'use client';

import React, { useState, useEffect } from 'react';
import { PracticeView } from '@/components/practice/PracticeView';
import { 
  Target, 
  ChevronRight, 
  Search,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  Loader2,
  BookPlus,
  BookOpen,
  ArrowRight,
  Save,
  Shuffle,
  FileText,
  Crosshair,
  ArrowLeft
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/components/auth/UserAvatar';
import { getNotes } from '@/lib/supabase/actions';
import Link from 'next/link';

interface CourseNode {
  id: string;
  name: string;
  type: string;
  description: string;
}

interface NoteNode {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

type ScopeStep = 'courses' | 'scope' | 'practice';

export default function PracticePage() {
  const { user } = useUser();
  const [courses, setCourses] = useState<CourseNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<CourseNode | null>(null);
  const [courseContext, setCourseContext] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isContextLoading, setIsContextLoading] = useState(false);

  // Scope selection state
  const [scopeStep, setScopeStep] = useState<ScopeStep>('courses');
  const [courseNotes, setCourseNotes] = useState<NoteNode[]>([]);
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteNode | null>(null);
  const [topicFocus, setTopicFocus] = useState('');
  const [noteMode, setNoteMode] = useState<'all' | 'topic' | null>(null);
  const [initialPracticeType, setInitialPracticeType] = useState<string | undefined>(undefined);

  // Save questions state
  const [generatedQuestions, setGeneratedQuestions] = useState<any[] | null>(null);
  const [generatedType, setGeneratedType] = useState<'mcq' | 'flashcard' | 'saved'>('mcq');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCourses(data);
      }
      setIsLoading(false);
    };

    fetchCourses();
  }, [user]);

  // Step 1: User picks a course → fetch its notes → go to scope step
  const handleSelectCourse = async (course: CourseNode) => {
    setSelectedCourse(course);
    setIsNotesLoading(true);
    setScopeStep('scope');

    const { data: notes, error } = await getNotes(course.id);
    setCourseNotes(notes && !error ? notes : []);
    setIsNotesLoading(false);
  };

  // Step 2a: User picks "Random" → load all notes as context
  const handleRandomScope = async () => {
    if (!selectedCourse) return;
    setIsContextLoading(true);
    setScopeStep('practice');

    let fullContext = selectedCourse.description || '';
    if (courseNotes.length > 0) {
      const notesContent = courseNotes
        .map(n => `--- ${n.title} ---\n${n.content}`)
        .join('\n\n');
      fullContext = `${fullContext}\n\n${notesContent}`.trim();
    }
    setCourseContext(fullContext || null);
    setIsContextLoading(false);
  };

  // Step 2c: User picks "Saved Sessions"
  const handleSavedScope = () => {
    if (!selectedCourse) return;
    setInitialPracticeType('saved');
    setCourseContext(null);
    setScopeStep('practice');
  };

  // Step 2b: User picks a specific note
  const handleSelectNote = (note: NoteNode) => {
    setSelectedNote(note);
    setNoteMode(null); // Reset sub-choice
    setTopicFocus('');
  };

  // Step 2b-i: "Study All" on a specific note
  const handleStudyAll = () => {
    if (!selectedNote) return;
    setCourseContext(selectedNote.content);
    setTopicFocus('');
    setScopeStep('practice');
  };

  // Step 2b-ii: "Focus on Topic" → user enters topic → go
  const handleFocusOnTopic = () => {
    if (!selectedNote || !topicFocus.trim()) return;
    setCourseContext(selectedNote.content);
    setScopeStep('practice');
  };

  // Save all generated questions
  const handleQuestionsGenerated = (questions: any[], type: 'mcq' | 'flashcard' | 'saved') => {
    setGeneratedQuestions(questions);
    setGeneratedType(type);
    setIsSaved(false);
  };

  const saveAllToCourse = async () => {
    if (!selectedCourse || !generatedQuestions?.length) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/saved-questions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          questions: generatedQuestions,
          type: generatedType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setIsSaved(true);
    } catch (err: any) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset everything back to course selection
  const resetToStart = () => {
    setSelectedCourse(null);
    setCourseContext(null);
    setCourseNotes([]);
    setSelectedNote(null);
    setTopicFocus('');
    setNoteMode(null);
    setScopeStep('courses');
    setGeneratedQuestions(null);
    setIsSaved(false);
    setInitialPracticeType(undefined);
  };

  // Go back to scope selection from practice
  const backToScope = () => {
    setCourseContext(null);
    setSelectedNote(null);
    setTopicFocus('');
    setNoteMode(null);
    setScopeStep('scope');
    setGeneratedQuestions(null);
    setIsSaved(false);
  };

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─────────────────────────────────────────────
  // STEP 3: Practice View (questions generated)
  // ─────────────────────────────────────────────
  if (scopeStep === 'practice' && selectedCourse) {
    return (
      <div className="flex flex-col h-[calc(100vh-60px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 px-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={backToScope}
              className="h-9 px-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground text-[12px] font-medium transition-all"
            >
              ← Back
            </Button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight">{selectedCourse.name}</h1>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
                {selectedNote ? selectedNote.title : selectedCourse.type}
                {topicFocus && ` · ${topicFocus}`}
              </p>
            </div>
          </div>

          {/* Save button */}
          {generatedQuestions && generatedQuestions.length > 0 && (
            <Button
              onClick={saveAllToCourse}
              disabled={isSaving || isSaved}
              className={`h-9 px-4 rounded-xl text-[12px] font-bold gap-2 transition-all ${
                isSaved 
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 cursor-default'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isSaved ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {isSaving ? 'Saving...' : isSaved ? 'Saved to Course' : 'Save All to Course'}
            </Button>
          )}
        </div>

        {/* Practice View */}
        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
          {isContextLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Gathering study materials...</p>
            </div>
          ) : (
            <PracticeView 
              context={courseContext} 
              courseId={selectedCourse.id}
              noteId={selectedNote?.id}
              topicFocus={topicFocus || undefined}
              onQuestionsGenerated={handleQuestionsGenerated}
              initialType={initialPracticeType as any}
            />
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // STEP 2: Scope Selection (Random / Note / Topic)
  // ─────────────────────────────────────────────
  if (scopeStep === 'scope' && selectedCourse) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={resetToStart}
            className="h-9 px-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground text-[12px] font-medium transition-all"
          >
            ← Back to Arena
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">{selectedCourse.name}</h1>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">{selectedCourse.type} · Choose what to practice</p>
          </div>
        </div>

        {isNotesLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            <p className="text-sm font-medium tracking-wide uppercase">Loading notes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Random Card */}
            <div
              onClick={handleRandomScope}
              className="group relative cursor-pointer bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Shuffle className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground/90 group-hover:text-indigo-400 transition-colors">Random — All Notes</h3>
                  <p className="text-[12px] text-muted-foreground/50 leading-relaxed">
                    Generate questions from all {courseNotes.length} note{courseNotes.length !== 1 ? 's' : ''}. Best for comprehensive review.
                  </p>
                </div>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-500 group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Saved Sessions Card */}
            <div
              onClick={handleSavedScope}
              className="group relative cursor-pointer bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] hover:border-emerald-500/30 transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground/90 group-hover:text-emerald-400 transition-colors">Saved Study Sets</h3>
                  <p className="text-[12px] text-muted-foreground/50 leading-relaxed">
                    Re-practice your previously generated and titled question batches. Organized and focused review.
                  </p>
                </div>
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-emerald-600 group-hover:border-emerald-500 group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Individual Note Cards */}
            {courseNotes.map((note) => {
              const isSelected = selectedNote?.id === note.id;

              return (
                <div
                  key={note.id}
                  className={`group relative bg-white/[0.02] border rounded-3xl p-6 transition-all duration-300 ${
                    isSelected 
                      ? 'border-indigo-500/40 bg-indigo-500/[0.04]'
                      : 'border-white/5 hover:bg-white/[0.04] hover:border-white/10 cursor-pointer'
                  }`}
                >
                  {/* Note header — always clickable */}
                  <div 
                    onClick={() => handleSelectNote(note)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-all ${
                        isSelected 
                          ? 'bg-indigo-500/15 border-indigo-500/25'
                          : 'bg-white/[0.03] border-white/[0.06]'
                      }`}>
                        <FileText className={`w-5 h-5 ${isSelected ? 'text-indigo-400' : 'text-muted-foreground/40'}`} />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <h3 className={`text-[15px] font-bold truncate transition-colors ${
                          isSelected ? 'text-indigo-400' : 'text-foreground/90 group-hover:text-foreground'
                        }`}>
                          {note.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground/40">
                          {note.content?.length > 80 ? note.content.slice(0, 80) + '...' : note.content || 'Empty note'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sub-choices — shown when this note is selected */}
                  {isSelected && (
                    <div className="mt-5 pt-5 border-t border-white/[0.06] space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Study All */}
                      <button
                        onClick={handleStudyAll}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-indigo-500/10 hover:border-indigo-500/20 transition-all text-left cursor-pointer group/btn"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover/btn:bg-indigo-500/15 group-hover/btn:border-indigo-500/20 transition-all">
                          <FileText className="w-4 h-4 text-muted-foreground/50 group-hover/btn:text-indigo-400 transition-colors" />
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-foreground/80 group-hover/btn:text-indigo-400 transition-colors">Study All</div>
                          <div className="text-[10px] text-muted-foreground/40">Practice from the entire note</div>
                        </div>
                      </button>

                      {/* Focus on Topic */}
                      <div className="space-y-2">
                        <button
                          onClick={() => setNoteMode(noteMode === 'topic' ? null : 'topic')}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left cursor-pointer group/btn ${
                            noteMode === 'topic'
                              ? 'border-indigo-500/25 bg-indigo-500/[0.06]'
                              : 'border-white/[0.06] bg-white/[0.02] hover:bg-indigo-500/10 hover:border-indigo-500/20'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                            noteMode === 'topic'
                              ? 'bg-indigo-500/15 border-indigo-500/20'
                              : 'bg-white/[0.04] border-white/[0.06] group-hover/btn:bg-indigo-500/15 group-hover/btn:border-indigo-500/20'
                          }`}>
                            <Crosshair className={`w-4 h-4 transition-colors ${
                              noteMode === 'topic' ? 'text-indigo-400' : 'text-muted-foreground/50 group-hover/btn:text-indigo-400'
                            }`} />
                          </div>
                          <div>
                            <div className={`text-[13px] font-semibold transition-colors ${
                              noteMode === 'topic' ? 'text-indigo-400' : 'text-foreground/80 group-hover/btn:text-indigo-400'
                            }`}>Focus on a Topic</div>
                            <div className="text-[10px] text-muted-foreground/40">Narrow down to a specific concept</div>
                          </div>
                        </button>

                        {/* Topic input — shown when "Focus on Topic" is selected */}
                        {noteMode === 'topic' && (
                          <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <input
                              value={topicFocus}
                              onChange={(e) => setTopicFocus(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleFocusOnTopic(); }}
                              placeholder="e.g. nucleic acids and properties"
                              autoFocus
                              className="flex-1 h-10 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/30 transition-all placeholder:text-muted-foreground/30"
                            />
                            <Button
                              onClick={handleFocusOnTopic}
                              disabled={!topicFocus.trim()}
                              className="h-10 px-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-30 disabled:bg-white/5 text-[12px] font-bold gap-1.5"
                            >
                              Go <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty state if no notes */}
            {courseNotes.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 px-6 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-3xl gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <FileText className="w-7 h-7 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold">No notes yet</h3>
                  <p className="text-[12px] text-muted-foreground/50 max-w-xs">Add notes to this course first, or use "Random" to practice from the course description.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // STEP 1: Course Selection Grid (default)
  // ─────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Practice Arena</h1>
        <p className="text-muted-foreground text-base">Select a course to test your knowledge with MCQs and Flashcards.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-sm font-medium tracking-wide uppercase">Scanning your courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[40px] gap-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <BookPlus className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="text-xl font-bold tracking-tight">No Courses Found</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">You haven&apos;t added any courses yet. Add your first course to start generating AI-powered practice sessions.</p>
          </div>
          <Link href="/dashboard/courses">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2 px-6 h-11 font-bold shadow-lg shadow-indigo-500/20">
              Go to Courses <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-3 rounded-2xl shadow-sm">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
              <input 
                placeholder="Filter by course name or subject..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 bg-white/5 border border-white/5 focus:border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 rounded-xl h-10 text-[13px] transition-all"
              />
            </div>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 h-10">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setViewMode('grid')}
                className={`h-8 w-8 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600/20 text-indigo-400' : 'text-muted-foreground/30 hover:text-foreground'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setViewMode('list')}
                className={`h-8 w-8 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600/20 text-indigo-400' : 'text-muted-foreground/30 hover:text-foreground'}`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Course Grid */}
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredCourses.map((course) => (
              <div 
                key={course.id}
                onClick={() => handleSelectCourse(course)}
                className={`
                  group relative cursor-pointer
                  ${viewMode === 'grid' 
                    ? "bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all duration-300" 
                    : "flex items-center gap-6 bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all duration-300"}
                `}
              >
                <div className={viewMode === 'grid' ? "space-y-5" : "flex-1 flex items-center justify-between"}>
                  <div className="space-y-3 flex-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/10">
                      {course.type}
                    </span>
                    <h3 className="text-[18px] font-bold tracking-tight text-foreground/90 group-hover:text-indigo-400 transition-colors">
                      {course.name}
                    </h3>
                    {viewMode === 'grid' && (
                      <p className="text-[12px] text-muted-foreground/40 leading-relaxed line-clamp-2 italic">
                        {course.description || "No description provided."}
                      </p>
                    )}
                  </div>

                  <div className={viewMode === 'grid' ? "pt-4 flex items-center justify-between border-t border-white/[0.04]" : "flex items-center gap-8"}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground/40 font-semibold uppercase tracking-tighter">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px]">--% Avg</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground/40 font-semibold uppercase tracking-tighter">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Fresh Start</span>
                      </div>
                    </div>
                    {viewMode === 'grid' ? (
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-500 group-hover:text-white transition-all shadow-lg group-hover:shadow-indigo-500/40">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    ) : (
                      <Button variant="ghost" className="rounded-xl border border-white/5 bg-white/5 hover:bg-indigo-600 hover:text-white gap-2 text-[12px] font-bold transition-all">
                        Begin <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
