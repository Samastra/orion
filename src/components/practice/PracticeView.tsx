import React, { useState, useEffect } from 'react';
import { ListChecks, Layers, ArrowRight, Loader2, AlertCircle, BookOpen, Calendar, ChevronRight as ChevronRightIcon, Settings2, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MCQSession } from './MCQSession';
import { FlashcardSession } from './FlashcardSession';
import type { MCQQuestion } from './MCQCard';
import type { FlashcardData } from './FlashCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  topicFocus?: string;
  initialType?: PracticeType;
  autoGenerate?: boolean;
  onQuestionsGenerated?: (questions: any[], type: PracticeType) => void;
}

export function PracticeView({ context, courseId, topicFocus, initialType, autoGenerate, onQuestionsGenerated }: PracticeViewProps) {
  const [practiceType, setPracticeType] = useState<PracticeType>(initialType || 'mcq');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[] | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardData[] | null>(null);
  const [suggestedTitle, setSuggestedTitle] = useState<string>('');
  
  // Practice configuration state
  const [config, setConfig] = useState<PracticeConfig>({
    count: 10,
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

  const generate = async () => {
    if (!context || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          context, 
          type: practiceType, 
          topicFocus,
          count: config.count,
          difficulty: config.difficulty
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

  // Active session view
  if (mcqQuestions && practiceType === 'mcq') {
    return (
      <div className="h-full flex flex-col">
        <PracticeTabs 
          type={practiceType} 
          setType={(t) => { setPracticeType(t); reset(); }} 
          showSaved={() => setPracticeType('saved')}
          config={config}
          onConfigChange={setConfig}
          isOpen={isConfigOpen}
          setIsOpen={setIsConfigOpen}
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
          showSaved={() => setPracticeType('saved')}
          config={config}
          onConfigChange={setConfig}
          isOpen={isConfigOpen}
          setIsOpen={setIsConfigOpen}
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
      />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-5 max-w-sm">
          {isGenerating ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center mx-auto">
                <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground/80">Generating {practiceType === 'mcq' ? 'questions' : 'flashcards'}...</h3>
                <p className="text-[12px] text-muted-foreground/40">Analyzing your document content</p>
              </div>
            </>
          ) : error ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/15 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7 text-rose-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground/80">Generation failed</h3>
                <p className="text-[12px] text-muted-foreground/40 leading-relaxed px-4">{error}</p>
              </div>
              <Button onClick={generate} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2 px-5 text-[12px]">
                Try Again
              </Button>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
                {practiceType === 'mcq'
                  ? <ListChecks className="w-7 h-7 text-muted-foreground/30" />
                  : <Layers className="w-7 h-7 text-muted-foreground/30" />
                }
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground/80">
                  {practiceType === 'mcq' ? 'Multiple Choice Questions' : 'Flashcards'}
                </h3>
                <p className="text-[12px] text-muted-foreground/40 leading-relaxed">
                  {context
                    ? `Generate ${config.count} ${practiceType === 'mcq' ? 'exam-style questions' : 'study flashcards'} from your document.`
                    : 'Upload a document first to start practicing.'
                  }
                </p>
              </div>
              {context && (
                <Button 
                  onClick={generate} 
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2 px-6 h-11 text-[13px] font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 transition-all hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-none"
                >
                  Generate {config.count}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
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
  setIsOpen
}: { 
  type: PracticeType; 
  setType: (t: PracticeType) => void; 
  showSaved?: () => void;
  config: PracticeConfig;
  onConfigChange: (c: PracticeConfig) => void;
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
}) {
  return (
    <div className="shrink-0 px-3 py-2 border-b border-white/[0.06] flex items-center justify-between bg-black/20 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setType('mcq')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
            type === 'mcq'
              ? 'bg-indigo-600 text-white border border-indigo-700/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]'
              : 'text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-white/[0.03] border border-transparent'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          MCQs
        </button>
        <button
          onClick={() => setType('flashcard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
            type === 'flashcard'
              ? 'bg-indigo-600 text-white border border-indigo-700/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]'
              : 'text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-white/[0.03] border border-transparent'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Flashcards
        </button>
        <div className="w-px h-4 bg-white/5 mx-1" />
        <button
          onClick={() => setType('saved')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
            type === 'saved'
              ? 'bg-indigo-600 text-white border border-indigo-700/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]'
              : 'text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-white/[0.03] border border-transparent'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Saved
        </button>
      </div>

      {/* Settings Dialog Trigger */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="p-2 rounded-lg text-muted-foreground/40 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer group">
            <Settings2 className="w-4 h-4 transition-transform group-hover:rotate-90 duration-500" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-sm bg-[#0a0a0b] border-white/10 p-0 overflow-hidden shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 border-b border-white/5 bg-white/[0.01]">
            <DialogTitle className="text-lg font-bold tracking-tight text-white uppercase">Practice Config</DialogTitle>
            <p className="text-[11px] text-muted-foreground/40 font-medium mt-1">Fine-tune the AI lecturer's question generation</p>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Question Count</Label>
                <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{config.count} items</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[5, 10, 15, 20, 25].map((num) => (
                  <button
                    key={num}
                    onClick={() => onConfigChange({ ...config, count: num })}
                    className={cn(
                      "h-9 rounded-lg border text-[11px] font-bold transition-all hover:translate-y-[-1px] active:translate-y-[0px]",
                      config.count === num
                        ? "bg-indigo-600 text-white border-indigo-700/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                        : "bg-white/[0.02] border-white/5 text-muted-foreground/40 hover:border-white/10 hover:text-muted-foreground/60"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Difficulty Level</Label>
              <Select 
                value={config.difficulty} 
                onValueChange={(val: Difficulty) => onConfigChange({ ...config, difficulty: val })}
              >
                <SelectTrigger className="w-full bg-white/[0.02] border-white/10 rounded-xl h-11 text-[13px] font-medium focus:ring-indigo-500 shadow-sm transition-all hover:border-white/20">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0f12] border-white/10 rounded-xl shadow-2xl">
                  <SelectItem value="Easy" className="text-[13px] font-medium focus:bg-indigo-500/20 focus:text-indigo-400">Easy</SelectItem>
                  <SelectItem value="Medium" className="text-[13px] font-medium focus:bg-indigo-500/20 focus:text-indigo-400">Medium</SelectItem>
                  <SelectItem value="Hard" className="text-[13px] font-medium focus:bg-indigo-500/20 focus:text-indigo-400">Hard</SelectItem>
                  <SelectItem value="Exam-style" className="text-[13px] font-black uppercase italic text-indigo-400 focus:bg-indigo-500/20">Exam-style</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground/30 italic leading-relaxed">
                {config.difficulty === 'Easy' && "Straightforward recall and basic terminology."}
                {config.difficulty === 'Medium' && "A balanced mix of concepts and scenarios."}
                {config.difficulty === 'Hard' && "Complex clinical reasoning and integrated facts."}
                {config.difficulty === 'Exam-style' && "Board-exam complexity (NAPLEX/FPGEC style)."}
              </p>
            </div>
          </div>

          <div className="p-4 bg-white/[0.01] border-t border-white/5">
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11 text-[12px] font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 transition-all hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-none"
              onClick={() => setIsOpen(false)}
            >
              Apply Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { getQuestionSessions, getSessionQuestions } from '@/lib/supabase/actions';

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
      <div className="flex items-center gap-1.5 px-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-white/10 text-foreground border border-white/10'
              : 'text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-white/[0.03] border border-transparent'
          }`}
        >
          All ({sessions.length})
        </button>
        {mcqCount > 0 && (
          <button
            onClick={() => setFilter('mcq')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              filter === 'mcq'
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                : 'text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-white/[0.03] border border-transparent'
            }`}
          >
            <ListChecks className="w-3 h-3" />
            MCQs ({mcqCount})
          </button>
        )}
        {flashcardCount > 0 && (
          <button
            onClick={() => setFilter('flashcard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              filter === 'flashcard'
                ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
                : 'text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-white/[0.03] border border-transparent'
            }`}
          >
            <Layers className="w-3 h-3" />
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
            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center border text-[10px] font-bold",
                session.type === 'mcq' 
                   ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                   : "bg-violet-500/10 border-violet-500/20 text-violet-400"
              )}>
                {session.type === 'mcq' ? 'MCQ' : 'FLSH'}
              </div>
              <div className="text-left">
                <p className="font-bold text-[14px] group-hover:text-foreground transition-colors tracking-tight text-foreground/90 leading-none mb-1">
                  {session.title || "Untitled Session"}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40 font-medium italic">
                  <Calendar className="w-3 h-3" />
                  {new Date(session.created_at).toLocaleDateString()}
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    session.type === 'mcq' 
                      ? 'bg-indigo-500/10 text-indigo-400' 
                      : 'bg-violet-500/10 text-violet-400'
                  }`}>
                    {session.type === 'mcq' ? 'Practice as MCQ' : 'Practice as Flashcards'}
                  </span>
                </div>
              </div>
            </div>
            {loadingQuestionsId === session.id ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-muted-foreground/20 group-hover:text-indigo-400 transition-all" />
            )}
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
