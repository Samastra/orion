'use client';

import React, { useState } from 'react';
import { MCQCard, MCQQuestion } from './MCQCard';
import { 
  ChevronLeft, 
  ChevronRight, 
  Trophy, 
  RotateCcw, 
  BookOpen, 
  Sparkles, 
  Check,
  Layers
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { saveMCQAttempt, createQuestionSession } from "@/lib/supabase/actions";
import { toast } from "sonner";

interface MCQSessionProps {
  questions: MCQQuestion[];
  onReset: () => void;
  courseId?: string;
  suggestedTitle?: string;
}

export function MCQSession({ questions, onReset, courseId, suggestedTitle }: MCQSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<boolean[]>(new Array(questions.length).fill(false));
  const [results, setResults] = useState<(boolean | null)[]>(new Array(questions.length).fill(null));
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [sessionTitle, setSessionTitle] = useState(suggestedTitle || '');
  const [selectedIndices, setSelectedIndices] = useState<(number | null)[]>(new Array(questions.length).fill(null));

  // Reset state when new questions are provided
  React.useEffect(() => {
    setCurrentIndex(0);
    setScore(0);
    setAnswered(new Array(questions.length).fill(false));
    setResults(new Array(questions.length).fill(null));
    setSelectedIndices(new Array(questions.length).fill(null));
    setIsReviewing(false);
    setIsSaved(false);
  }, [questions]);

  React.useEffect(() => {
    if (suggestedTitle) setSessionTitle(suggestedTitle);
  }, [suggestedTitle]);

  const totalAnswered = answered.filter(Boolean).length;
  const allDone = totalAnswered === questions.length;

  const handleAnswer = async (index: number, isCorrect: boolean) => {
    if (answered[currentIndex]) return;
    
    // Optimistic UI updates
    const newAnswered = [...answered];
    newAnswered[currentIndex] = true;
    setAnswered(newAnswered);

    const newResults = [...results];
    newResults[currentIndex] = isCorrect;
    setResults(newResults);

    const newIndices = [...selectedIndices];
    newIndices[currentIndex] = index;
    setSelectedIndices(newIndices);

    if (isCorrect) setScore((s: number) => s + 1);

    // Persist to DB if we have a courseId
    if (courseId) {
      try {
        const question = questions[currentIndex];
        const res = await saveMCQAttempt(courseId, question.question, isCorrect);
        if (res?.error) {
          toast.error("Sync failed: " + res.error);
        } else {
          // Optional: toast.success("Progress synced"); 
          // We'll keep it silent for success to avoid cluttering, 
          // or just show it briefly.
        }
      } catch (err) {
        console.error("Failed to save MCQ result:", err);
        toast.error("Failed to sync progress. Is the database table created?");
      }
    }
  };

  const handleSaveSession = async () => {
    if (!courseId || isSaving || isSaved) return;
    setIsSaving(true);
    try {
      const res = await createQuestionSession(courseId, sessionTitle || "Untitled Session", 'mcq', questions);
      if (res.error) {
        toast.error(res.error);
      } else {
        setIsSaved(true);
        toast.success("Question batch saved to course!");
      }
    } catch (err) {
      toast.error("Failed to save session");
    } finally {
      setIsSaving(true); // Keep it disabled
      setIsSaving(false);
    }
  };

  const goTo = (index: number) => {
    if (index >= 0 && index < questions.length) setCurrentIndex(index);
  };

  if (allDone && !isReviewing) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="h-full overflow-y-auto p-4 lg:p-6 bg-background scrollbar-none" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
        <div className="min-h-full flex items-center justify-center py-10">
          <div className="text-center space-y-5 lg:space-y-6 w-full max-w-lg animate-in fade-in zoom-in duration-500">
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center mx-auto">
              <Trophy className="w-7 h-7 lg:w-8 lg:h-8 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl lg:text-2xl font-bold text-foreground">Session Complete!</h2>
              <p className="text-muted-foreground/60 text-sm">
                You scored <span className="text-foreground font-bold">{score}/{questions.length}</span> ({percentage}%)
              </p>
            </div>

            {/* Score bar */}
            <div className="w-full bg-white/[0.04] rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  percentage >= 90 ? 'bg-emerald-500' : percentage >= 70 ? 'bg-indigo-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <p className="text-[13px] text-muted-foreground/40">
              {percentage >= 90 ? 'Mastery achieved! 🎉' : percentage >= 70 ? 'Excellent work! Keep it up.' : percentage >= 50 ? 'Good effort! Review the tricky ones.' : 'Keep studying — you\'ll get there! 💪'}
            </p>

            {/* Results grid */}
            <div className="flex flex-wrap gap-1.5 justify-center max-h-[120px] overflow-y-auto scrollbar-none">
              {results.map((r: boolean | null, i: number) => (
                <button
                  key={i}
                  onClick={() => { setCurrentIndex(i); setIsReviewing(true); }}
                  className={`w-8 h-8 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center text-[11px] font-bold cursor-pointer transition-all active:scale-90 ${
                    r ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              {courseId && !isSaved && (
                <div className="flex flex-col gap-2.5 p-4 bg-white/[0.03] rounded-xl border border-white/5">
                   <div className="flex items-center gap-2 px-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">AI Suggested Title</span>
                   </div>
                   <input 
                     type="text"
                     value={sessionTitle}
                     onChange={(e) => setSessionTitle(e.target.value)}
                     className="bg-white/[0.03] border border-white/5 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm font-bold text-foreground placeholder:text-muted-foreground/30 px-3 py-2 w-full"
                     placeholder="Enter session title..."
                   />
                   <Button 
                     onClick={handleSaveSession} 
                     disabled={isSaving}
                     className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 rounded-lg h-10 gap-2 text-xs font-bold transition-all hover:translate-y-[-1px] active:translate-y-[0px] active:shadow-none"
                   >
                     {isSaving ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                     Save Batch to Course
                   </Button>
                </div>
              )}

              {isSaved && (
                <div className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-400 text-[11px] font-bold uppercase tracking-widest">
                  <Check className="w-4 h-4" />
                  Batch Saved
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 lg:gap-3">
                <Button onClick={() => setIsReviewing(true)} variant="outline" className="border-white/5 bg-white/5 hover:bg-white/10 text-foreground rounded-xl gap-2 h-11 lg:h-12 font-bold transition-all active:scale-[0.98]">
                  <BookOpen className="w-4 h-4" />
                  Review
                </Button>
                <Button onClick={onReset} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2 h-11 lg:h-12 font-bold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] border border-indigo-700/50 transition-all active:scale-[0.98]">
                  <RotateCcw className="w-4 h-4" />
                  New Set
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Progress bar / Review header */}
      <div className="shrink-0 px-5 pt-3 pb-1 border-b border-white/[0.04]">
        {isReviewing ? (
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Review Mode</span>
              <span className="text-[13px] font-semibold text-foreground">Question {currentIndex + 1} of {questions.length}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsReviewing(false)}
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground bg-white/5 rounded-lg h-8 px-3"
            >
              Back to Results
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground/50">
              {totalAnswered} of {questions.length} answered
            </span>
            <span className="text-[11px] font-bold text-indigo-400">
              Score: {score}/{totalAnswered}
            </span>
          </div>
        )}
        
        {!isReviewing && (
          <div className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${(totalAnswered / questions.length) * 100}%` }}
            />
          </div>
        )}

        {/* Question dots */}
        <div className="flex gap-1 mt-2 justify-center pb-2 overflow-x-auto scrollbar-none max-w-full px-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`min-w-[20px] lg:w-6 h-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                i === currentIndex
                  ? 'bg-indigo-500'
                  : results[i] === true
                    ? 'bg-emerald-500/40'
                    : results[i] === false
                      ? 'bg-rose-500/40'
                      : 'bg-white/[0.06]'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-5 py-2 lg:py-4">
        <MCQCard
          key={currentIndex}
          question={questions[currentIndex]}
          questionNumber={currentIndex + 1}
          onAnswer={handleAnswer}
          initialSelected={selectedIndices[currentIndex]}
          initialRevealed={answered[currentIndex] || isReviewing}
        />
      </div>

      {/* Navigation */}
      <div className="shrink-0 px-4 lg:px-5 pb-4 flex items-center justify-between" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
        <Button
          variant="ghost"
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="text-muted-foreground/50 hover:text-foreground gap-1.5 text-[12px] h-10 lg:h-9 px-3"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>
        <Button
          variant="ghost"
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex === questions.length - 1}
          className="text-muted-foreground/50 hover:text-foreground gap-1.5 text-[12px] h-10 lg:h-9 px-3"
        >
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
