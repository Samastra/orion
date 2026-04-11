import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListChecks, Layers, ArrowRight, Loader2, AlertCircle, BookOpen, Calendar, ChevronRight as ChevronRightIcon, Settings2, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MCQSession } from './MCQSession';
import { FlashcardSession } from './FlashcardSession';
import type { MCQQuestion } from './MCQCard';
import type { FlashcardData } from './FlashCard';
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getQuestionSessions, getSessionQuestions } from '@/lib/supabase/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type PracticeType = 'mcq' | 'flashcard' | 'saved';
type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Exam-style';

interface PracticeConfig {
  count: number;
  difficulty: Difficulty;
}

interface PracticeViewProps {
  context: string | string[] | null;
  courseId?: string;
  noteId?: string;
  topicFocus?: string;
  initialType?: PracticeType;
  autoGenerate?: boolean;
  onQuestionsGenerated?: (questions: any[], type: PracticeType) => void;
}

export function PracticeView({ context, courseId, noteId, topicFocus, initialType, autoGenerate, onQuestionsGenerated }: PracticeViewProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [practiceType, setPracticeType] = useState<PracticeType>(initialType || 'mcq');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[] | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardData[] | null>(null);
  const [suggestedTitle, setSuggestedTitle] = useState<string>('');
  
  // Practice configuration state
  const [config, setConfig] = useState<PracticeConfig>({
    count: 20,
    difficulty: 'Medium'
  });

  // Auto-generate if requested
  useEffect(() => {
    if (autoGenerate && context && !mcqQuestions && !flashcards && !isGenerating) {
      generate();
    }
  }, [autoGenerate, context]);

  // Modal open state
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const hasActiveSession = practiceType === 'mcq' ? mcqQuestions !== null : flashcards !== null;

  const generate = async (forceReindex: boolean = false) => {
    if (isGenerating) return;
    // Need at least noteId or courseId to retrieve from DB
    if (!noteId && !courseId && !context) return;
    setIsGenerating(true);
    setError(null);

    try {
      // 1. Ensure document is indexed before generating
      if (noteId || courseId) {
        setIsIndexing(true);
        try {
          // If we have raw context (from file upload), send it for indexing
          const docText = context
            ? (Array.isArray(context) ? context.join('\n\n') : context)
            : null;

          if (docText) {
            const indexRes = await fetch('/api/practice/index', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                content: docText,
                courseId,
                noteId,
                force: forceReindex 
              }),
            });
            const indexData = await indexRes.json();
            if (!indexRes.ok) console.warn("Indexing failed:", indexData.error);
          }
        } catch (e) {
          console.warn("Indexing step failed:", e);
        } finally {
          setIsIndexing(false);
        }
      }

      // 2. Generate questions — server retrieves chunks from DB
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: practiceType, 
          topicFocus,
          count: config.count,
          difficulty: config.difficulty,
          courseId,
          noteId 
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setSuggestedTitle(data.title || '');

      if (practiceType === 'mcq') {
        setMcqQuestions(data.items);
        setFlashcards(null);
        onQuestionsGenerated?.(data.items, 'mcq');
      } else {
        setFlashcards(data.items);
        setMcqQuestions(null);
        onQuestionsGenerated?.(data.items, 'flashcard');
      }
    } catch (err: any) {
      console.error('Generation failed:', err);
      // More descriptive error for JSON parsing failures
      if (err instanceof SyntaxError || err.message?.includes('invalid format')) {
        setError('The AI return an invalid format. Please try again with a slightly different difficulty or count.');
      } else {
        setError(err.message || 'Failed to generate. Try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setMcqQuestions(null);
    setFlashcards(null);
    setError(null);
  };

  const renderCurrentView = () => {
    // Active session view
    if (mcqQuestions && practiceType === 'mcq') {
      return (
        <div className="h-full flex flex-col">
          <PracticeTabs 
            type={practiceType} 
            setType={(t) => { setPracticeType(t); reset(); }} 
            config={config}
            onConfigChange={setConfig}
            isOpen={isConfigOpen}
            setIsOpen={setIsConfigOpen}
            onGenerate={generate}
          />
          <div className="flex-1 min-h-0">
            <MCQSession 
              questions={mcqQuestions} 
              onReset={generate} 
              courseId={courseId} 
              suggestedTitle={suggestedTitle}
            />
          </div>
        </div>
      );
    }

    if (flashcards && practiceType === 'flashcard') {
      return (
        <div className="h-full flex flex-col">
          <PracticeTabs 
            type={practiceType} 
            setType={(t) => { setPracticeType(t); reset(); }} 
            config={config}
            onConfigChange={setConfig}
            isOpen={isConfigOpen}
            setIsOpen={setIsConfigOpen}
            onGenerate={generate}
          />
          <div className="flex-1 min-h-0">
            <FlashcardSession 
              cards={flashcards} 
              onReset={generate} 
              courseId={courseId}
              suggestedTitle={suggestedTitle}
            />
          </div>
        </div>
      );
    }

    // Saved session view
    if (practiceType === 'saved') {
      return (
        <div className="h-full flex flex-col">
          <PracticeTabs 
            type={practiceType} 
            setType={(t) => { setPracticeType(t); reset(); }} 
            config={config}
            onConfigChange={setConfig}
            isOpen={isConfigOpen}
            setIsOpen={setIsConfigOpen}
            onGenerate={generate}
          />
          <div className="flex-1 min-h-0">
            <SavedSessionsBrowser 
               courseId={courseId} 
               onSelectSession={(session, questions) => {
                 setSuggestedTitle(session.title);
                 if (session.type === 'mcq') {
                   const validMcqs = questions
                     .map((q: any) => q.question_data)
                     .filter((d: any) => d && d.options && Array.isArray(d.options) && d.correctIndex !== undefined);
                   
                   if (validMcqs.length > 0) {
                     setMcqQuestions(validMcqs);
                     setPracticeType('mcq');
                   }
                 } else {
                   const normalized = questions.map((q: any, i: number) => {
                     const d = q.question_data || {};
                     return {
                       id: d.id || q.id || i + 1,
                       front: d.front || d.question || '',
                       back: d.back || d.answer || '',
                       category: d.category || 'Study'
                     };
                   });
                   setFlashcards(normalized);
                   setPracticeType('flashcard');
                 }
               }}
            />
          </div>
        </div>
      );
    }

    // Default: empty state / generate prompt
    return (
      <div className="h-full flex flex-col">
        <PracticeTabs 
          type={practiceType} 
          setType={setPracticeType} 
          config={config}
          onConfigChange={setConfig}
          isOpen={isConfigOpen}
          setIsOpen={setIsConfigOpen}
          onGenerate={generate}
        />

        <div className="flex-1 flex items-center justify-center p-6 relative">
          <div className="text-center space-y-8 max-w-sm relative z-10 w-full">
            {isGenerating ? (
              <div className="space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto relative shadow-2xl shadow-indigo-500/10 active:scale-95 transition-transform">
                  <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                  {isIndexing && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-indigo-500 rounded-xl border-4 border-[#0D0D12] flex items-center justify-center shadow-lg">
                      <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {isIndexing ? 'Indexing Knowledge' : `Generating ${practiceType === 'mcq' ? 'Questions' : 'Flashcards'}...`}
                  </h3>
                  <p className="text-[13px] text-muted-foreground/50 px-8">
                    {isIndexing ? 'Digitizing sections for semantic retrieval...' : 'Analyzing your high-yield facts for precision testing.'}
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="space-y-6 p-8 rounded-3xl bg-rose-500/5 border border-rose-500/10 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-rose-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-md font-bold text-rose-400">Generation Interrupted</h3>
                  <p className="text-[12px] text-muted-foreground/60 leading-relaxed">{error}</p>
                </div>
                    {error.includes('No indexed content') ? (
                      <div className="flex flex-col gap-2 w-full">
                        <Button 
                          onClick={() => generate(true)} 
                          className="w-full bg-indigo-600 hover:bg-indigo-400 text-white rounded-xl gap-2 h-10 text-[13px] font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700 transition-all hover:translate-y-[-1px]"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Fix & Re-sync Knowledge
                        </Button>
                        <Button 
                          onClick={() => generate()} 
                          variant="ghost"
                          className="w-full h-10 rounded-xl text-muted-foreground/60 text-[12px] hover:text-rose-400 transition-colors"
                        >
                          Just Try Again
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => generate()} 
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-xl gap-2 h-10 text-[13px] font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-rose-700/50 transition-all hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-none"
                      >
                        Try Again
                      </Button>
                    )}
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto shadow-2xl">
                  {practiceType === 'mcq'
                    ? <ListChecks className="w-10 h-10 text-muted-foreground/20" />
                    : <Layers className="w-10 h-10 text-muted-foreground/20" />
                  }
                </div>
                <div className="space-y-2">
                  <h3 className="text-[15px] font-bold text-white tracking-tight">
                    {practiceType === 'mcq' ? 'MCQ Rush' : 'Flashcard Rush'}
                  </h3>
                  <p className="text-[13px] text-muted-foreground/40 leading-relaxed px-4">
                    { (context || noteId || courseId)
                      ? (practiceType === 'mcq' ? 'Rapid-fire precision testing.' : 'Master concepts in seconds.')
                      : 'Awaiting your academic material to begin session.'
                    }
                  </p>
                </div>
                {(context || noteId || courseId) && (
                  <div className="px-4">
                    <Button 
                      onClick={() => generate()} 
                      className="h-10 px-6 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 transition-all hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-none group"
                    >
                      Start {practiceType === 'mcq' ? 'MCQs' : 'Flashcards'}
                      <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-[#0A0A0B]">
      <ResponsiveConfig 
        isDesktop={isDesktop}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onConfigChange={setConfig}
        onGenerate={generate}
      />
      {renderCurrentView()}
    </div>
  );
}

// Sub-component: Practice type tabs
function PracticeTabs({ 
  type, 
  setType, 
  config,
  onConfigChange,
  isOpen,
  setIsOpen,
  onGenerate
}: { 
  type: PracticeType; 
  setType: (t: PracticeType) => void; 
  showSaved?: () => void;
  config: PracticeConfig;
  onConfigChange: (c: PracticeConfig) => void;
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-[#0A0A0B]/50 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.05]">
        <button
          onClick={() => setType('mcq')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            type === 'mcq'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          MCQs
        </button>
        <button
          onClick={() => setType('flashcard')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            type === 'flashcard'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Flashcards
        </button>
        <button
          onClick={() => setType('saved')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            type === 'saved'
              ? 'bg-white/10 text-white border border-white/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Saved
        </button>
      </div>

      <button 
        onClick={() => setIsOpen(true)}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.08] text-muted-foreground/60 hover:text-foreground transition-all active:scale-90"
      >
        <Settings2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// Sub-component: Responsive Configuration Manager
function ResponsiveConfig({
  isDesktop,
  isOpen,
  onClose,
  config,
  onConfigChange,
  onGenerate
}: {
  isDesktop: boolean;
  isOpen: boolean;
  onClose: () => void;
  config: PracticeConfig;
  onConfigChange: (c: PracticeConfig) => void;
  onGenerate: () => void;
}) {
  const content = (
    <div className="space-y-8">
      {!isDesktop && (
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white tracking-tight">Practice Config</h3>
          <p className="text-[12px] text-muted-foreground/40 font-medium">Fine-tune the AI lecturer's question generation</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Question Count</Label>
            <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">{config.count} items</span>
          </div>
          <div className="flex gap-2">
            {[10, 20, 40, 60].map((num) => (
              <button
                key={num}
                onClick={() => onConfigChange({ ...config, count: num })}
                className={`flex-1 py-3 lg:py-2 rounded-xl text-[12px] font-bold border transition-all active:scale-95 ${
                  config.count === num
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-muted-foreground/60 hover:bg-white/[0.05]'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Difficulty Level</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['Easy', 'Medium', 'Hard', 'Exam-style'] as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => onConfigChange({ ...config, difficulty: level })}
                className={`w-full py-3 lg:py-2 rounded-xl text-[12px] font-bold border transition-all active:scale-95 ${
                  config.difficulty === level
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-muted-foreground/60 hover:bg-white/[0.05]'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/30 italic leading-relaxed px-1">
            {config.difficulty === 'Easy' && "Focuses on core definitions and primary concepts."}
            {config.difficulty === 'Medium' && "A balanced mix of concepts and applied scenarios."}
            {config.difficulty === 'Hard' && "Targets intricate details and complex reasoning."}
            {config.difficulty === 'Exam-style' && "Strictly simulates high-stakes board examination formats."}
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Button 
            onClick={() => { onGenerate(); onClose(); }}
            className="w-full h-14 lg:h-11 rounded-2xl lg:rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-bold text-[15px] lg:text-[13px] active:scale-[0.98] transition-all"
          >
            Apply Settings
          </Button>
          {!isDesktop && (
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="w-full h-12 rounded-xl text-muted-foreground/40 font-semibold text-[13px] hover:text-foreground"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-[#0D0D12] border-white/[0.08] shadow-2xl p-8 rounded-3xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-white tracking-tight">Practice Config</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div 
          key="config-overlay"
          initial="closed"
          animate="open"
          exit="closed"
          className="fixed inset-0 z-[100] flex flex-col justify-end"
        >
          {/* Backdrop */}
          <motion.div
            variants={{
              open: { opacity: 1 },
              closed: { opacity: 0 }
            }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          {/* Sheet */}
          <motion.div
            variants={{
              open: { y: 0 },
              closed: { y: '100%' }
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-[#0D0D12] border-t border-white/[0.08] rounded-t-[32px] p-6 pb-12 shadow-2xl overflow-hidden"
          >
            <div className="flex justify-center mb-6">
              <div className="w-12 h-1.5 rounded-full bg-white/10" />
            </div>
            {content}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


type SessionFilter = 'all' | 'mcq' | 'flashcard';

function SavedSessionsBrowser({ courseId, onSelectSession }: { courseId?: string, onSelectSession: (session: any, questions: any[]) => void }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestionsId, setLoadingQuestionsId] = useState<string | null>(null);
  const [filter, setFilter] = useState<SessionFilter>('all');

  useEffect(() => {
    const fetchSessions = async () => {
      if (!courseId) return;
      setLoading(true);
      const res = await getQuestionSessions(courseId);
      if (res.data) setSessions(res.data);
      setLoading(false);
    };
    fetchSessions();
  }, [courseId]);

  const handleSelect = async (session: any) => {
    setLoadingQuestionsId(session.id);
    const res = await getSessionQuestions(session.id, courseId!);
    if (res.data) {
      onSelectSession(session, res.data);
    }
    setLoadingQuestionsId(null);
  };

  const filteredSessions = filter === 'all' 
    ? sessions 
    : sessions.filter(s => s.type === filter);

  const mcqCount = sessions.filter(s => s.type === 'mcq').length;
  const flashcardCount = sessions.filter(s => s.type === 'flashcard').length;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center opacity-40">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center opacity-40">
        <BookOpen className="w-10 h-10 mb-3" />
        <p className="text-sm font-medium">No saved sessions yet.</p>
        <p className="text-[11px]">Generate and save a set of questions to see them here.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 overflow-y-auto max-h-full">
      {/* Type filter tabs */}
      {/* Type filter tabs */}
      <div className="flex items-center gap-1.5 px-1 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
            filter === 'all'
              ? 'bg-white/10 text-foreground border border-white/10 shadow-lg shadow-black/20'
              : 'text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-white/[0.03] border border-transparent'
          }`}
        >
          All ({sessions.length})
        </button>
        {mcqCount > 0 && (
          <button
            onClick={() => setFilter('mcq')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              filter === 'mcq'
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                : 'text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-white/[0.03] border border-transparent'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            MCQs ({mcqCount})
          </button>
        )}
        {flashcardCount > 0 && (
          <button
            onClick={() => setFilter('flashcard')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              filter === 'flashcard'
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                : 'text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-white/[0.03] border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Flashcards ({flashcardCount})
          </button>
        )}
      </div>

      {/* Session list */}
      <div className="space-y-2">
        {filteredSessions.map((session) => (
          <button
            key={session.id}
            onClick={() => handleSelect(session)}
            disabled={loadingQuestionsId !== null}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 active:bg-white/[0.06] active:border-indigo-500/40 transition-all group relative overflow-hidden"
          >
            {/* Subtle row highlight for premium feel */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/[0.02] to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border text-[10px] font-bold shadow-inner transition-transform group-active:scale-90",
                session.type === 'mcq' 
                   ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                   : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
              )}>
                {session.type === 'mcq' ? <ListChecks className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
              </div>
              <div className="text-left">
                <p className="font-bold text-[15px] lg:text-[14px] group-hover:text-foreground transition-colors tracking-tight text-foreground/90 leading-tight mb-1">
                  {session.title || "Untitled Session"}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40 font-medium">
                  <Calendar className="w-3 h-3" />
                  {new Date(session.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="relative z-10">
              {loadingQuestionsId === session.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/5 text-muted-foreground/20 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                  <ChevronRightIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          </button>
        ))}

        {filteredSessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
            <p className="text-[12px] font-medium">No {filter === 'mcq' ? 'MCQ' : 'Flashcard'} sessions saved yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
