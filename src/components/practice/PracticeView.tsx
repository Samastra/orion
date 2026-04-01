'use client';

import React, { useState, useEffect } from 'react';
import { ListChecks, Layers, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { MCQSession } from './MCQSession';
import { FlashcardSession } from './FlashcardSession';
import type { MCQQuestion } from './MCQCard';
import type { FlashcardData } from './FlashCard';

type PracticeType = 'mcq' | 'flashcard';

interface PracticeViewProps {
  context: string | string[] | null;
  courseId?: string;
  topicFocus?: string;
  onQuestionsGenerated?: (questions: any[], type: PracticeType) => void;
}

export function PracticeView({ context, courseId, topicFocus, onQuestionsGenerated }: PracticeViewProps) {
  const [practiceType, setPracticeType] = useState<PracticeType>('mcq');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[] | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardData[] | null>(null);

  const hasActiveSession = practiceType === 'mcq' ? mcqQuestions !== null : flashcards !== null;

  const generate = async () => {
    if (!context) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, type: practiceType, topicFocus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Error ${res.status}`);
      }

      const data = await res.json();

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
      setError(err.message || 'Failed to generate. Try again.');
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
        <PracticeTabs type={practiceType} setType={(t) => { setPracticeType(t); reset(); }} />
        <div className="flex-1 min-h-0">
          <MCQSession questions={mcqQuestions} onReset={generate} courseId={courseId} />
        </div>
      </div>
    );
  }

  if (flashcards && practiceType === 'flashcard') {
    return (
      <div className="h-full flex flex-col">
        <PracticeTabs type={practiceType} setType={(t) => { setPracticeType(t); reset(); }} />
        <div className="flex-1 min-h-0">
          <FlashcardSession cards={flashcards} onReset={generate} />
        </div>
      </div>
    );
  }

  // Default: empty state / generate prompt
  return (
    <div className="h-full flex flex-col">
      <PracticeTabs type={practiceType} setType={setPracticeType} />

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
                <p className="text-[12px] text-muted-foreground/40">{error}</p>
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
                    ? `Generate 10 ${practiceType === 'mcq' ? 'exam-style questions' : 'study flashcards'} from your document.`
                    : 'Upload a document first to start practicing.'
                  }
                </p>
              </div>
              {context && (
                <Button onClick={generate} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2 px-5 text-[12px]">
                  Generate 10
                  <ArrowRight className="w-3.5 h-3.5" />
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
function PracticeTabs({ type, setType }: { type: PracticeType; setType: (t: PracticeType) => void }) {
  return (
    <div className="shrink-0 px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
      <button
        onClick={() => setType('mcq')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
          type === 'mcq'
            ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
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
            ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
            : 'text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-white/[0.03] border border-transparent'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        Flashcards
      </button>
    </div>
  );
}
